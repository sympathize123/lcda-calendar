import { prisma } from "@/server/db/client";

export type MemberPayload = {
  name: string;
  part?: string | null;
  contact?: string | null;
};

export async function listMembers() {
  return prisma.member.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export async function createMember(payload: MemberPayload) {
  return prisma.member.create({
    data: {
      name: payload.name,
      part: payload.part,
      contact: payload.contact,
    },
  });
}
