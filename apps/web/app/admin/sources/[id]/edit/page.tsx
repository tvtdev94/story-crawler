import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { SourceForm } from "@/components/admin/forms/source-form";
import { updateSource } from "@/app/admin/_actions/source";
import { requireRole } from "@/lib/auth/require-role";

const ADAPTER_KEYS = ["mock-fixture", "gutenberg-vi", "metadata-only-demo"];

export const metadata = { title: "Sửa nguồn" };

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) notFound();

  const action = async (formData: FormData) => {
    "use server";
    await updateSource(id, formData);
  };

  return (
    <section>
      <PageHeader title={`Sửa nguồn: ${source.name}`} />
      <SourceForm action={action} adapterKeys={ADAPTER_KEYS} initial={source} />
    </section>
  );
}
