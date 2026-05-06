import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSource, runSource } from "@/app/admin/_actions/source";
import { getSourceInboxCounts } from "@/app/admin/_queries/discovered";
import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Nguồn" };

type Row = {
  id: string;
  name: string;
  adapterKey: string;
  licenseMode: "FULL" | "METADATA_ONLY" | "MOCK";
  enabled: boolean;
  lastRunAt: Date | null;
  refreshIntervalHours: number | null;
  inbox: { discovered: number; fetched: number; skipped: number };
};

export default async function SourcesListPage() {
  await requireRole("ADMIN");
  const [list, counts] = await Promise.all([
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    getSourceInboxCounts(),
  ]);

  const rows: Row[] = list.map((s) => ({
    id: s.id,
    name: s.name,
    adapterKey: s.adapterKey,
    licenseMode: s.licenseMode,
    enabled: s.enabled,
    lastRunAt: s.lastRunAt,
    refreshIntervalHours: s.refreshIntervalHours,
    inbox: {
      discovered: counts[s.id]?.DISCOVERED ?? 0,
      fetched: counts[s.id]?.FETCHED ?? 0,
      skipped: counts[s.id]?.SKIPPED ?? 0,
    },
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Tên",
      cell: (r) => (
        <Link href={`/admin/sources/${r.id}/edit`} className="text-accent">
          {r.name}
        </Link>
      ),
    },
    { key: "adapter", header: "Adapter", cell: (r) => <code>{r.adapterKey}</code> },
    { key: "license", header: "License", cell: (r) => r.licenseMode },
    {
      key: "refresh",
      header: "Tự refresh",
      cell: (r) =>
        r.refreshIntervalHours
          ? `${r.refreshIntervalHours}h`
          : <span className="text-ink-muted">—</span>,
      className: "w-24 text-xs",
    },
    {
      key: "inbox",
      header: "Inbox (D/F/S)",
      cell: (r) => (
        <Link
          href={`/admin/discovered?sourceId=${r.id}`}
          className="font-mono text-xs text-accent"
        >
          {r.inbox.discovered}/{r.inbox.fetched}/{r.inbox.skipped}
        </Link>
      ),
      className: "w-32",
    },
    {
      key: "enabled",
      header: "Bật",
      cell: (r) => (r.enabled ? "Có" : "Không"),
      className: "w-16",
    },
    {
      key: "lastRun",
      header: "Lần chạy gần nhất",
      cell: (r) => r.lastRunAt?.toLocaleString("vi-VN") ?? "—",
      className: "text-xs text-ink-muted",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <form
            action={async () => {
              "use server";
              await runSource(r.id);
            }}
          >
            <Button size="sm" type="submit" disabled={!r.enabled}>
              Refresh
            </Button>
          </form>
          <DeleteButton
            action={async () => {
              "use server";
              await deleteSource(r.id);
            }}
            confirmText={`Xoá nguồn "${r.name}"?`}
          />
        </div>
      ),
      className: "w-64",
    },
  ];

  return (
    <section>
      <PageHeader
        title="Nguồn"
        description="Quản lý nguồn crawl, refresh, lịch tự động."
        actionLabel="+ Nguồn mới"
        actionHref="/admin/sources/new"
      />
      <DataTable columns={columns} rows={rows} empty="Chưa có nguồn." />
    </section>
  );
}
