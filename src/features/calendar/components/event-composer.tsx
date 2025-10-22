"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  addMinutes,
  format,
  set,
  startOfDay,
  startOfMinute,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowsClockwise,
  CalendarBlank,
  Clock,
  MapPin,
  Palette,
  X,
} from "phosphor-react";
import { CalendarEvent, CalendarView, RecurrenceFormState } from "../types";
import { cn } from "@/lib/utils";

type EventComposerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: CalendarView;
  mode: "create" | "edit";
  initialDate?: Date | null;
  event?: CalendarEvent | null;
  onSubmit: (payload: {
    title: string;
    description?: string;
    location?: string;
    color: string;
    start: Date;
    end: Date;
    timezone: string;
    recurrence?: RecurrenceFormState;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const TIMEZONE = "Asia/Seoul";

type FormValues = {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  weekdays: number[];
  interval: number;
  repeatMode: "none" | "count" | "until";
  count?: number;
  until?: string;
};

export function EventComposer({
  open,
  onOpenChange,
  view,
  mode,
  initialDate,
  event,
  onSubmit,
  isSubmitting,
}: EventComposerProps) {
  const defaultValues = useMemo(
    () => buildDefaultValues(initialDate, event),
    [initialDate, event],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(initialDate, event));
    }
  }, [open, initialDate, event, reset]);

  useEffect(() => {
    register("weekdays");
    register("color");
  }, [register]);

  const selectedWeekdays =
    useWatch({ control, name: "weekdays" }) ?? ([] as number[]);
  const selectedColor =
    useWatch({ control, name: "color" }) ?? COLOR_PRESETS[0].color;
  const repeatMode = useWatch({ control, name: "repeatMode" }) ?? "none";

  const onSubmitInternal = handleSubmit(async (values) => {
    const baseDate = values.date
      ? new Date(`${values.date}T00:00:00`)
      : initialDate ?? new Date();

    const start = combineDateAndTime(baseDate, values.startTime);
    const end = combineDateAndTime(baseDate, values.endTime);

    if (!start || !end) {
      setError("startTime", { message: "시간을 선택해 주세요." });
      return;
    }

    if (end <= start) {
      setError("endTime", { message: "종료 시간은 시작 이후여야 합니다." });
      return;
    }

    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      location: values.location.trim() || undefined,
      color: values.color,
      start,
      end,
      timezone: TIMEZONE,
      recurrence: buildRecurrence(values),
    });

    onOpenChange(false);
  });

  const dialogTitle =
    mode === "edit" ? "일정 수정하기" : "새 합주 일정 만들기";
  const displayDate = initialDate
    ? format(initialDate, "yyyy년 M월 d일 (EEE)", { locale: ko })
    : "날짜를 선택해 주세요";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(92vw,740px)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-border/60 bg-surface-elevated p-6 shadow-[var(--shadow-soft)] focus:outline-none">
          <header className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="text-xl font-semibold text-foreground">
                {dialogTitle}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted">
                일정은 {view === "month" ? "월간" : "주간"} 보기에서 선택한
                기준으로 30분 단위로 생성됩니다.
              </Dialog.Description>
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

          <form
            className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
            onSubmit={onSubmitInternal}
          >
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted">
                  일정 제목
                </label>
                <input
                  type="text"
                  placeholder="예: 정기 합주 · 현악"
                  className={inputClass}
                  {...register("title", { required: "일정 제목을 입력해 주세요." })}
                />
                {errors.title ? (
                  <p className="text-xs text-danger">{errors.title.message}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="일자" icon={<CalendarBlank size={16} />}>
                  <input
                    type="text"
                    value={displayDate}
                    readOnly
                    className="h-11 w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 text-sm text-foreground shadow-sm outline-none"
                  />
                </Field>
                <Field label="장소" icon={<MapPin size={16} />}>
                  <input
                    type="text"
                    placeholder="연습실 또는 건물"
                    className={inputClass}
                    {...register("location")}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="시작" icon={<Clock size={16} />}>
                  <select
                    className={inputClass}
                    {...register("startTime", {
                      required: "시작 시간을 선택해 주세요.",
                      onChange: () => clearErrors("startTime"),
                    })}
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.startTime ? (
                    <p className="mt-1 text-xs text-danger">
                      {errors.startTime.message}
                    </p>
                  ) : null}
                </Field>
                <Field label="종료" icon={<Clock size={16} />}>
                  <select
                    className={inputClass}
                    {...register("endTime", {
                      required: "종료 시간을 선택해 주세요.",
                      onChange: () => clearErrors("endTime"),
                    })}
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.endTime ? (
                    <p className="mt-1 text-xs text-danger">
                      {errors.endTime.message}
                    </p>
                  ) : null}
                </Field>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted">
                  상세 메모
                </label>
                <textarea
                  rows={4}
                  placeholder="곡목, 파트, 준비물 등 필요한 정보를 메모하세요."
                  className="w-full resize-none rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  {...register("description")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border/60 bg-surface-muted/60 p-4">
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <ArrowsClockwise size={16} weight="bold" />
                  반복 설정
                </span>
                <p className="text-xs text-muted">
                  요일과 반복 횟수를 지정하면 선택한 기간 동안 자동으로
                  일정이 생성됩니다.
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = selectedWeekdays.includes(index);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(index, selectedWeekdays, setValue)}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border px-2 text-xs font-semibold uppercase tracking-wide transition",
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border/70 bg-surface text-muted hover:border-primary hover:text-primary",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {selectedWeekdays.length > 0 ? (
                <div className="grid gap-2 text-sm text-muted">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    반복 주기
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="h-9 rounded-[var(--radius-sm)] border border-border/70 bg-surface px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    {...register("interval", { valueAsNumber: true })}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      반복 종료
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2">
                      <input
                        type="radio"
                        value="none"
                        {...register("repeatMode")}
                        defaultChecked
                      />
                      종료일 없음
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2">
                      <input
                        type="radio"
                        value="count"
                        {...register("repeatMode")}
                      />
                      <span className="flex-1">N회 반복</span>
                      <input
                        type="number"
                        min={1}
                        disabled={repeatMode !== "count"}
                        className="h-9 w-16 rounded-[var(--radius-sm)] border border-border/70 bg-surface px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        {...register("count", { valueAsNumber: true })}
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2">
                      <input
                        type="radio"
                        value="until"
                        {...register("repeatMode")}
                      />
                      <span className="flex-1">종료 날짜 지정</span>
                      <input
                        type="date"
                        disabled={repeatMode !== "until"}
                        className="h-9 rounded-[var(--radius-sm)] border border-border/70 bg-surface px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        {...register("until")}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <p className="rounded-[var(--radius-md)] border border-dashed border-border/60 bg-surface px-3 py-2 text-xs text-muted">
                  반복 일정을 만들려면 요일을 선택하세요.
                </p>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  <Palette size={16} weight="bold" />
                  태그 & 색상
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() =>
                        setValue("color", preset.color, { shouldDirty: true })
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                        selectedColor === preset.color
                          ? "border-primary bg-primary-soft/70 text-primary"
                          : "border-border/60 bg-surface text-muted hover:border-primary hover:text-primary",
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: preset.color }}
                      />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="md:col-span-2 mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
              <p className="text-xs text-muted">
                저장 후에도 언제든 일정 상세 화면에서 내용을 수정할 수 있어요.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 bg-surface px-4 text-sm font-medium text-muted transition hover:border-transparent hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "저장 중..." : "일정 저장"}
                </button>
              </div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type FieldProps = {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

function Field({ label, icon, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-muted">{label}</label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {icon}
          </span>
        ) : null}
        <div className={cn(icon && "pl-8")}>{children}</div>
      </div>
    </div>
  );
}

