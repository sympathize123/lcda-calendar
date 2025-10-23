"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent } from "../types";
import {
  Clock,
  MapPin,
  Repeat,
  X,
  CaretLeft,
} from "phosphor-react";
import { getEventsForDay } from "../utils";
import { ReactNode } from "react";

export type DetailState =
  | { mode: "event"; event: CalendarEvent; date?: Date }
  | { mode: "day"; date: Date };

type EventDetailDialogProps = {
  open: boolean;
  state: DetailState | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent, date?: Date) => void;
  onShowDay: (date: Date) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  isDeleting?: boolean;
};

export function EventDetailDialog({
  open,
  state,
  events,
  onClose,
  onSelectEvent,
  onShowDay,
  onEdit,
  onDelete,
  isDeleting,
}: EventDetailDialogProps) {
  if (!state) {
    return null;
  }

  const selectedEvent = state.mode === "event" ? state.event : null;
  const selectedDate = state.mode === "day"
    ? state.date
    : state.mode === "event"
      ? state.date ?? state.event.start
      : null;

  const dayEvents = selectedDate
    ? getEventsForDay(events, selectedDate).sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      )
    : [];

  const title = state.mode === "event"
    ? state.event.title
    : selectedDate
      ? format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })
      : "";

  const description =
    state.mode === "event"
      ? state.event.recurrenceSummary ?? "단일 일정"
      : "해당 날짜의 모든 일정을 확인하세요.";

  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-border/70 bg-surface shadow-[var(--shadow-soft)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex flex-col gap-6 p-6">
            <header className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-xl font-semibold text-foreground">
                  {title}
                </Dialog.Title>
                <p className="text-sm text-muted">{description}</p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface text-muted transition hover:border-transparent hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <X size={16} weight="bold" />
                </button>
              </Dialog.Close>
            </header>

            {state.mode === "day" ? (
              <div className="flex flex-col gap-3">
                {dayEvents.length === 0 ? (
                  <p className="rounded-[var(--radius-md)] border border-dashed border-border/60 bg-surface-muted px-4 py-6 text-center text-sm text-muted">
                    등록된 일정이 없습니다.
                  </p>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event, selectedDate ?? event.start)}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/60 bg-surface-elevated px-4 py-3 text-left text-sm transition hover:border-primary/60 hover:shadow-md"
                    >
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-foreground">
                          {event.title}
                        </span>
                        <span className="text-xs font-medium text-muted">
                          {format(event.start, "HH:mm", { locale: ko })} -
                          {" "}
                          {format(event.end, "HH:mm", { locale: ko })}
                        </span>
                      </div>
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {state.mode === "event" && selectedEvent ? (
              <div className="flex flex-col gap-4">
                {state.mode === "event" && selectedDate && dayEvents.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onShowDay(selectedDate)}
                    className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted hover:text-primary"
                  >
                    <CaretLeft size={14} weight="bold" /> 목록 보기
                  </button>
                ) : null}

                <InfoRow icon={<Clock size={16} />} label="시간">
                  {format(selectedEvent.start, "yyyy년 M월 d일 (EEE) HH:mm", {
                    locale: ko,
                  })}
                  {" "}- {format(selectedEvent.end, "HH:mm", { locale: ko })}
                </InfoRow>

                {selectedEvent.location ? (
                  <InfoRow icon={<MapPin size={16} />} label="장소">
                    {selectedEvent.location}
                  </InfoRow>
                ) : null}

                {selectedEvent.description ? (
                  <InfoRow icon={<Repeat size={16} />} label="메모">
                    {selectedEvent.description}
                  </InfoRow>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => onDelete(selectedEvent)}
                    disabled={isDeleting}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-transparent bg-danger/10 px-4 text-sm font-semibold text-danger transition hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "삭제 중..." : "일정 삭제"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(selectedEvent)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    일정 수정
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border/60 bg-surface-elevated px-3 py-3 shadow-sm">
      <div className="mt-1 text-muted">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {label}
        </p>
        <div className="mt-1 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}
