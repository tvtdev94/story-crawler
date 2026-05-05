import { logger } from "./logger";
import { startCrawlWorker } from "./jobs/crawl-job";
import { startPublishWorker } from "./jobs/publish-job";

async function main() {
  logger.info("[worker] boot");
  const crawl = startCrawlWorker();
  const publish = await startPublishWorker();
  const shutdown = async () => {
    await Promise.allSettled([crawl.close(), publish.close()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "[worker] fatal");
  process.exit(1);
});
