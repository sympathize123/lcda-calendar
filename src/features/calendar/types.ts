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
  timezone: string;
  isRecurring?: boolean;
  recurrenceSummary?: string;
  recurrence?: RecurrenceFormState;
};

export type RecurrenceFormState = {
  weekdays: number[];
  interval?: number;
  count?: number;
  until?: string;
} | null;

export type EventFormPayload = {
  title: string;
  description?: string;
  location?: string;
  color: string;
  start: Date;
  end: Date;
  timezone: string;
  recurrence?: RecurrenceFormState;
};
