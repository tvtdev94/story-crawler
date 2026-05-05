import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { AuthorForm } from "@/components/admin/forms/author-form";
import { updateAuthor } from "@/app/admin/_actions/author";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Sửa tác giả" };

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const author = await prisma.author.findUnique({ where: { id } });
  if (!author) notFound();

  const action = async (formData: FormData) => {
    "use server";
    await updateAuthor(id, formData);
  };

  return (
    <section>
      <PageHeader title={`Sửa: ${author.name}`} />
      <AuthorForm action={action} initial={author} />
    </section>
  );
}
