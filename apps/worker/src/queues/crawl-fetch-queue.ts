import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection";

export type FetchJobData = {
  discoveredItemId: string;
};

export const CRAWL_FETCH_QUEUE_NAME = "crawl-fetch";

export const crawlFetchQueue = new Queue<FetchJobData>(CRAWL_FETCH_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});
