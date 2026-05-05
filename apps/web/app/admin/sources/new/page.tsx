import { PageHeader } from "@/components/admin/page-header";
import { SourceForm } from "@/components/admin/forms/source-form";
import { createSource } from "@/app/admin/_actions/source";
import { requireRole } from "@/lib/auth/require-role";

const ADAPTER_KEYS = ["mock-fixture", "gutenberg-vi", "metadata-only-demo"];

export const metadata = { title: "Thêm nguồn" };

export default async function NewSourcePage() {
  await requireRole("ADMIN");
  return (
    <section>
      <PageHeader title="Thêm nguồn" />
      <SourceForm action={createSource} adapterKeys={ADAPTER_KEYS} />
    </section>
  );
}
