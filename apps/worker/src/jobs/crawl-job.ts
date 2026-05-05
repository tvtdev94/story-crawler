import { Worker } from "bullmq";
import { prisma } from "@story-crawler/db";
import { redisConnection } from "../queues/redis-connection";
import { CRAWL_QUEUE_NAME, type CrawlJobData } from "../queues/crawl-queue";
import { getAdapter } from "../crawlers/adapter-registry";
import { saveCrawled } from "../services/save-crawled";
import { logger } from "../logger";

export function startCrawlWorker() {
  const worker = new Worker<CrawlJobData>(
    CRAWL_QUEUE_NAME,
    async (job) => {
      const { sourceId, triggeredBy } = job.data;
      logger.info({ jobId: job.id, sourceId }, "crawl start");

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
        const result = await saveCrawled(source, adapter);
        await prisma.crawlJob.update({
          where: { id: crawlJob.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
            itemsFound: result.chaptersFound,
            itemsNew: result.chaptersNew,
          },
        });
        logger.info({ jobId: job.id, ...result }, "crawl success");
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
        await prisma.crawlJob.update({
          where: { id: crawlJob.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            errorMessage: message.slice(0, 4000),
          },
        });
        logger.error({ jobId: job.id, err }, "crawl failed");
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
    },
  );

  worker.on("error", (err) => logger.error({ err }, "crawl worker error"));
  return worker;
}
