import { Queue } from "bullmq";
import IORedis from "ioredis";

const CRAWL_DISCOVER_QUEUE_NAME = "crawl-discover";

let queue: Queue | null = null;

export function getDiscoverQueue(): Queue {
  if (queue) return queue;
  const connection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null },
  );
  queue = new Queue(CRAWL_DISCOVER_QUEUE_NAME, { connection });
  return queue;
}

export async function enqueueDiscover(
  sourceId: string,
  triggeredBy?: string,
): Promise<string> {
  const job = await getDiscoverQueue().add("discover", {
    sourceId,
    triggeredBy,
  });
  return job.id ?? "";
}
