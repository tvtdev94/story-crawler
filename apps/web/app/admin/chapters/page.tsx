import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { ChapterListQuery } from "@story-crawler/core";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteChapter } from "@/app/admin/_actions/chapter";
import { requireSession } from "@/lib/auth/require-role";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Chương" };

type Row = {
  id: string;
  storyTitle: string;
  storyId: string;
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

export default async function ChaptersListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSession();
  const sp = await searchParams;
  const query = ChapterListQuery.parse({
    storyId: sp.storyId,
    status: sp.status,
    page: sp.page,
    limit: sp.limit,
  });

  const where: Prisma.ChapterWhereInput = {
    ...(query.storyId ? { storyId: query.storyId } : {}),
    ...(query.status ? { publishStatus: query.status } : {}),
  };

  const [total, list, stories] = await Promise.all([
    prisma.chapter.count({ where }),
    prisma.chapter.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { story: { select: { id: true, title: true } } },
    }),
    prisma.story.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
      take: 200,
    }),
  ]);

  const rows: Row[] = list.map((c) => ({
    id: c.id,
    storyTitle: c.story.title,
    storyId: c.story.id,
    number: c.number,
    title: c.title,
    publishStatus: c.publishStatus,
    scheduledAt: c.scheduledAt,
    publishedAt: c.publishedAt,
  }));

  const columns: Column<Row>[] = [
    {
      key: "story",
      header: "Truyện",
      cell: (r) => (
        <Link href={`/admin/stories/${r.storyId}/chapters`} className="text-accent">
          {r.storyTitle}
        </Link>
      ),
    },
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
      key: "actions",
      header: "",
      cell: (r) => (
        <DeleteButton
          action={async () => {
            "use server";
            await deleteChapter(r.id);
          }}
          confirmText={`Xoá chương "${r.title}"?`}
        />
      ),
      className: "w-48",
    },
  ];

  return (
    <section>
      <PageHeader
        title="Chương"
        actionLabel="+ Chương mới"
        actionHref="/admin/chapters/new"
      />
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <select
          name="storyId"
          defaultValue={query.storyId ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả truyện</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="PENDING_REVIEW">Chờ duyệt</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="PUBLISHED">Đã đăng</option>
          <option value="FAILED">Lỗi</option>
        </select>
        <button className="h-9 rounded-md border border-border px-3">
          Lọc
        </button>
      </form>
      <DataTable columns={columns} rows={rows} empty="Chưa có chương nào." />
      <Pagination
        page={query.page}
        total={total}
        limit={query.limit}
        basePath="/admin/chapters"
        query={{ storyId: query.storyId, status: query.status }}
      />
    </section>
  );
}
