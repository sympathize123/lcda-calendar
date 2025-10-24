import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowsClockwise } from "phosphor-react";
import {
  endOfDay,
  format,
  isSameDay,
  set,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent } from "../types";
import { eventOverlapsRange, getWeekDays, WEEK_STARTS_ON } from "../utils";
import { cn } from "@/lib/utils";

const TOTAL_SLOTS = 48;
const MINUTES_PER_SLOT = 30;
const MIN_TIMELINE_WIDTH = 860;

type WeekTimelineProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  onSelectSlot: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

export function WeekTimeline({
  anchorDate,
  events,
  onSelectSlot,
  onEventClick,
}: WeekTimelineProps) {
  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const timeSlots = useMemo(
    () => Array.from({ length: TOTAL_SLOTS }, (_, index) => index),
    [],
  );
  const weekStart = useMemo(
    () => startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON }),
    [anchorDate],
  );

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    updateNow();
    const timer = setInterval(updateNow, 60_000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentWeek = useMemo(() => {
    if (!now) {
      return false;
    }
    return isSameDay(weekStart, startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }));
  }, [now, weekStart]);

  const currentOffset = useMemo(() => {
    if (!now) {
      return null;
    }
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return `calc(${currentMinutes} * (100% / 1440))`;
  }, [now]);

  return (
    <div className="min-h-[640px] overflow-x-auto rounded-[var(--radius-lg)] border border-border/60 bg-surface shadow-[var(--shadow-soft)]">
      <div className="min-w-[860px]" style={{ minWidth: MIN_TIMELINE_WIDTH }}>
        <div className="grid grid-cols-[80px_minmax(0,1fr)]">
          <div className="border-b border-border/60 bg-surface-muted px-3 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Time
          </div>
          <div className="grid grid-cols-7 border-b border-border/60 bg-surface-muted text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="flex flex-col gap-1 py-3">
                <span>{format(day, "EEE", { locale: ko })}</span>
                <span className="text-base font-semibold text-foreground">
                  {format(day, "M/d", { locale: ko })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[80px_minmax(0,1fr)]">
          <div className="relative border-r border-border/60">
            <div className="grid grid-rows-[repeat(48,minmax(32px,1fr))]">
              {timeSlots.map((slot) => (
                <div
                  key={`time-${slot}`}
                  className={cn(
                    "border-b border-border/40 bg-transparent text-right text-xs text-muted",
                    slot % 2 === 0 && "pr-3 pt-1 font-medium text-foreground",
                  )}
                >
                  {slot % 2 === 0 ? formatSlotLabel(slot) : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-x-hidden md:overflow-x-hidden">
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const dayEvents = events
                  .filter((event) => eventOverlapsRange(event, dayStart, dayEnd))
                  .sort((a, b) => a.start.getTime() - b.start.getTime());

                return (
                  <div
                    key={day.toISOString()}
                    className="relative border-l border-border/60"
                  >
                    <div className="grid grid-rows-[repeat(48,minmax(32px,1fr))]">
                      {timeSlots.map((slot) => {
                        const minutes = slot * MINUTES_PER_SLOT;
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        const slotDate = createSlotDate(day, hours, mins);

                        return (
                          <button
                            type="button"
                            key={`${day.toISOString()}-${slot}`}
                            onClick={() => onSelectSlot(slotDate)}
                            className={cn(
                              "relative flex h-full w-full items-start justify-start border-b border-border/30 bg-surface-elevated/60 text-left text-xs text-muted transition hover:bg-primary-soft/40",
                              slot % 2 === 0 && "bg-surface",
                            )}
                          />
                        );
                      })}
                    </div>

                    <div className="pointer-events-none absolute inset-x-1 inset-y-0">
                      <AnimatePresence initial={false}>
                        {dayEvents.map((event) => {
                          const clampedStart = event.start < dayStart ? dayStart : event.start;
                          const clampedEnd = event.end > dayEnd ? dayEnd : event.end;
                          const startSlot = Math.max(0, Math.min(getSlotIndex(clampedStart), TOTAL_SLOTS));
                          const endSlot = Math.max(startSlot + 1, Math.min(getSlotIndex(clampedEnd), TOTAL_SLOTS));
                          const span = Math.max(endSlot - startSlot, 1);
                          const top = `${(startSlot / TOTAL_SLOTS) * 100}%`;
                          const height = `${(span / TOTAL_SLOTS) * 100}%`;

                          return (
                            <motion.button
                              type="button"
                              key={event.id}
                              style={{ top, height, backgroundColor: event.color }}
                              className="pointer-events-auto absolute left-0 right-0 z-20 mx-1 flex flex-col gap-1 overflow-hidden rounded-[var(--radius-sm)] px-2 py-1 text-left text-xs font-semibold text-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                            >
                              <span className="flex items-center gap-1 truncate">
                                {event.isRecurring ? (
                                  <ArrowsClockwise size={12} weight="bold" className="opacity-80" />
                                ) : null}
                                <span className="truncate">{event.title}</span>
                              </span>
                              <span className="text-[0.65rem] font-normal text-white/80">
                                {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                              </span>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {isCurrentWeek && now && isSameDay(day, now) ? (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-10"
                        style={{ top: currentOffset ?? 0 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-color-today shadow" />
                          <div className="h-[2px] flex-1 bg-color-today/60" />
                          <span className="rounded-full bg-color-today px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-white">
                            {format(now, "HH:mm")}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatSlotLabel(slotIndex: number) {
  const minutes = slotIndex * MINUTES_PER_SLOT;
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? "오후" : "오전";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${suffix} ${String(displayHour).padStart(2, "0")}:00`;
}

function createSlotDate(day: Date, hours: number, minutes: number) {
  return set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
}

function getSlotIndex(date: Date) {
  return date.getHours() * (60 / MINUTES_PER_SLOT) + date.getMinutes() / MINUTES_PER_SLOT;
}
