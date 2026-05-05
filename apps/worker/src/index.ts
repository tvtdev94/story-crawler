import { logger } from "./logger";
import { startCrawlWorker } from "./jobs/crawl-job";

async function main() {
  logger.info("[worker] boot");
  const crawl = startCrawlWorker();
  process.on("SIGINT", async () => {
    await crawl.close();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await crawl.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err }, "[worker] fatal");
  process.exit(1);
});
