import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection";

export type DiscoverJobData = {
  sourceId: string;
  triggeredBy?: string;
};

export const CRAWL_DISCOVER_QUEUE_NAME = "crawl-discover";

export const crawlDiscoverQueue = new Queue<DiscoverJobData>(
  CRAWL_DISCOVER_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  },
);
