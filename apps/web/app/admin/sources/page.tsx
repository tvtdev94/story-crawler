import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSource, runSource } from "@/app/admin/_actions/source";
import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Nguồn" };

type Row = {
  id: string;
  name: string;
  adapterKey: string;
  licenseMode: "FULL" | "METADATA_ONLY" | "MOCK";
  enabled: boolean;
  lastRunAt: Date | null;
};

export default async function SourcesListPage() {
  await requireRole("ADMIN");
  const list = await prisma.source.findMany({ orderBy: { name: "asc" } });

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
              Run
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
        description="Quản lý nguồn crawl và bật/tắt."
        actionLabel="+ Nguồn mới"
        actionHref="/admin/sources/new"
      />
      <DataTable columns={columns} rows={list} empty="Chưa có nguồn." />
    </section>
  );
}
