import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { StoryListQuery } from "@story-crawler/core";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteStory } from "@/app/admin/_actions/story";
import { requireSession } from "@/lib/auth/require-role";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Truyện" };

type Row = {
  id: string;
  title: string;
  slug: string;
  authorName: string | null;
  storyStatus: "ONGOING" | "COMPLETED" | "HIATUS";
  licenseStatus:
    | "OWNED"
    | "LICENSED"
    | "PUBLIC_DOMAIN"
    | "METADATA_ONLY"
    | "UNAUTHORIZED";
  updatedAt: Date;
  chapterCount: number;
};

export default async function StoriesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSession();
  const sp = await searchParams;
  const query = StoryListQuery.parse({
    q: sp.q,
    status: sp.status,
    license: sp.license,
    page: sp.page,
    limit: sp.limit,
  });

  const where: Prisma.StoryWhereInput = {
    ...(query.q
      ? { title: { contains: query.q, mode: "insensitive" } }
      : {}),
    ...(query.status ? { storyStatus: query.status } : {}),
    ...(query.license ? { licenseStatus: query.license } : {}),
  };

  const [total, list] = await Promise.all([
    prisma.story.count({ where }),
    prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        author: { select: { name: true } },
        _count: { select: { chapters: true } },
      },
    }),
  ]);

  const rows: Row[] = list.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    authorName: s.author?.name ?? null,
    storyStatus: s.storyStatus,
    licenseStatus: s.licenseStatus,
    updatedAt: s.updatedAt,
    chapterCount: s._count.chapters,
  }));

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Tiêu đề",
      cell: (r) => (
        <div>
          <Link
            href={`/admin/stories/${r.id}/edit`}
            className="font-medium text-accent"
          >
            {r.title}
          </Link>
          <div className="text-xs text-ink-muted">/{r.slug}</div>
        </div>
      ),
    },
    { key: "author", header: "Tác giả", cell: (r) => r.authorName ?? "—" },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => <StatusBadge kind="story" value={r.storyStatus} />,
    },
    {
      key: "license",
      header: "License",
      cell: (r) => <StatusBadge kind="license" value={r.licenseStatus} />,
    },
    {
      key: "chapters",
      header: "Chương",
      cell: (r) => (
        <Link
          href={`/admin/stories/${r.id}/chapters`}
          className="text-accent"
        >
          {r.chapterCount}
        </Link>
      ),
      className: "w-20 text-right",
    },
    {
      key: "updated",
      header: "Cập nhật",
      cell: (r) => new Date(r.updatedAt).toLocaleString("vi-VN"),
      className: "w-40 text-xs text-ink-muted",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <DeleteButton
          action={async () => {
            "use server";
            await deleteStory(r.id);
          }}
          confirmText={`Xoá truyện "${r.title}" (${r.chapterCount} chương)?`}
          expected={r.slug}
        />
      ),
      className: "w-56",
    },
  ];

  return (
    <section>
      <PageHeader
        title="Truyện"
        actionLabel="+ Truyện mới"
        actionHref="/admin/stories/new"
      />
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Tìm tiêu đề…"
          className="h-9 rounded-md border border-border bg-transparent px-3"
        />
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ONGOING">Đang tiến hành</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="HIATUS">Tạm dừng</option>
        </select>
        <select
          name="license"
          defaultValue={query.license ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả license</option>
          <option value="OWNED">Sở hữu</option>
          <option value="LICENSED">Có bản quyền</option>
          <option value="PUBLIC_DOMAIN">Public domain</option>
          <option value="METADATA_ONLY">Chỉ metadata</option>
          <option value="UNAUTHORIZED">Chưa được phép</option>
        </select>
        <button className="h-9 rounded-md border border-border px-3">
          Lọc
        </button>
      </form>
      <DataTable columns={columns} rows={rows} empty="Chưa có truyện nào." />
      <Pagination
        page={query.page}
        total={total}
        limit={query.limit}
        basePath="/admin/stories"
        query={{ q: query.q, status: query.status, license: query.license }}
      />
    </section>
  );
}
