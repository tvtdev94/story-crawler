import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection";

export type CrawlJobData = {
  sourceId: string;
  triggeredBy?: string;
};

export const CRAWL_QUEUE_NAME = "crawl";

export const crawlQueue = new Queue<CrawlJobData>(CRAWL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
