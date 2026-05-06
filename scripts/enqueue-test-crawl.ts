import { prisma } from "@story-crawler/db";
import { Queue } from "bullmq";
import IORedis from "ioredis";

async function main() {
  const src = await prisma.source.upsert({
    where: { adapterKey: "mock-fixture" },
    update: {},
    create: {
      name: "Mock Fixture",
      baseUrl: "https://mock.local",
      adapterKey: "mock-fixture",
      licenseMode: "MOCK",
      enabled: true,
    },
  });
  console.log("source:", src.id);

  const conn = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null },
  );
  const q = new Queue("crawl-discover", { connection: conn });
  const job = await q.add("discover", {
    sourceId: src.id,
    triggeredBy: "test-script",
  });
  console.log("queued job:", job.id);
  await q.close();
  await conn.quit();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
