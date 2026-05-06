import { logger } from "./logger";
import { startDiscoverWorker } from "./jobs/discover-job";
import { startFetchWorker } from "./jobs/fetch-job";
import { startPublishWorker } from "./jobs/publish-job";
import { startDiscoverCron } from "./jobs/discover-cron";

async function main() {
  logger.info("[worker] boot");
  const discover = startDiscoverWorker();
  const fetch = startFetchWorker();
  const publish = await startPublishWorker();
  const cron = startDiscoverCron();
  const shutdown = async () => {
    await Promise.allSettled([
      discover.close(),
      fetch.close(),
      publish.close(),
      cron.close(),
    ]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "[worker] fatal");
  process.exit(1);
});
