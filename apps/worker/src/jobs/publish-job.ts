import { Worker } from "bullmq";
import { redisConnection } from "../queues/redis-connection";
import {
  PUBLISH_QUEUE_NAME,
  PUBLISH_TICK_JOB,
  ensurePublishTick,
} from "../queues/publish-queue";
import { publishDueChapters } from "../services/publish-service";
import { logger } from "../logger";

export async function startPublishWorker() {
  const intervalMs = Number(process.env.PUBLISH_TICK_MS ?? 60_000);
  await ensurePublishTick(intervalMs);
  logger.info({ intervalMs }, "publish tick scheduled");

  const worker = new Worker(
    PUBLISH_QUEUE_NAME,
    async (job) => {
      if (job.name !== PUBLISH_TICK_JOB) return;
      const result = await publishDueChapters();
      if (result.picked > 0) {
        logger.info(result, "publish tick");
      }
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 1,
    },
  );

  worker.on("error", (err) => logger.error({ err }, "publish worker error"));
  return worker;
}
