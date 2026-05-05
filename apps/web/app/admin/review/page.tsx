import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { BulkApproveForm } from "@/components/admin/bulk-approve-form";
import { bulkApprove } from "@/app/admin/_actions/review";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Chờ duyệt" };

export default async function ReviewQueuePage() {
  await requireSession();
  const chapters = await prisma.chapter.findMany({
    where: { publishStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      story: { select: { title: true, licenseStatus: true } },
    },
  });

  const rows = chapters.map((c) => ({
    id: c.id,
    label: `${c.story.title} — Ch.${c.number}: ${c.title}  ·  ${c.story.licenseStatus}`,
  }));

  const action = async (ids: string[]) => {
    "use server";
    await bulkApprove(ids);
  };

  return (
    <section>
      <PageHeader
        title="Chờ duyệt"
        description={`${rows.length} chương đang chờ duyệt.`}
      />
      <BulkApproveForm rows={rows} action={action} />
    </section>
  );
}
