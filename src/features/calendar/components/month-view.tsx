import { Fragment, useMemo } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, ArrowsClockwise } from "phosphor-react";
import { CalendarEvent } from "../types";
import { getEventsForDay, getMonthMatrix, getWeekDays } from "../utils";
import { cn } from "@/lib/utils";

type MonthViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

export function MonthView({
  anchorDate,
  events,
  onSelectDay,
  onEventClick,
}: MonthViewProps) {
  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const monthMatrix = useMemo(() => getMonthMatrix(anchorDate), [anchorDate]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-7 gap-2 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
        {weekDays.map((day) => (
          <div className="text-center" key={day.toISOString()}>
            {format(day, "EEE", { locale: ko })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {monthMatrix.map((week, weekIndex) => (
          <Fragment key={`week-${weekIndex}`}>
            <div className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dailyEvents = getEventsForDay(events, day);
                const overflowCount = Math.max(0, dailyEvents.length - 3);
                const label = format(day, "yyyy년 M월 d일", { locale: ko });

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "group relative flex min-h-[140px] flex-col gap-2 overflow-hidden rounded-[var(--radius-md)] border border-border/60 bg-surface-elevated p-3 shadow-sm transition hover:border-primary/50 hover:shadow-md",
                      !isSameMonth(day, anchorDate) && "bg-surface-muted text-muted",
                    )}
                    onDoubleClick={() => onSelectDay(day)}
                  >
                    <div className="flex items-start justify-between gap-2 text-sm font-semibold">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm transition",
                          isToday(day)
                            ? "bg-color-today text-white shadow-md"
                            : "text-foreground",
                        )}
                      >
                        {format(day, "d", { locale: ko })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectDay(day)}
                        aria-label={`${label} 일정 추가`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-sm transition hover:bg-primary/90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface group-hover:opacity-100"
                        >
                          <Plus size={16} weight="bold" />
                        </button>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      {dailyEvents.slice(0, 3).map((event) => (
                        <button
                          type="button"
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className="group/event relative inline-flex items-center gap-2 overflow-hidden rounded-[var(--radius-sm)] px-2 py-1 text-left text-xs font-medium text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                          style={{
                            backgroundColor: event.color,
                          }}
                        >
                          {event.isRecurring ? (
                            <ArrowsClockwise
                              weight="bold"
                              size={12}
                              className="opacity-90"
                            />
                          ) : null}
                          <span className="truncate">{event.title}</span>
                        </button>
                      ))}
                    </div>

                    {overflowCount > 0 ? (
                      <button
                        type="button"
                        className="text-left text-xs font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => onEventClick?.(dailyEvents[3])}
                      >
                        + {overflowCount}개의 일정 더보기
                      </button>
                    ) : null}

                    <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)] ring-0 ring-primary/10 transition group-hover:ring-4" />
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