function toggleWeekday(
  weekday: number,
  selected: number[],
  setValue: (
    name: "weekdays",
    value: number[],
    options?: { shouldDirty?: boolean },
  ) => void,
) {
  const exists = selected.includes(weekday);
  if (exists) {
    setValue(
      "weekdays",
      selected.filter((value) => value !== weekday),
      { shouldDirty: true },
    );
  } else {
    setValue(
      "weekdays",
      [...selected, weekday].sort((a, b) => a - b),
      { shouldDirty: true },
    );
  }
}

function buildDefaultValues(
  initialDate?: Date | null,
  event?: CalendarEvent | null,
): FormValues {
  const base = startOfMinute(initialDate ?? new Date());
  const start = event?.start ?? base;
  const end = event?.end ?? addMinutes(start, 60);

  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    date: format(start, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    color: event?.color ?? COLOR_PRESETS[0].color,
    weekdays: event?.recurrence?.weekdays ?? [],
    interval: event?.recurrence?.interval ?? 1,
    repeatMode: event?.recurrence?.count
      ? "count"
      : event?.recurrence?.until
        ? "until"
        : "none",
    count: event?.recurrence?.count,
    until: event?.recurrence?.until,
  };
}

function combineDateAndTime(baseDate: Date, time: string) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map((value) => parseInt(value, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const local = startOfDay(baseDate);
  return set(local, { hours, minutes, seconds: 0, milliseconds: 0 });
}

function buildRecurrence(values: FormValues): RecurrenceFormState {
  if (!values.weekdays || values.weekdays.length === 0) {
    return null;
  }

  const recurrence: RecurrenceFormState = {
    weekdays: values.weekdays,
    interval: values.interval ?? 1,
  };

  if (values.repeatMode === "count" && values.count) {
    recurrence.count = values.count;
  }

  if (values.repeatMode === "until" && values.until) {
    recurrence.until = values.until;
  }

  return recurrence;
}

function generateTimeOptions() {
  const options: string[] = [];
  for (let hour = 7; hour <= 23; hour += 1) {
    options.push(`${String(hour).padStart(2, "0")}:00`);
    options.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return options;
}

const COLOR_PRESETS = [
  { label: "합주", color: "#1A73E8" },
  { label: "섹션", color: "#0EA5E9" },
  { label: "회의", color: "#F59E0B" },
  { label: "특강", color: "#F97316" },
  { label: "기타", color: "#8B5CF6" },
] as const;

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
