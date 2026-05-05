import { prisma } from "@story-crawler/db";

async function main() {
  // Approve all PENDING_REVIEW chapters → DRAFT.
  const approved = await prisma.chapter.updateMany({
    where: { publishStatus: "PENDING_REVIEW" },
    data: { publishStatus: "DRAFT" },
  });
  console.log("approved:", approved.count);

  // Schedule first 3 DRAFT chapters +5s.
  const drafts = await prisma.chapter.findMany({
    where: { publishStatus: "DRAFT" },
    take: 3,
    include: { story: true },
  });
  const when = new Date(Date.now() + 5_000);
  for (const ch of drafts) {
    await prisma.chapter.update({
      where: { id: ch.id },
      data: { publishStatus: "SCHEDULED", scheduledAt: when },
    });
    console.log(`scheduled ${ch.story.title} ch.${ch.number} → ${when.toISOString()}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
