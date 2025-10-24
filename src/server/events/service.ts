import { differenceInMilliseconds, isWithinInterval, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { RRule, Weekday } from "rrule";
import { prisma } from "@/server/db/client";
import type { Event, EventParticipant, Member } from "@/generated/prisma";
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
  category: string;
  start: string;
  end: string;
  timezone: string;
  isRecurring: boolean;
  recurrenceSummary?: string;
  recurrence?: RecurrenceRuleInput | null;
  participants: Array<{
    id: string;
    name: string;
    part?: string | null;
    contact?: string | null;
  }>;
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

export type EventFilters = {
  categories?: string[];
  participantIds?: string[];
  search?: string;
};

export async function getEventsInRange(
  start: Date,
  end: Date,
  filters?: EventFilters,
) {
  const where: Parameters<typeof prisma.event.findMany>[0]["where"] = {
    AND: [
      { start: { lte: end } },
      {
        OR: [{ end: { gte: start } }, { recurrenceRule: { not: null } }],
      },
    ],
  };

  if (filters?.categories?.length) {
    where.AND?.push({
      category: { in: filters.categories },
    });
  }

  if (filters?.participantIds?.length) {
    where.AND?.push({
      participants: {
        some: {
          memberId: { in: filters.participantIds },
        },
      },
    });
  }

  const searchPatterns =
    filters?.search && filters.search.trim().length > 0
      ? buildSearchPatterns(filters.search)
      : null;

  const rawEvents = await prisma.event.findMany({
    where,
    orderBy: {
      start: "asc",
    },
    include: {
      participants: {
        include: {
          member: true,
        },
      },
    },
  });

  const expanded = expandEvents(rawEvents, start, end);

  if (!searchPatterns || searchPatterns.length === 0) {
    return expanded;
  }

  return expanded.filter((event) => matchesSearch(event, searchPatterns));
}

async function assertNoConflict(
  start: Date,
  end: Date,
  recurrence: RecurrenceRuleInput | null | undefined,
  excludeId?: string,
) {
  const rangeStart = start;
  let rangeEnd = recurrence?.until
    ? new Date(recurrence.until)
    : addMonths(start, 6);
  if (rangeEnd.getTime() < end.getTime()) {
    rangeEnd = end;
  }

  const candidateOccurrences = generateCandidateOccurrences(
    start,
    end,
    recurrence ?? null,
    rangeStart,
    rangeEnd,
  );

  const conflicts = await getEventsInRange(rangeStart, rangeEnd);

  for (const conflict of conflicts) {
    if (excludeId && conflict.sourceEventId === excludeId) {
      continue;
    }
    const conflictStart = new Date(conflict.start);
    const conflictEnd = new Date(conflict.end);
    const overlaps = candidateOccurrences.some(
      (occurrence) =>
        occurrence.start.getTime() <= conflictEnd.getTime() &&
        occurrence.end.getTime() >= conflictStart.getTime(),
    );
    if (overlaps) {
      throw new EventConflictError("해당 시간에는 이미 예약된 일정이 있습니다.");
    }
  }
}

export async function createEvent(payload: {
  title: string;
  description?: string | null;
  location?: string | null;
  color: string;
  category: string;
  start: Date;
  end: Date;
  timezone: string;
  recurrence?: RecurrenceRuleInput | null;
  participantIds?: string[];
}) {
  await assertNoConflict(payload.start, payload.end, payload.recurrence);
  const record = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      color: payload.color,
      category: payload.category,
      start: payload.start,
      end: payload.end,
      timezone: payload.timezone,
      recurrenceRule: payload.recurrence
        ? JSON.stringify(payload.recurrence)
        : null,
      participants: payload.participantIds?.length
        ? {
            createMany: {
              data: payload.participantIds.map((memberId) => ({
                memberId,
              })),
            },
          }
        : undefined,
    },
    include: {
      participants: {
        include: {
          member: true,
        },
      },
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
    category: string;
    start: Date;
    end: Date;
    timezone: string;
    recurrence?: RecurrenceRuleInput | null;
    participantIds?: string[];
  },
) {
  await assertNoConflict(payload.start, payload.end, payload.recurrence, id);
  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      color: payload.color,
      category: payload.category,
      start: payload.start,
      end: payload.end,
      timezone: payload.timezone,
      recurrenceRule: payload.recurrence
        ? JSON.stringify(payload.recurrence)
        : null,
      participants: {
        deleteMany: {},
        createMany:
          payload.participantIds?.length
            ? {
                data: payload.participantIds.map((memberId) => ({ memberId })),
              }
            : undefined,
      },
    },
    include: {
      participants: {
        include: {
          member: true,
        },
      },
    },
  });
  return expandEvents([updated], payload.start, payload.end);
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({
    where: { id },
  });
}

function expandEvents(
  events: (Event & {
    participants: (EventParticipant & { member: Member })[];
  })[],
  rangeStart: Date,
  rangeEnd: Date,
) {
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
  event: Event & {
    participants: (EventParticipant & { member: Member })[];
  },
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
    category: event.category,
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: event.timezone,
    isRecurring: recurring,
    recurrenceSummary: summary ?? undefined,
    recurrence: recurrence ?? undefined,
    participants: event.participants.map((participant) => ({
      id: participant.member.id,
      name: participant.member.name,
      part: participant.member.part,
      contact: participant.member.contact,
    })),
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

function buildSearchPatterns(input: string) {
  const tokens = input
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const patterns = new Set<string>();

  for (const token of tokens) {
    patterns.add(token);
    if (token.length >= 3) {
      const sliceLength = Math.max(2, Math.ceil(token.length * 0.6));
      patterns.add(token.slice(0, sliceLength));
      patterns.add(token.slice(-sliceLength));
    }
  }

  if (tokens.length > 1) {
    patterns.add(tokens.join(" "));
  }

  return Array.from(patterns).map((pattern) => pattern.toLowerCase());
}

function matchesSearch(event: CalendarEventResponse, patterns: string[]) {
  const haystacks = [
    event.title,
    event.description ?? "",
    event.location ?? "",
    event.category ?? "",
    event.recurrenceSummary ?? "",
    event.participants.map((participant) => participant.name).join(" "),
    event.participants
      .map((participant) => participant.part ?? "")
      .filter(Boolean)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return patterns.some((pattern) => haystacks.includes(pattern));
}

function generateCandidateOccurrences(
  start: Date,
  end: Date,
  recurrence: RecurrenceRuleInput | null,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const baseDuration = Math.max(
    differenceInMilliseconds(end, start),
    30 * 60 * 1000,
  );

  if (!recurrence) {
    return [{ start, end }];
  }

  const rule = new RRule({
    freq: RRule.WEEKLY,
    interval: recurrence.interval ?? 1,
    byweekday: recurrence.weekdays.map((d) => WEEKDAY_MAP[d]),
    dtstart: start,
    count: recurrence.count,
    until: recurrence.until ? new Date(recurrence.until) : undefined,
  });

  const occurrences = rule.between(rangeStart, rangeEnd, true);

  return occurrences.map((occurrence) => ({
    start: occurrence,
    end: new Date(occurrence.getTime() + baseDuration),
  }));
}
