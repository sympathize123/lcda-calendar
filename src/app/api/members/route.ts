import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMember, listMembers } from "@/server/members/service";

const memberSchema = z.object({
  name: z.string().min(1),
  part: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
});

export async function GET() {
  const members = await listMembers();
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = memberSchema.parse(json);
    const member = await createMember(parsed);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Failed to create member", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", issues: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
