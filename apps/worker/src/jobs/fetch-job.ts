import { Worker } from "bullmq";
import { prisma } from "@story-crawler/db";
import { DiscoveredStatus } from "@story-crawler/core";
import { redisConnection } from "../queues/redis-connection";
import {
  CRAWL_FETCH_QUEUE_NAME,
  type FetchJobData,
} from "../queues/crawl-fetch-queue";
import { fetchItem } from "../services/fetch-item";
import { logger } from "../logger";

export function startFetchWorker() {
  const worker = new Worker<FetchJobData>(
    CRAWL_FETCH_QUEUE_NAME,
    async (job) => {
      const { discoveredItemId } = job.data;
      logger.info({ jobId: job.id, discoveredItemId }, "fetch start");

      try {
        const result = await fetchItem(discoveredItemId);
        logger.info({ jobId: job.id, result }, "fetch success");
        return result;
      } catch (err) {
        const isFinalAttempt =
          (job.attemptsMade ?? 0) + 1 >= (job.opts.attempts ?? 1);
        const message =
          err instanceof Error
            ? `${err.message}\n${err.stack ?? ""}`
            : String(err);

        if (isFinalAttempt) {
          await prisma.discoveredItem
            .update({
              where: { id: discoveredItemId },
              data: {
                status: DiscoveredStatus.FAILED,
                attempts: { increment: 1 },
                errorMessage: message.slice(0, 4000),
              },
            })
            .catch((e) =>
              logger.warn({ err: e }, "failed to mark DiscoveredItem FAILED"),
            );
        } else {
          await prisma.discoveredItem
            .update({
              where: { id: discoveredItemId },
              data: { attempts: { increment: 1 } },
            })
            .catch(() => undefined);
        }
        logger.error({ jobId: job.id, err }, "fetch failed");
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 2 },
  );

  worker.on("error", (err) => logger.error({ err }, "fetch worker error"));
  return worker;
}
