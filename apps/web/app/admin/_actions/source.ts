"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { SourceInput } from "@story-crawler/core";
import { requireRole, requireSession } from "@/lib/auth/require-role";
import { enqueueCrawl } from "@/lib/queues/crawl-enqueue";

function parseSourceForm(formData: FormData) {
  return SourceInput.parse({
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl"),
    adapterKey: formData.get("adapterKey"),
    licenseMode: formData.get("licenseMode"),
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    rateLimitMs: formData.get("rateLimitMs"),
  });
}

export async function createSource(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = parseSourceForm(formData);
  await prisma.source.create({ data: parsed });
  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function updateSource(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const parsed = parseSourceForm(formData);
  await prisma.source.update({ where: { id }, data: parsed });
  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function deleteSource(id: string) {
  await requireRole("ADMIN");
  await prisma.source.delete({ where: { id } });
  revalidatePath("/admin/sources");
}

export async function runSource(id: string) {
  const session = await requireRole("ADMIN");
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) throw new Error("Source không tồn tại");
  if (!source.enabled) throw new Error("Source đang bị tắt");
  await enqueueCrawl(id, session.user.email ?? session.user.id);
  revalidatePath("/admin/sources");
  revalidatePath("/admin/crawl-jobs");
}
