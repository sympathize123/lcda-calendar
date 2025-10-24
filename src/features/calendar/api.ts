"use client";

import {
  CalendarEvent,
  CalendarMember,
  EventFormPayload,
  RecurrenceFormState,
} from "./types";

export type ClientEventFilters = {
  categories?: string[];
  participantIds?: string[];
  search?: string;
};

export async function fetchEvents(range: {
  start: Date;
  end: Date;
}, filters?: ClientEventFilters): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });

  filters?.categories?.forEach((category) =>
    params.append("category", category),
  );
  filters?.participantIds?.forEach((participant) =>
    params.append("participant", participant),
  );
  if (filters?.search) {
    params.set("search", filters.search);
  }

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
      category: string;
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
      participants: Array<{
        id: string;
        name: string;
        part?: string | null;
        contact?: string | null;
      }>;
    }>;
  };

  return data.events.map((event) => ({
    id: event.id,
    sourceEventId: event.sourceEventId,
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    color: event.color,
    category: event.category,
    start: new Date(event.start),
    end: new Date(event.end),
    timezone: event.timezone,
    isRecurring: event.isRecurring,
    recurrenceSummary: event.recurrenceSummary,
    recurrence: event.recurrence ?? undefined,
    participants: event.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      part: participant.part,
      contact: participant.contact,
    })),
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
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.error ?? "Failed to create event") as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
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
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.error ?? "Failed to update event") as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }
}

export async function deleteEvent(id: string) {
  const res = await fetch(`/api/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.error ?? "Failed to delete event") as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }
}

function toApiPayload(payload: EventFormPayload) {
  return {
    title: payload.title,
    description: payload.description ?? null,
    location: payload.location ?? null,
    color: payload.color,
    category: payload.category,
    start: payload.start.toISOString(),
    end: payload.end.toISOString(),
    timezone: payload.timezone,
    recurrence: normalizeRecurrence(payload.recurrence),
    participantIds: payload.participants,
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

export async function fetchMembers(): Promise<CalendarMember[]> {
  const res = await fetch("/api/members");
  if (!res.ok) {
    throw new Error("Failed to load members");
  }
  const data = (await res.json()) as {
    members: Array<{
      id: string;
      name: string;
      part?: string | null;
      contact?: string | null;
    }>;
  };
  return data.members;
}
