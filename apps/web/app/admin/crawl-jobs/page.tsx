import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { requireRole } from "@/lib/auth/require-role";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Crawl jobs" };

type Row = {
  id: string;
  source: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: Date;
  finishedAt: Date | null;
  itemsFound: number;
  itemsNew: number;
  errorPreview: string | null;
};

export default async function CrawlJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const limit = 25;

  const where: Prisma.CrawlJobWhereInput = {
    ...(sp.sourceId ? { sourceId: sp.sourceId } : {}),
    ...(sp.status
      ? {
          status: sp.status as "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED",
        }
      : {}),
  };

  const [total, list, sources] = await Promise.all([
    prisma.crawlJob.count({ where }),
    prisma.crawlJob.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { source: { select: { name: true } } },
    }),
    prisma.source.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows: Row[] = list.map((j) => ({
    id: j.id,
    source: j.source.name,
    status: j.status,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    itemsFound: j.itemsFound,
    itemsNew: j.itemsNew,
    errorPreview: j.errorMessage ? j.errorMessage.slice(0, 120) : null,
  }));

  const columns: Column<Row>[] = [
    { key: "source", header: "Nguồn", cell: (r) => r.source },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => <StatusBadge kind="job" value={r.status} />,
    },
    {
      key: "started",
      header: "Bắt đầu",
      cell: (r) => r.startedAt.toLocaleString("vi-VN"),
      className: "text-xs",
    },
    {
      key: "finished",
      header: "Kết thúc",
      cell: (r) => r.finishedAt?.toLocaleString("vi-VN") ?? "—",
      className: "text-xs",
    },
    {
      key: "items",
      header: "Found / New",
      cell: (r) => `${r.itemsFound} / ${r.itemsNew}`,
      className: "w-24 text-right",
    },
    {
      key: "err",
      header: "Lỗi",
      cell: (r) =>
        r.errorPreview ? (
          <Link href={`/admin/crawl-jobs/${r.id}`} className="text-red-700">
            {r.errorPreview}…
          </Link>
        ) : (
          ""
        ),
      className: "max-w-md text-xs",
    },
  ];

  return (
    <section>
      <PageHeader title="Crawl jobs" />
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <select
          name="sourceId"
          defaultValue={sp.sourceId ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả nguồn</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="QUEUED">QUEUED</option>
          <option value="RUNNING">RUNNING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <button className="h-9 rounded-md border border-border px-3">Lọc</button>
      </form>
      <DataTable columns={columns} rows={rows} empty="Chưa có crawl job nào." />
      <Pagination
        page={page}
        total={total}
        limit={limit}
        basePath="/admin/crawl-jobs"
        query={{ sourceId: sp.sourceId, status: sp.status }}
      />
    </section>
  );
}
