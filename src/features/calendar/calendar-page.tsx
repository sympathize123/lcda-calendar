"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  compareAsc,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { CalendarEvent, CalendarView, EventFormPayload } from "./types";
import { EventComposer } from "./components/event-composer";
import { MonthView } from "./components/month-view";
import { WeekTimeline } from "./components/week-timeline";
import {
  DetailState,
  EventDetailDialog,
} from "./components/event-detail-dialog";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "./api";
import { eventOverlapsRange, formatRangeLabel, getEventsForRange, WEEK_STARTS_ON } from "./utils";

type ComposerState = {
  open: boolean;
  mode: "create" | "edit";
  date: Date | null;
  event: CalendarEvent | null;
};

const INITIAL_COMPOSER_STATE: ComposerState = {
  open: false,
  mode: "create",
  date: null,
  event: null,
};

type BannerState = {
  message: string;
  tone: "error" | "success";
};

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [composerState, setComposerState] =
    useState<ComposerState>(INITIAL_COMPOSER_STATE);
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const range = useMemo(() => getViewRange(view, anchorDate), [view, anchorDate]);

  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: [
      "events",
      range.start.toISOString(),
      range.end.toISOString(),
    ],
    queryFn: () => fetchEvents(range),
    staleTime: 30_000,
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const weekRange = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
    return { start, end };
  }, [anchorDate]);

  const weekEvents = useMemo(
    () => getEventsForRange(events, weekRange.start, weekRange.end),
    [events, weekRange],
  );

  const upcomingEvent = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => compareAsc(event.end, now) >= 0)
      .sort((a, b) => compareAsc(a.start, b.start))[0];
  }, [events]);

  const createMutation = useMutation({
    mutationFn: (payload: EventFormPayload) => createEvent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EventFormPayload;
    }) => updateEvent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const handleNavigate = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    setAnchorDate((prev) =>
      view === "month" ? addMonths(prev, delta) : addWeeks(prev, delta),
    );
  };

  const openComposerFor = (date: Date, mode: "create" | "edit", event?: CalendarEvent) => {
    setAnchorDate(date);
    setComposerState({
      open: true,
      mode,
      date,
      event: event ?? null,
    });
  };

  const closeComposer = () =>
    setComposerState((prev) => ({ ...prev, open: false, event: null }));

  const handleCreateShortcut = () =>
    openComposerFor(startOfDay(anchorDate), "create");

  const handleComposerSubmit = async (payload: EventFormPayload) => {
    const hasConflict = events.some((event) => {
      if (
        composerState.mode === "edit" &&
        composerState.event &&
        event.sourceEventId === composerState.event.sourceEventId
      ) {
        return false;
      }
      return eventOverlapsRange(event, payload.start, payload.end);
    });

    if (hasConflict) {
      setBanner({
        message: "해당 시간에는 이미 예약된 일정이 있습니다.",
        tone: "error",
      });
      const conflictError = new Error("SCHEDULE_CONFLICT");
      conflictError.name = "ScheduleConflictError";
      throw conflictError;
    }

    try {
      if (composerState.mode === "edit" && composerState.event) {
        await updateMutation.mutateAsync({
          id: composerState.event.sourceEventId,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeComposer();
    } catch (error) {
      console.error(error);
      const status = (error as { status?: number }).status;
      const message =
        status === 409
          ? "해당 시간에는 이미 예약된 일정이 있습니다."
          : error instanceof Error && error.message && error.name !== "ScheduleConflictError"
            ? error.message
            : "일정 저장에 실패했습니다. 다시 시도해 주세요.";
      setBanner({ message, tone: "error" });
      throw error;
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteMutation.mutateAsync(event.sourceEventId);
      setDetailState(null);
    } catch (error) {
      console.error(error);
      alert("일정 삭제에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const rangeLabel = useMemo(
    () => formatRangeLabel(view, anchorDate),
    [view, anchorDate],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const overlayActive = composerState.open || detailState !== null;

  return (
    <AppShell
      view={view}
      rangeLabel={rangeLabel}
      onViewChange={setView}
      onNavigate={handleNavigate}
      onResetToday={() => setAnchorDate(new Date())}
      onCreateEvent={handleCreateShortcut}
      overlayActive={overlayActive}
    >
      <AnimatePresence>
        {banner ? (
          <motion.div
            key="calendar-banner"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`pointer-events-none fixed top-6 left-1/2 z-[120] -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] ${
              banner.tone === "error"
                ? "bg-danger text-white"
                : "bg-primary text-white"
            }`}
          >
            {banner.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <section className="flex flex-col items-center gap-8">
        <OverviewCard
          upcomingEvent={upcomingEvent}
          anchorDate={anchorDate}
          view={view}
          isLoading={eventsQuery.isLoading}
        />

        <div className="w-full max-w-[1100px] rounded-[var(--radius-lg)] border border-border/60 bg-surface shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {view === "month" ? "월간 캘린더" : "주간 타임라인"}
              </h2>
              {view === "week" ? (
                <p className="text-sm text-muted">
                  구글 캘린더형 30분 슬롯 보드. 시간 칸을 클릭하면 해당 슬롯으로
                  일정 모달이 열립니다.
                </p>
              ) : null}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-muted">
              테스트 버젼 1.0V
            </div>
          </div>

          <div
            className="group relative mt-6 overflow-hidden px-2 pb-6 pt-2"
            onDoubleClick={() => setView(view === "month" ? "week" : "month")}
            role="presentation"
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 flex justify-end text-xs uppercase tracking-[0.24em] text-muted/70">
              Double Click to Toggle View
            </div>

            <AnimatePresence mode="wait">
              {view === "month" ? (
                <motion.div
                  key="month-view"
                  initial={{ opacity: 0, scale: 0.98, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-[var(--radius-lg)] border border-transparent bg-surface px-2 pb-2 pt-4 sm:px-4 sm:pt-6"
                >
                  <MonthView
                    anchorDate={anchorDate}
                    events={events}
                    onEventClick={(event) => {
                      setAnchorDate(event.start);
                      setDetailState({ mode: "event", event, date: event.start });
                    }}
                    onSelectDay={(date) => openComposerFor(date, "create")}
                    onShowDayEvents={(date) => {
                      setAnchorDate(date);
                      setDetailState({ mode: "day", date });
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="week-view"
                  initial={{ opacity: 0, scale: 0.98, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-[var(--radius-lg)] border border-transparent bg-surface px-2 pb-2 pt-4 sm:px-4 sm:pt-6"
                >
                  <WeekTimeline
                    anchorDate={anchorDate}
                    events={weekEvents}
                    onSelectSlot={(date) => openComposerFor(date, "create")}
                    onEventClick={(event) => {
                      setAnchorDate(event.start);
                      setDetailState({ mode: "event", event, date: event.start });
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <EventComposer
        open={composerState.open}
        onOpenChange={(open) => {
          if (!open) {
            closeComposer();
          } else {
            setComposerState((prev) => ({ ...prev, open }));
          }
        }}
        view={view}
        mode={composerState.mode}
        initialDate={composerState.event?.start ?? composerState.date}
        event={composerState.event ?? undefined}
        onSubmit={handleComposerSubmit}
        isSubmitting={isSaving}
      />

      <EventDetailDialog
        open={detailState !== null}
        state={detailState}
        events={events}
        onClose={() => setDetailState(null)}
        onSelectEvent={(event, date) =>
          setDetailState({ mode: "event", event, date })
        }
        onShowDay={(date) => setDetailState({ mode: "day", date })}
        onEdit={(event) => {
          setDetailState(null);
          openComposerFor(event.start, "edit", event);
        }}
        onDelete={handleDeleteEvent}
        isDeleting={deleteMutation.isPending}
      />
    </AppShell>
  );
}

type OverviewCardProps = {
  upcomingEvent?: CalendarEvent;
  anchorDate: Date;
  view: CalendarView;
  isLoading: boolean;
};

function OverviewCard({
  upcomingEvent,
  anchorDate,
  view,
  isLoading,
}: OverviewCardProps) {
  return (
    <div className="w-full max-w-[1100px] rounded-[var(--radius-lg)] border border-border/60 bg-surface px-6 py-5 shadow-[var(--shadow-soft)]">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        Ensemble Overview
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.25rem]">
            {format(anchorDate, "M월 합주 현황", { locale: ko })}
          </p>
          <p className="text-sm text-muted">
            {view === "month"
              ? "월간 보드에서 일정들을 빠르게 배치하고, 더블클릭으로 주간 타임라인으로 전환하세요."
              : "주간 타임라인에서 30분 슬롯을 클릭해 지정된 시간으로 새 일정을 추가할 수 있어요."}
          </p>
        </div>
        {isLoading ? (
          <div className="h-16 min-w-[220px] animate-pulse rounded-[var(--radius-md)] bg-surface-muted" />
        ) : upcomingEvent ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-primary-soft/70 px-4 py-3 text-sm font-medium text-primary shadow-sm">
            <span className="uppercase tracking-[0.22em] text-xs text-primary/80">
              Next Session
            </span>
            <span>{upcomingEvent.title}</span>
            <span className="text-xs text-primary/80">
              {format(upcomingEvent.start, "M월 d일 (EEE) HH:mm", { locale: ko })}{" "}
              - {format(upcomingEvent.end, "HH:mm", { locale: ko })}
            </span>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border/60 px-4 py-3 text-sm text-muted">
            예정된 합주가 없습니다. 첫 일정을 만들어 팀원과 공유해 보세요.
          </div>
        )}
      </div>
    </div>
  );
}

function getViewRange(view: CalendarView, anchorDate: Date) {
  if (view === "month") {
    const start = startOfWeek(startOfMonth(anchorDate), {
      weekStartsOn: WEEK_STARTS_ON,
    });
    const end = endOfWeek(endOfMonth(anchorDate), {
      weekStartsOn: WEEK_STARTS_ON,
    });
    return { start, end };
  }

  const start = startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
  return { start, end };
}
