import { logger } from "./logger";

async function main() {
  logger.info("[worker] boot");
  // Phase 05/06 will register crawl + publish queues here.
  // Keep process alive.
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
  setInterval(() => {
    /* heartbeat — will be replaced by BullMQ workers in later phases */
  }, 60_000);
}

main().catch((err) => {
  logger.error({ err }, "[worker] fatal");
  process.exit(1);
});
