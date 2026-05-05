import { PageHeader } from "@/components/admin/page-header";
import { AuthorForm } from "@/components/admin/forms/author-form";
import { createAuthor } from "@/app/admin/_actions/author";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Thêm tác giả" };

export default async function NewAuthorPage() {
  await requireSession();
  return (
    <section>
      <PageHeader title="Thêm tác giả" />
      <AuthorForm action={createAuthor} />
    </section>
  );
}
