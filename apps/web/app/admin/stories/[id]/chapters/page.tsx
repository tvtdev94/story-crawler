import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteChapter } from "@/app/admin/_actions/chapter";
import { requireSession } from "@/lib/auth/require-role";

type Row = {
  id: string;
  number: number;
  title: string;
  publishStatus:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "SCHEDULED"
    | "PUBLISHED"
    | "FAILED";
  scheduledAt: Date | null;
  publishedAt: Date | null;
};

export const metadata = { title: "Chương theo truyện" };

export default async function ChaptersByStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    include: { chapters: { orderBy: { number: "asc" } } },
  });
  if (!story) notFound();

  const rows: Row[] = story.chapters.map((c) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    publishStatus: c.publishStatus,
    scheduledAt: c.scheduledAt,
    publishedAt: c.publishedAt,
  }));

  const columns: Column<Row>[] = [
    {
      key: "n",
      header: "#",
      cell: (r) => r.number,
      className: "w-12",
    },
    {
      key: "title",
      header: "Tiêu đề",
      cell: (r) => (
        <Link href={`/admin/chapters/${r.id}/edit`} className="text-accent">
          {r.title}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => <StatusBadge kind="publish" value={r.publishStatus} />,
    },
    {
      key: "scheduled",
      header: "Hẹn giờ",
      cell: (r) => r.scheduledAt?.toLocaleString("vi-VN") ?? "—",
      className: "text-xs text-ink-muted",
    },
    {
      key: "published",
      header: "Đã đăng",
      cell: (r) => r.publishedAt?.toLocaleString("vi-VN") ?? "—",
      className: "text-xs text-ink-muted",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <DeleteButton
          action={async () => {
            "use server";
            await deleteChapter(r.id);
          }}
          confirmText={`Xoá chương ${r.number}?`}
        />
      ),
      className: "w-48",
    },
  ];

  return (
    <section>
      <PageHeader
        title={`Chương: ${story.title}`}
        description={`/${story.slug}`}
        actionLabel="+ Chương mới"
        actionHref={`/admin/chapters/new?storyId=${story.id}`}
      />
      <DataTable columns={columns} rows={rows} empty="Chưa có chương." />
    </section>
  );
}
