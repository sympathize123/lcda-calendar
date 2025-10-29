"use client";

import {
  ArrowsLeftRight,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Moon,
  Plus,
  Sun,
  DotsThreeVertical,
  HouseSimple,
} from "phosphor-react";
import { ReactNode, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { CalendarView } from "@/features/calendar/types";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import { useSearchParams } from "next/navigation";

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
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const searchParams = useSearchParams();
  const deviceParam = searchParams?.get("device")?.toLowerCase() ?? null;

  const deviceSize = useMemo(() => {
    if (!deviceParam) return null;
    // Common iPhone logical viewport sizes (CSS px)
    const map: Record<string, { width: number; height: number }> = {
      "iphone-se": { width: 320, height: 568 },
      "iphone-8": { width: 375, height: 667 },
      "iphone-x": { width: 375, height: 812 },
      "iphone-11": { width: 414, height: 896 },
      "iphone-12": { width: 390, height: 844 },
      "iphone-13": { width: 390, height: 844 },
      "iphone-14": { width: 390, height: 844 },
      "iphone-14-pro": { width: 393, height: 852 },
      "iphone-14-pro-max": { width: 430, height: 932 },
      "iphone-15": { width: 393, height: 852 },
      "iphone-15-pro": { width: 393, height: 852 },
      "iphone-15-pro-max": { width: 430, height: 932 },
    };
    return map[deviceParam] ?? null;
  }, [deviceParam]);

  const content = (
    <div className="calendar-theme min-h-screen bg-background text-foreground">
      <header
        data-overlay-active={overlayActive}
        className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 pt-[var(--safe-area-top)] backdrop-blur-md transition-all duration-300 ease-out data-[overlay-active=true]:-translate-y-20 data-[overlay-active=true]:pointer-events-none data-[overlay-active=true]:opacity-0"
      >
        <div className="mx-auto flex h-auto min-h-16 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="메인으로"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-transparent hover:bg-primary-soft hover:text-primary"
            >
              <HouseSimple size={18} weight="bold" />
            </Link>
            <button
              type="button"
              onClick={onResetToday}
              className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-ring)] transition hover:bg-primary-soft/70 sm:text-sm"
            >
              <CalendarCheck size={18} weight="fill" />
              LCDA Ensemble
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-sm font-medium text-muted sm:flex">
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-muted/80 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Schedule
              </span>
              <span className="truncate text-base text-foreground">합주 캘린더</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-none sm:flex-row sm:items-center sm:justify-end">
            <div className="hidden min-w-0 items-center gap-1 rounded-full border border-border/70 bg-surface px-1.5 py-1 shadow-sm sm:flex">
              <button
                type="button"
                onClick={() => onNavigate("prev")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="이전 범위"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <div className="flex min-w-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-foreground">
                <span className="truncate whitespace-nowrap">{rangeLabel}</span>
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

            <div className="hidden items-center gap-1 rounded-full bg-surface px-1 py-1 shadow-sm sm:inline-flex">
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

            {/* Desktop: full-labeled create button */}
            <button
              type="button"
              onClick={onCreateEvent}
              className="hidden h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:inline-flex sm:w-auto"
            >
              <Plus size={18} weight="bold" />
              새 일정
            </button>

            {/* Theme button hidden on mobile; available via More menu */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-transparent hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:inline-flex"
            >
              {isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>

            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-transparent hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:inline-flex">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>

            {/* Mobile overflow menu */}
            <div className="sm:hidden flex w-full justify-end">
              <MoreMenu
                rangeLabel={rangeLabel}
                view={view}
                isDark={isDark}
                onCreateEvent={onCreateEvent}
                onViewChange={onViewChange}
                onNavigate={onNavigate}
                onResetToday={onResetToday}
                onToggleTheme={toggleTheme}
              />
            </div>
          </div>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-[calc(var(--safe-area-bottom)+3rem)] pt-6 sm:px-6 lg:px-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );

  if (deviceSize) {
    return (
      <div className="min-h-screen w-full bg-neutral-900 text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-none items-start justify-center p-6">
          <div className="relative rounded-[34px] bg-black/80 p-3 shadow-2xl ring-1 ring-black/50">
            <div
              className="overflow-auto rounded-[28px] bg-background"
              style={{ width: deviceSize.width, height: deviceSize.height }}
            >
              {content}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-0 h-6 w-28 -translate-x-1/2 rounded-b-[12px] bg-black/70" />
          </div>
        </div>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
          Device preview: {deviceParam} · {deviceSize.width}×{deviceSize.height}
        </div>
      </div>
    );
  }

  return content;
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
        "inline-flex h-9 min-w-[68px] flex-1 items-center justify-center rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:flex-none",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-muted hover:bg-primary-soft hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}

type MoreMenuProps = {
  rangeLabel: string;
  view: CalendarView;
  isDark: boolean;
  onCreateEvent: () => void;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onResetToday: () => void;
  onToggleTheme: () => void;
};

function MoreMenu({
  rangeLabel,
  view,
  isDark,
  onCreateEvent,
  onViewChange,
  onNavigate,
  onResetToday,
  onToggleTheme,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="더보기"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-muted shadow-sm transition hover:border-transparent hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[14px] border border-border/60 bg-surface/95 shadow-xl backdrop-blur">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {rangeLabel}
          </div>
          <div className="grid gap-2 p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 rounded-[12px] border border-border/50 bg-surface/90 px-3 py-2 text-left text-sm text-foreground shadow-[var(--shadow-raised)] hover:bg-surface-muted/80"
                onClick={() => {
                  onNavigate("prev");
                  setOpen(false);
                }}
              >
                이전 범위
              </button>
              <button
                type="button"
                className="flex-1 rounded-[12px] border border-border/50 bg-surface/90 px-3 py-2 text-right text-sm text-foreground shadow-[var(--shadow-raised)] hover:bg-surface-muted/80"
                onClick={() => {
                  onNavigate("next");
                  setOpen(false);
                }}
              >
                다음 범위
              </button>
            </div>
            <button
              type="button"
              className="rounded-[12px] border border-border/50 bg-surface/90 px-3 py-2 text-left text-sm text-foreground shadow-[var(--shadow-raised)] hover:bg-surface-muted/80"
              onClick={() => {
                onResetToday();
                setOpen(false);
              }}
            >
              오늘로 이동
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded-[12px] border border-border/50 bg-surface/90 px-3 py-2 text-sm text-foreground shadow-[var(--shadow-raised)] hover:bg-surface-muted/80"
              onClick={() => {
                onViewChange(view === "month" ? "week" : "month");
                setOpen(false);
              }}
            >
              보기 전환
              <span className="text-xs text-muted">{view === "month" ? "주간" : "월간"}</span>
            </button>
            <button
              type="button"
              className="rounded-[12px] border border-border/50 bg-surface/90 px-3 py-2 text-left text-sm text-foreground shadow-[var(--shadow-raised)] hover:bg-surface-muted/80"
              onClick={() => {
                onToggleTheme();
                setOpen(false);
              }}
            >
              {isDark ? "라이트 모드" : "다크 모드"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-primary px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-raised)] hover:bg-primary/90"
              onClick={() => {
                onCreateEvent();
                setOpen(false);
              }}
            >
              <Plus size={16} weight="bold" /> 새 일정
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
