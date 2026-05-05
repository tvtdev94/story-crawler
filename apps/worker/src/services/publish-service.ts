import { prisma } from "@story-crawler/db";
import { logger } from "../logger";

export type PublishResult = {
  picked: number;
  succeeded: number;
  failed: number;
};

const REVALIDATE_ENDPOINT = "/api/internal/revalidate";

async function notifyRevalidate(storySlug: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const token = process.env.INTERNAL_REVALIDATE_TOKEN ?? process.env.INTERNAL_TOKEN;
  if (!token) {
    logger.warn("INTERNAL_REVALIDATE_TOKEN missing — skip revalidate");
    return;
  }
  try {
    const res = await fetch(`${baseUrl}${REVALIDATE_ENDPOINT}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, storySlug }),
    });
    if (!res.ok) logger.warn({ status: res.status }, "revalidate non-OK");
  } catch (err) {
    logger.warn({ err }, "revalidate fetch failed");
  }
}

export async function publishDueChapters(): Promise<PublishResult> {
  const now = new Date();
  // Pick chapters atomically — Prisma transaction with explicit checks.
  const due = await prisma.chapter.findMany({
    where: {
      publishStatus: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    take: 100,
    orderBy: { scheduledAt: "asc" },
    include: { story: { select: { slug: true } } },
  });

  let succeeded = 0;
  let failed = 0;

  for (const ch of due) {
    try {
      const updated = await prisma.chapter.updateMany({
        where: { id: ch.id, publishStatus: "SCHEDULED" },
        data: {
          publishStatus: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
      if (updated.count !== 1) continue;

      await prisma.publishLog.create({
        data: {
          chapterId: ch.id,
          status: "SUCCESS",
          message: `Auto-published at ${now.toISOString()}`,
        },
      });
      succeeded += 1;
      void notifyRevalidate(ch.story.slug);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.publishLog.create({
        data: {
          chapterId: ch.id,
          status: "FAILED",
          message: msg.slice(0, 1000),
        },
      });
      // Keep status SCHEDULED for retry next tick — until 3 attempts.
      const recentFails = await prisma.publishLog.count({
        where: { chapterId: ch.id, status: "FAILED" },
      });
      if (recentFails >= 3) {
        await prisma.chapter.update({
          where: { id: ch.id },
          data: { publishStatus: "FAILED" },
        });
      }
      failed += 1;
      logger.warn({ err, chapterId: ch.id }, "publish failed");
    }
  }

  return { picked: due.length, succeeded, failed };
}
