-- CreateEnum
CREATE TYPE "DiscoveredStatus" AS ENUM ('DISCOVERED', 'QUEUED', 'FETCHED', 'SKIPPED', 'FAILED');

-- AlterTable
ALTER TABLE "Source" ADD COLUMN "refreshIntervalHours" INTEGER;

-- CreateTable
CREATE TABLE "DiscoveredItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "status" "DiscoveredStatus" NOT NULL DEFAULT 'DISCOVERED',
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3),
    "chapterId" TEXT,

    CONSTRAINT "DiscoveredItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveredItem_status_discoveredAt_idx" ON "DiscoveredItem"("status", "discoveredAt");

-- CreateIndex
CREATE INDEX "DiscoveredItem_sourceId_status_idx" ON "DiscoveredItem"("sourceId", "status");

-- CreateIndex
CREATE INDEX "DiscoveredItem_storyId_idx" ON "DiscoveredItem"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredItem_sourceId_externalId_key" ON "DiscoveredItem"("sourceId", "externalId");

-- AddForeignKey
ALTER TABLE "DiscoveredItem" ADD CONSTRAINT "DiscoveredItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredItem" ADD CONSTRAINT "DiscoveredItem_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
