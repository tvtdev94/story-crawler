-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('OWNED', 'LICENSED', 'PUBLIC_DOMAIN', 'METADATA_ONLY', 'UNAUTHORIZED');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "LicenseMode" AS ENUM ('FULL', 'METADATA_ONLY', 'MOCK');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PublishLogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT,
    "description" TEXT,
    "coverUrl" TEXT,
    "storyStatus" "StoryStatus" NOT NULL DEFAULT 'ONGOING',
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'METADATA_ONLY',
    "sourceUrl" TEXT,
    "sourceId" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryGenre" (
    "storyId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "StoryGenre_pkey" PRIMARY KEY ("storyId","genreId")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "contentHash" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "licenseMode" "LicenseMode" NOT NULL DEFAULT 'METADATA_ONLY',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "CrawlJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishLog" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "status" "PublishLogStatus" NOT NULL,
    "message" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE INDEX "Story_licenseStatus_idx" ON "Story"("licenseStatus");

-- CreateIndex
CREATE INDEX "Story_storyStatus_idx" ON "Story"("storyStatus");

-- CreateIndex
CREATE INDEX "Story_updatedAt_idx" ON "Story"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Story_sourceId_externalId_key" ON "Story"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "StoryGenre_genreId_idx" ON "StoryGenre"("genreId");

-- CreateIndex
CREATE INDEX "Chapter_publishStatus_idx" ON "Chapter"("publishStatus");

-- CreateIndex
CREATE INDEX "Chapter_scheduledAt_idx" ON "Chapter"("scheduledAt");

-- CreateIndex
CREATE INDEX "Chapter_publishedAt_idx" ON "Chapter"("publishedAt");

-- CreateIndex
CREATE INDEX "Chapter_storyId_publishStatus_idx" ON "Chapter"("storyId", "publishStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_storyId_number_key" ON "Chapter"("storyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_storyId_contentHash_key" ON "Chapter"("storyId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Source_adapterKey_key" ON "Source"("adapterKey");

-- CreateIndex
CREATE INDEX "CrawlJob_sourceId_idx" ON "CrawlJob"("sourceId");

-- CreateIndex
CREATE INDEX "CrawlJob_status_idx" ON "CrawlJob"("status");

-- CreateIndex
CREATE INDEX "CrawlJob_startedAt_idx" ON "CrawlJob"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "PublishLog_chapterId_idx" ON "PublishLog"("chapterId");

-- CreateIndex
CREATE INDEX "PublishLog_status_idx" ON "PublishLog"("status");

-- CreateIndex
CREATE INDEX "PublishLog_attemptedAt_idx" ON "PublishLog"("attemptedAt" DESC);

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryGenre" ADD CONSTRAINT "StoryGenre_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryGenre" ADD CONSTRAINT "StoryGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
