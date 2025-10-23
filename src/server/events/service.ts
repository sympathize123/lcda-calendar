import { differenceInMilliseconds, isWithinInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { RRule, Weekday } from "rrule";
import { prisma } from "@/server/db/client";
import type { Event } from "@/generated/prisma";
import { format } from "date-fns";

export type RecurrenceRuleInput = {
  weekdays: number[];
  interval?: number;
  count?: number;
  until?: string;
};

export type CalendarEventResponse = {
  id: string;
  sourceEventId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  color: string;
  start: string;
  end: string;
  timezone: string;
  isRecurring: boolean;
  recurrenceSummary?: string;
  recurrence?: RecurrenceRuleInput | null;
};

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

export class EventConflictError extends Error {
  constructor(message = "Schedule conflict") {
    super(message);
    this.name = "EventConflictError";
  }
}

export async function getEventsInRange(start: Date, end: Date) {
  const rawEvents = await prisma.event.findMany({
    where: {
      AND: [
        { start: { lte: end } },
        {
          OR: [{ end: { gte: start } }, { recurrenceRule: { not: null } }],
        },
      ],
    },
    orderBy: {
      start: "asc",
    },
  });

  return expandEvents(rawEvents, start, end);
}

async function assertNoConflict(
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const conflicts = await getEventsInRange(start, end);
  const hasConflict = conflicts.some(
    (event) => event.sourceEventId !== excludeId,
  );
  if (hasConflict) {
    throw new EventConflictError("해당 시간에는 이미 예약된 일정이 있습니다.");
  }
}

export async function createEvent(payload: {
  title: string;
  description?: string | null;
  location?: string | null;
  color: string;
  start: Date;
  end: Date;
  timezone: string;
  recurrence?: RecurrenceRuleInput | null;
}) {
  await assertNoConflict(payload.start, payload.end);
  const record = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      color: payload.color,
      start: payload.start,
      end: payload.end,
      timezone: payload.timezone,
      recurrenceRule: payload.recurrence
        ? JSON.stringify(payload.recurrence)
        : null,
    },
  });

  return expandEvents([record], payload.start, payload.end);
}

export async function updateEvent(
  id: string,
  payload: {
    title: string;
    description?: string | null;
    location?: string | null;
    color: string;
    start: Date;
    end: Date;
    timezone: string;
    recurrence?: RecurrenceRuleInput | null;
  },
) {
  await assertNoConflict(payload.start, payload.end, id);
  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      color: payload.color,
      start: payload.start,
      end: payload.end,
      timezone: payload.timezone,
      recurrenceRule: payload.recurrence
        ? JSON.stringify(payload.recurrence)
        : null,
    },
  });
  return expandEvents([updated], payload.start, payload.end);
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({
    where: { id },
  });
}

function expandEvents(events: Event[], rangeStart: Date, rangeEnd: Date) {
  const expanded: CalendarEventResponse[] = [];

  for (const event of events) {
    const baseDuration = Math.max(
      differenceInMilliseconds(event.end, event.start),
      30 * 60 * 1000,
    );
    const recurrence = parseRecurrence(event.recurrenceRule);

    if (!recurrence) {
      if (
        isWithinInterval(event.start, { start: rangeStart, end: rangeEnd }) ||
        isWithinInterval(event.end, { start: rangeStart, end: rangeEnd }) ||
        (event.start <= rangeStart && event.end >= rangeEnd)
      ) {
        expanded.push(
          toResponse(event, event.start, event.end, false, null, null),
        );
      }
      continue;
    }

    const rule = buildRRule(event.start, recurrence);
    const occurrences = rule.between(rangeStart, rangeEnd, true);
    const summary = buildRecurrenceSummary(recurrence);

    for (const occurrence of occurrences) {
      const start = occurrence;
      const end = new Date(start.getTime() + baseDuration);
      expanded.push(toResponse(event, start, end, true, summary, recurrence));
    }
  }

  return expanded.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

function parseRecurrence(value: string | null): RecurrenceRuleInput | null {
  if (!value) return null;
  try {
    const data = JSON.parse(value) as RecurrenceRuleInput;
    if (!data.weekdays || data.weekdays.length === 0) {
      return null;
    }
    return data;
  } catch (error) {
    console.error("Failed to parse recurrence rule", error);
    return null;
  }
}

function buildRRule(start: Date, rule: RecurrenceRuleInput) {
  return new RRule({
    freq: RRule.WEEKLY,
    interval: rule.interval ?? 1,
    byweekday: rule.weekdays.map((d) => WEEKDAY_MAP[d]),
    dtstart: start,
    count: rule.count,
    until: rule.until ? new Date(rule.until) : undefined,
  });
}

function toResponse(
  event: Event,
  start: Date,
  end: Date,
  recurring: boolean,
  summary: string | null,
  recurrence: RecurrenceRuleInput | null,
): CalendarEventResponse {
  return {
    id: recurring ? `${event.id}:${start.toISOString()}` : event.id,
    sourceEventId: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    color: event.color,
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: event.timezone,
    isRecurring: recurring,
    recurrenceSummary: summary ?? undefined,
    recurrence: recurrence ?? undefined,
  };
}

function buildRecurrenceSummary(rule: RecurrenceRuleInput | null) {
  if (!rule) return null;
  const weekdayNames = rule.weekdays
    .map((day) => formatWeekday(day))
    .join(", ");
  const intervalText = rule.interval && rule.interval > 1 ? `${rule.interval}주마다` : "매주";

  if (rule.count) {
    return `${intervalText} ${weekdayNames} · ${rule.count}회`;
  }

  if (rule.until) {
    return `${intervalText} ${weekdayNames} · ${format(new Date(rule.until), "M월 d일", { locale: ko })}까지`;
  }

  return `${intervalText} ${weekdayNames}`;
}

function formatWeekday(day: number) {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  return names[day] ?? "";
}
