import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { requireRole } from "@/lib/auth/require-role";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Publish logs" };

type Row = {
  id: string;
  chapterId: string;
  status: "SUCCESS" | "FAILED";
  attemptedAt: Date;
  message: string | null;
};

export default async function PublishLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const limit = 25;

  const where: Prisma.PublishLogWhereInput = {
    ...(sp.status
      ? { status: sp.status as "SUCCESS" | "FAILED" }
      : {}),
  };

  const [total, list] = await Promise.all([
    prisma.publishLog.count({ where }),
    prisma.publishLog.findMany({
      where,
      orderBy: { attemptedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const rows: Row[] = list.map((p) => ({
    id: p.id,
    chapterId: p.chapterId,
    status: p.status,
    attemptedAt: p.attemptedAt,
    message: p.message,
  }));

  const columns: Column<Row>[] = [
    {
      key: "chapter",
      header: "Chapter",
      cell: (r) => (
        <Link
          href={`/admin/chapters/${r.chapterId}/edit`}
          className="text-accent"
        >
          {r.chapterId.slice(0, 12)}…
        </Link>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => (
        <span
          className={
            r.status === "SUCCESS"
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
              : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
          }
        >
          {r.status}
        </span>
      ),
      className: "w-24",
    },
    {
      key: "at",
      header: "Lúc",
      cell: (r) => r.attemptedAt.toLocaleString("vi-VN"),
      className: "text-xs",
    },
    {
      key: "msg",
      header: "Message",
      cell: (r) => (r.message ? r.message.slice(0, 200) : ""),
      className: "max-w-md text-xs",
    },
  ];

  return (
    <section>
      <PageHeader title="Publish logs" />
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <button className="h-9 rounded-md border border-border px-3">Lọc</button>
      </form>
      <DataTable columns={columns} rows={rows} empty="Chưa có publish log." />
      <Pagination
        page={page}
        total={total}
        limit={limit}
        basePath="/admin/publish-logs"
        query={{ status: sp.status }}
      />
    </section>
  );
}
