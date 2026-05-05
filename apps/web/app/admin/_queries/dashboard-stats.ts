import { prisma } from "@story-crawler/db";

export type DashboardStats = {
  storyCount: number;
  publishedChapters: number;
  pendingReview: number;
  scheduled: number;
  recentCrawl: {
    success: number;
    failed: number;
  };
  recentPublish: {
    success: number;
    failed: number;
  };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [
    storyCount,
    publishedChapters,
    pendingReview,
    scheduled,
    crawlSuccess,
    crawlFailed,
    publishSuccess,
    publishFailed,
  ] = await Promise.all([
    prisma.story.count(),
    prisma.chapter.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.chapter.count({ where: { publishStatus: "PENDING_REVIEW" } }),
    prisma.chapter.count({ where: { publishStatus: "SCHEDULED" } }),
    prisma.crawlJob.count({
      where: { status: "SUCCESS", startedAt: { gte: since } },
    }),
    prisma.crawlJob.count({
      where: { status: "FAILED", startedAt: { gte: since } },
    }),
    prisma.publishLog.count({
      where: { status: "SUCCESS", attemptedAt: { gte: since } },
    }),
    prisma.publishLog.count({
      where: { status: "FAILED", attemptedAt: { gte: since } },
    }),
  ]);

  return {
    storyCount,
    publishedChapters,
    pendingReview,
    scheduled,
    recentCrawl: { success: crawlSuccess, failed: crawlFailed },
    recentPublish: { success: publishSuccess, failed: publishFailed },
  };
}

export async function getRecentActivity(limit = 10) {
  const [crawlJobs, publishLogs] = await Promise.all([
    prisma.crawlJob.findMany({
      take: limit,
      orderBy: { startedAt: "desc" },
      include: { source: { select: { name: true } } },
    }),
    prisma.publishLog.findMany({
      take: limit,
      orderBy: { attemptedAt: "desc" },
    }),
  ]);

  type Item =
    | {
        kind: "crawl";
        id: string;
        at: Date;
        status: string;
        label: string;
      }
    | {
        kind: "publish";
        id: string;
        at: Date;
        status: string;
        label: string;
      };

  const merged: Item[] = [
    ...crawlJobs.map<Item>((j) => ({
      kind: "crawl",
      id: j.id,
      at: j.startedAt,
      status: j.status,
      label: `Crawl ${j.source.name} · found ${j.itemsFound} new ${j.itemsNew}`,
    })),
    ...publishLogs.map<Item>((p) => ({
      kind: "publish",
      id: p.id,
      at: p.attemptedAt,
      status: p.status,
      label: `Publish chapter ${p.chapterId.slice(0, 8)}…`,
    })),
  ];

  merged.sort((a, b) => b.at.getTime() - a.at.getTime());
  return merged.slice(0, limit);
}
