"use client";

import { CalendarEvent, EventFormPayload, RecurrenceFormState } from "./types";

export async function fetchEvents(range: {
  start: Date;
  end: Date;
}): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });

  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load events");
  }

  const data = (await res.json()) as {
    events: Array<{
      id: string;
      sourceEventId: string;
      title: string;
      description?: string | null;
      location?: string | null;
      color: string;
      start: string;
      end: string;
      timezone: string;
      isRecurring?: boolean;
      recurrenceSummary?: string;
      recurrence?: {
        weekdays: number[];
        interval?: number;
        count?: number;
        until?: string;
      } | null;
    }>;
  };

  return data.events.map((event) => ({
    id: event.id,
    sourceEventId: event.sourceEventId,
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    color: event.color,
    start: new Date(event.start),
    end: new Date(event.end),
    timezone: event.timezone,
    isRecurring: event.isRecurring,
    recurrenceSummary: event.recurrenceSummary,
    recurrence: event.recurrence ?? undefined,
  }));
}

export async function createEvent(payload: EventFormPayload) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toApiPayload(payload)),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to create event");
  }
}

export async function updateEvent(id: string, payload: EventFormPayload) {
  const res = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toApiPayload(payload)),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to update event");
  }
}

export async function deleteEvent(id: string) {
  const res = await fetch(`/api/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to delete event");
  }
}

function toApiPayload(payload: EventFormPayload) {
  return {
    title: payload.title,
    description: payload.description ?? null,
    location: payload.location ?? null,
    color: payload.color,
    start: payload.start.toISOString(),
    end: payload.end.toISOString(),
    timezone: payload.timezone,
    recurrence: normalizeRecurrence(payload.recurrence),
  };
}

function normalizeRecurrence(recurrence: RecurrenceFormState | undefined) {
  if (!recurrence || !recurrence.weekdays || recurrence.weekdays.length === 0) {
    return null;
  }

  return {
    weekdays: recurrence.weekdays,
    interval: recurrence.interval ?? 1,
    count: recurrence.count ?? undefined,
    until: recurrence.until ?? undefined,
  };
}
