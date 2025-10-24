export type CalendarView = "month" | "week";

export type CalendarEvent = {
  id: string;
  sourceEventId: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  color: string;
  category: string;
  timezone: string;
  isRecurring?: boolean;
  recurrenceSummary?: string;
  recurrence?: RecurrenceFormState;
  participants: CalendarMember[];
};

export type RecurrenceFormState = {
  weekdays: number[];
  interval?: number;
  count?: number;
  until?: string;
} | null;

export type CalendarMember = {
  id: string;
  name: string;
  part?: string | null;
  contact?: string | null;
};

export type EventFormPayload = {
  title: string;
  description?: string;
  location?: string;
  color: string;
  category: string;
  start: Date;
  end: Date;
  timezone: string;
  recurrence?: RecurrenceFormState;
  participants: string[];
};
