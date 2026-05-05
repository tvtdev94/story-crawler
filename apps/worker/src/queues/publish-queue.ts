import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection";

export const PUBLISH_QUEUE_NAME = "publish";
export const PUBLISH_TICK_JOB = "publish-tick";

export const publishQueue = new Queue(PUBLISH_QUEUE_NAME, {
  connection: redisConnection,
});

export async function ensurePublishTick(intervalMs: number) {
  // Drain prior repeatables to avoid duplicates after worker restarts.
  const repeatables = await publishQueue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === PUBLISH_TICK_JOB) {
      await publishQueue.removeRepeatableByKey(r.key);
    }
  }
  await publishQueue.add(
    PUBLISH_TICK_JOB,
    {},
    {
      repeat: { every: intervalMs },
      jobId: PUBLISH_TICK_JOB,
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  );
}
