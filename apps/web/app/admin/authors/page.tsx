import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteAuthor } from "@/app/admin/_actions/author";
import { requireSession } from "@/lib/auth/require-role";

type Row = { id: string; name: string; slug: string; storyCount: number };

export const metadata = { title: "Tác giả" };

export default async function AuthorsListPage() {
  const session = await requireSession();
  const list = await prisma.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { stories: true } } },
  });
  const rows: Row[] = list.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    storyCount: a._count.stories,
  }));
  const isAdmin = session.user.role === "ADMIN";

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Tên",
      cell: (r) => (
        <Link href={`/admin/authors/${r.id}/edit`} className="text-accent">
          {r.name}
        </Link>
      ),
    },
    { key: "slug", header: "Slug", cell: (r) => <code>{r.slug}</code> },
    {
      key: "stories",
      header: "Số truyện",
      cell: (r) => r.storyCount,
      className: "w-24 text-right",
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        isAdmin ? (
          <DeleteButton
            action={async () => {
              "use server";
              await deleteAuthor(r.id);
            }}
            confirmText={`Xoá tác giả "${r.name}"?`}
          />
        ) : null,
      className: "w-48",
    },
  ];

  return (
    <section>
      <PageHeader
        title="Tác giả"
        description="Quản lý danh sách tác giả."
        actionLabel="+ Tác giả mới"
        actionHref="/admin/authors/new"
      />
      <DataTable columns={columns} rows={rows} empty="Chưa có tác giả nào." />
    </section>
  );
}
