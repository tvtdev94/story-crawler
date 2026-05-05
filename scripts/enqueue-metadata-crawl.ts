import { prisma } from "@story-crawler/db";
import { Queue } from "bullmq";
import IORedis from "ioredis";

async function main() {
  const meta = await prisma.source.upsert({
    where: { adapterKey: "metadata-only-demo" },
    update: {},
    create: {
      name: "Metadata-only Demo",
      baseUrl: "https://example.com",
      adapterKey: "metadata-only-demo",
      licenseMode: "METADATA_ONLY",
      enabled: true,
    },
  });
  const conn = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null },
  );
  const q = new Queue("crawl", { connection: conn });
  // Re-run mock-fixture to test idempotency + run metadata-only.
  const mock = await prisma.source.findUnique({
    where: { adapterKey: "mock-fixture" },
  });
  if (mock) {
    const j1 = await q.add("crawl", {
      sourceId: mock.id,
      triggeredBy: "rerun-mock",
    });
    console.log("rerun mock:", j1.id);
  }
  const j2 = await q.add("crawl", {
    sourceId: meta.id,
    triggeredBy: "metadata",
  });
  console.log("queued metadata:", j2.id);
  await q.close();
  await conn.quit();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
