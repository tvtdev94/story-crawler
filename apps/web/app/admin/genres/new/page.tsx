import { PageHeader } from "@/components/admin/page-header";
import { GenreForm } from "@/components/admin/forms/genre-form";
import { createGenre } from "@/app/admin/_actions/genre";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Thêm thể loại" };

export default async function NewGenrePage() {
  await requireSession();
  return (
    <section>
      <PageHeader title="Thêm thể loại" />
      <GenreForm action={createGenre} />
    </section>
  );
}
