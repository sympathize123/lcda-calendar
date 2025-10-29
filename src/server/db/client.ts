
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const SQLITE_PREFIX = "file:";
const dbUrl = process.env.DATABASE_URL;

if (dbUrl?.startsWith(SQLITE_PREFIX) && dbUrl.slice(SQLITE_PREFIX.length).startsWith("./")) {
  const relativePath = dbUrl.slice(SQLITE_PREFIX.length + 2);
  const absolutePath = path.resolve(process.cwd(), relativePath);
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
