import { Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@story-crawler/db";
import { DiscoveredStatus } from "@story-crawler/core";

const CRAWL_FETCH_QUEUE_NAME = "crawl-fetch";

let queue: Queue | null = null;

export function getFetchQueue(): Queue {
  if (queue) return queue;
  const connection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null },
  );
  queue = new Queue(CRAWL_FETCH_QUEUE_NAME, { connection });
  return queue;
}

/**
 * Atomically transitions DISCOVERED → QUEUED for the given ids,
 * then enqueues a fetch job for each item that was actually transitioned.
 * Returns number of items enqueued.
 */
export async function enqueueFetch(itemIds: string[]): Promise<number> {
  if (itemIds.length === 0) return 0;
  const updated = await prisma.discoveredItem.updateMany({
    where: { id: { in: itemIds }, status: DiscoveredStatus.DISCOVERED },
    data: { status: DiscoveredStatus.QUEUED },
  });
  if (updated.count === 0) return 0;

  const eligible = await prisma.discoveredItem.findMany({
    where: { id: { in: itemIds }, status: DiscoveredStatus.QUEUED },
    select: { id: true },
  });
  const q = getFetchQueue();
  await Promise.all(
    eligible.map((it) => q.add("fetch", { discoveredItemId: it.id })),
  );
  return eligible.length;
}
