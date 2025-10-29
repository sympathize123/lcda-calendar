import { Suspense } from "react";
import { CalendarPage } from "@/features/calendar/calendar-page";

export default function CalendarRoute() {
  return (
    <Suspense fallback={null}>
      <CalendarPage />
    </Suspense>
  );
}
