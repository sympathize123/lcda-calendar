"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent } from "../types";
import { MapPin, Clock, Repeat, X } from "phosphor-react";

type EventDetailSheetProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  isDeleting?: boolean;
};

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeleting,
}: EventDetailSheetProps) {
  if (!event) {
    return null;
  }

  const startText = format(event.start, "yyyy년 M월 d일 (EEE) HH:mm", {
    locale: ko,
  });
  const endText = format(event.end, "HH:mm", { locale: ko });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-md border-l border-border/60 bg-surface p-6 shadow-[var(--shadow-soft)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-xl font-semibold text-foreground">
                {event.title}
              </Dialog.Title>
              <p className="text-sm text-muted">
                {event.recurrenceSummary ?? "단일 일정"}
              </p>
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
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <InfoRow icon={<Clock size={16} />} label="시간">
              {startText} - {endText}
            </InfoRow>

            {event.location ? (
              <InfoRow icon={<MapPin size={16} />} label="장소">
                {event.location}
              </InfoRow>
            ) : null}

            {event.description ? (
              <InfoRow icon={<Repeat size={16} />} label="메모">
                {event.description}
              </InfoRow>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <button
              type="button"
              onClick={() => onDelete(event)}
              disabled={isDeleting}
              className="inline-flex h-10 items-center justify-center rounded-full border border-transparent bg-danger/10 px-4 text-sm font-semibold text-danger transition hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "삭제 중..." : "일정 삭제"}
            </button>
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              일정 수정
            </button>
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
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
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
