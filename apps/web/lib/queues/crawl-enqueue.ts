import { Queue } from "bullmq";
import IORedis from "ioredis";

const CRAWL_QUEUE_NAME = "crawl";

let queue: Queue | null = null;

export function getCrawlQueue(): Queue {
  if (queue) return queue;
  const connection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null },
  );
  queue = new Queue(CRAWL_QUEUE_NAME, { connection });
  return queue;
}

export async function enqueueCrawl(
  sourceId: string,
  triggeredBy?: string,
): Promise<string> {
  const job = await getCrawlQueue().add("crawl", { sourceId, triggeredBy });
  return job.id ?? "";
}
