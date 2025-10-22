import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteEvent,
  type RecurrenceRuleInput,
  updateEvent,
} from "@/server/events/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  color: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone: z.string().min(1),
  recurrence: z
    .object({
      weekdays: z.array(z.number().int().min(0).max(6)).nonempty(),
      interval: z.number().int().min(1).optional(),
      count: z.number().int().min(1).optional(),
      until: z.string().datetime().optional(),
    })
    .optional()
    .nullable(),
});

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateSchema.parse(json);
    const recurrence = parsed.recurrence
      ? (parsed.recurrence as RecurrenceRuleInput)
      : null;

    await updateEvent(id, {
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      color: parsed.color,
      start: new Date(parsed.start),
      end: new Date(parsed.end),
      timezone: parsed.timezone,
      recurrence,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to update event", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", issues: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    await deleteEvent(id);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to delete event", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
