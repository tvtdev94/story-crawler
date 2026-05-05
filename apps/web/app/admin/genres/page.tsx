import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteGenre } from "@/app/admin/_actions/genre";
import { requireSession } from "@/lib/auth/require-role";

type Row = { id: string; name: string; slug: string };

export const metadata = { title: "Thể loại" };

export default async function GenresListPage() {
  const session = await requireSession();
  const list = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  const isAdmin = session.user.role === "ADMIN";

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Tên",
      cell: (r) => (
        <Link href={`/admin/genres/${r.id}/edit`} className="text-accent">
          {r.name}
        </Link>
      ),
    },
    { key: "slug", header: "Slug", cell: (r) => <code>{r.slug}</code> },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        isAdmin ? (
          <DeleteButton
            action={async () => {
              "use server";
              await deleteGenre(r.id);
            }}
            confirmText={`Xoá thể loại "${r.name}"?`}
          />
        ) : null,
      className: "w-48",
    },
  ];

  return (
    <section>
      <PageHeader
        title="Thể loại"
        actionLabel="+ Thể loại mới"
        actionHref="/admin/genres/new"
      />
      <DataTable columns={columns} rows={list} empty="Chưa có thể loại." />
    </section>
  );
}
