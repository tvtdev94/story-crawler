import { prisma } from "@story-crawler/db";
import { crawlDiscoverQueue } from "../queues/crawl-discover-queue";
import { logger } from "../logger";

const REPEAT_PREFIX = "discover:";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

function jobId(sourceId: string) {
  return `${REPEAT_PREFIX}${sourceId}`;
}

export async function syncRepeatables() {
  const sources = await prisma.source.findMany({
    where: { enabled: true },
    select: { id: true, refreshIntervalHours: true },
  });

  const repeatables = await crawlDiscoverQueue.getRepeatableJobs();
  const existingByKey = new Map(repeatables.map((r) => [r.id ?? r.key, r]));

  const desiredIds = new Set<string>();

  for (const s of sources) {
    if (s.refreshIntervalHours == null) continue;
    const id = jobId(s.id);
    desiredIds.add(id);
    const every = s.refreshIntervalHours * 3600 * 1000;

    const existing = existingByKey.get(id);
    const sameInterval =
      existing && Number(existing.every ?? 0) === every;
    if (sameInterval) continue;

    if (existing) {
      await crawlDiscoverQueue.removeRepeatableByKey(existing.key);
    }
    await crawlDiscoverQueue.add(
      "discover",
      { sourceId: s.id, triggeredBy: "cron" },
      { jobId: id, repeat: { every } },
    );
    logger.info(
      { sourceId: s.id, every },
      `registered repeatable ${id} every ${every}ms`,
    );
  }

  // Clean up orphans (source disabled, deleted, or interval cleared).
  for (const r of repeatables) {
    const id = r.id ?? "";
    if (!id.startsWith(REPEAT_PREFIX)) continue;
    if (desiredIds.has(id)) continue;
    await crawlDiscoverQueue.removeRepeatableByKey(r.key);
    logger.info({ jobId: id }, `removed repeatable ${id}`);
  }
}

export function startDiscoverCron() {
  // Initial sync + periodic poll.
  syncRepeatables().catch((err) =>
    logger.error({ err }, "initial syncRepeatables failed"),
  );
  const handle = setInterval(() => {
    syncRepeatables().catch((err) =>
      logger.error({ err }, "syncRepeatables failed"),
    );
  }, POLL_INTERVAL_MS);
  return {
    close: async () => clearInterval(handle),
  };
}
