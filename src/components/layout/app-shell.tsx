import {
  ArrowsLeftRight,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
} from "phosphor-react";
import { ReactNode } from "react";
import { CalendarView } from "@/features/calendar/types";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  view: CalendarView;
  rangeLabel: string;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onResetToday: () => void;
  onCreateEvent: () => void;
  className?: string;
  overlayActive?: boolean;
};

export function AppShell({
  children,
  className,
  view,
  rangeLabel,
  onViewChange,
  onNavigate,
  onResetToday,
  onCreateEvent,
  overlayActive = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        data-overlay-active={overlayActive}
        className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-md transition-all duration-300 ease-out data-[overlay-active=true]:-translate-y-20 data-[overlay-active=true]:pointer-events-none data-[overlay-active=true]:opacity-0"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onResetToday}
              className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-ring)] transition hover:bg-primary-soft/70 sm:text-sm"
            >
              <CalendarCheck size={18} weight="fill" />
              LCDA Ensemble
            </button>
            <div className="hidden items-center gap-2 text-sm font-medium text-muted sm:flex">
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-muted/80 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Schedule
              </span>
              <span className="text-base text-foreground">합주 캘린더</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-surface px-1.5 py-1 shadow-sm sm:flex">
              <button
                type="button"
                onClick={() => onNavigate("prev")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="이전 범위"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-foreground">
                {rangeLabel}
              </div>
              <button
                type="button"
                onClick={() => onNavigate("next")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="다음 범위"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </div>

            <div className="hidden h-10 items-center gap-2 rounded-full border border-border/70 bg-surface px-3 text-sm text-muted transition hover:border-transparent hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex">
              <MagnifyingGlass size={18} weight="bold" />
              팀원·연습실 검색
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-surface px-1 py-1 shadow-sm">
              <ToggleButton
                active={view === "month"}
                label="월간"
                onClick={() => onViewChange("month")}
              />
              <ToggleButton
                active={view === "week"}
                label="주간"
                onClick={() => onViewChange("week")}
              />
            </div>

            <button
              type="button"
              onClick={onCreateEvent}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Plus size={18} weight="bold" />
              새 일정
            </button>

            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-transparent hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:inline-flex">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
          </div>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

type ToggleButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToggleButton({ label, active, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex h-9 min-w-[68px] items-center justify-center rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-muted hover:bg-primary-soft hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
