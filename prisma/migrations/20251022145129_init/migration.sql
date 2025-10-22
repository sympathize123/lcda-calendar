-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1A73E8',
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "recurrenceRule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
