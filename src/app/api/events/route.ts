"use server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createEvent,
  getEventsInRange,
  type RecurrenceRuleInput,
} from "@/server/events/service";

const recurrenceSchema = z
  .object({
    weekdays: z.array(z.number().int().min(0).max(6)).nonempty(),
    interval: z.number().int().min(1).optional(),
    count: z.number().int().min(1).optional(),
    until: z.string().datetime().optional(),
  })
  .optional()
  .nullable();

const eventInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  color: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone: z.string().min(1).default("Asia/Seoul"),
  recurrence: recurrenceSchema,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query parameters are required" },
      { status: 400 },
    );
  }

  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json(
      { error: "Invalid date range provided" },
      { status: 400 },
    );
  }

  try {
    const events = await getEventsInRange(rangeStart, rangeEnd);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch events", error);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = eventInputSchema.parse(json);

    const recurrence = parsed.recurrence
      ? (parsed.recurrence as RecurrenceRuleInput)
      : null;

    await createEvent({
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      color: parsed.color,
      timezone: parsed.timezone,
      start: new Date(parsed.start),
      end: new Date(parsed.end),
      recurrence,
    });

    return NextResponse.json({ status: "ok" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", issues: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
