import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent, CalendarView } from "./types";

export const WEEK_STARTS_ON: 0 | 1 = 1;

export function getWeekDays(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getMonthMatrix(anchorDate: Date) {
  const start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(endOfMonth(anchorDate), { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start, end });

  const matrix: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    matrix.push(days.slice(i, i + 7));
  }
  return matrix;
}

export function formatRangeLabel(view: CalendarView, anchorDate: Date) {
  if (view === "month") {
    return format(anchorDate, "yyyy년 M월", { locale: ko });
  }

  const start = startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
  const sameMonth = isSameMonth(start, end);

  if (sameMonth) {
    return `${format(start, "M월 d일", { locale: ko })} - ${format(end, "d일", { locale: ko })}`;
  }

  return `${format(start, "M월 d일", { locale: ko })} - ${format(end, "M월 d일", { locale: ko })}`;
}

export function getEventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((event) => isSameDay(event.start, day));
}

export function getEventsForRange(events: CalendarEvent[], start: Date, end: Date) {
  return events.filter((event) =>
    isWithinInterval(event.start, { start, end }) ||
    isWithinInterval(event.end, { start, end }),
  );
}
