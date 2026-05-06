import { Worker } from "bullmq";
import { prisma } from "@story-crawler/db";
import { redisConnection } from "../queues/redis-connection";
import {
  CRAWL_DISCOVER_QUEUE_NAME,
  type DiscoverJobData,
} from "../queues/crawl-discover-queue";
import { getAdapter } from "../crawlers/adapter-registry";
import { saveDiscovered } from "../services/save-discovered";
import { logger } from "../logger";

export function startDiscoverWorker() {
  const worker = new Worker<DiscoverJobData>(
    CRAWL_DISCOVER_QUEUE_NAME,
    async (job) => {
      const { sourceId, triggeredBy } = job.data;
      logger.info({ jobId: job.id, sourceId }, "discover start");

      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) throw new Error(`Source ${sourceId} not found`);
      const adapter = getAdapter(source.adapterKey);
      if (!adapter) throw new Error(`Adapter ${source.adapterKey} unknown`);

      const crawlJob = await prisma.crawlJob.create({
        data: {
          sourceId,
          status: "RUNNING",
          triggeredBy: triggeredBy ?? null,
        },
      });

      try {
        const result = await saveDiscovered(source, adapter);
        await prisma.crawlJob.update({
          where: { id: crawlJob.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
            itemsFound: result.itemsFound,
            itemsNew: result.itemsNew,
          },
        });
        logger.info({ jobId: job.id, ...result }, "discover success");
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? `${err.message}\n${err.stack ?? ""}`
            : String(err);
        await prisma.crawlJob.update({
          where: { id: crawlJob.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            errorMessage: message.slice(0, 4000),
          },
        });
        logger.error({ jobId: job.id, err }, "discover failed");
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 1 },
  );

  worker.on("error", (err) => logger.error({ err }, "discover worker error"));
  return worker;
}
