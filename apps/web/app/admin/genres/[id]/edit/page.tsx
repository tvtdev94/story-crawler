import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { GenreForm } from "@/components/admin/forms/genre-form";
import { updateGenre } from "@/app/admin/_actions/genre";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Sửa thể loại" };

export default async function EditGenrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const genre = await prisma.genre.findUnique({ where: { id } });
  if (!genre) notFound();

  const action = async (formData: FormData) => {
    "use server";
    await updateGenre(id, formData);
  };

  return (
    <section>
      <PageHeader title={`Sửa: ${genre.name}`} />
      <GenreForm action={action} initial={genre} />
    </section>
  );
}
