"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import {
  ChapterInput,
  chapterSlug,
  sha256Normalized,
  LicenseStatus,
} from "@story-crawler/core";
import { requireSession } from "@/lib/auth/require-role";

function parseChapterForm(formData: FormData) {
  return ChapterInput.parse({
    storyId: formData.get("storyId"),
    number: formData.get("number"),
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    content: formData.get("content") || null,
    sourceUrl: formData.get("sourceUrl") || null,
    publishStatus: formData.get("publishStatus") || "DRAFT",
    scheduledAt: formData.get("scheduledAt") || null,
  });
}

export async function createChapter(formData: FormData) {
  await requireSession();
  const parsed = parseChapterForm(formData);
  const story = await prisma.story.findUnique({
    where: { id: parsed.storyId },
  });
  if (!story) throw new Error("Truyện không tồn tại");

  const slug = parsed.slug || chapterSlug(parsed.title, parsed.number);
  let content = parsed.content;
  if (story.licenseStatus === LicenseStatus.METADATA_ONLY) content = null;
  const contentHash = content ? sha256Normalized(content) : null;

  await prisma.chapter.create({
    data: {
      storyId: parsed.storyId,
      number: parsed.number,
      title: parsed.title,
      slug,
      content,
      contentHash,
      sourceUrl: parsed.sourceUrl ?? null,
      publishStatus: parsed.publishStatus,
      scheduledAt: parsed.scheduledAt
        ? new Date(parsed.scheduledAt as string)
        : null,
    },
  });
  revalidatePath("/admin/chapters");
  revalidateTag(`story:${story.slug}`);
  redirect(`/admin/stories/${story.id}/chapters`);
}

export async function updateChapter(id: string, formData: FormData) {
  await requireSession();
  const parsed = parseChapterForm(formData);
  const existing = await prisma.chapter.findUnique({
    where: { id },
    include: { story: true },
  });
  if (!existing) throw new Error("Chương không tồn tại");

  const slug = parsed.slug || chapterSlug(parsed.title, parsed.number);
  let content = parsed.content;
  if (existing.story.licenseStatus === LicenseStatus.METADATA_ONLY)
    content = null;
  const contentHash = content ? sha256Normalized(content) : null;

  await prisma.chapter.update({
    where: { id },
    data: {
      number: parsed.number,
      title: parsed.title,
      slug,
      content,
      contentHash,
      sourceUrl: parsed.sourceUrl ?? null,
      publishStatus: parsed.publishStatus,
      scheduledAt: parsed.scheduledAt
        ? new Date(parsed.scheduledAt as string)
        : null,
    },
  });
  revalidatePath("/admin/chapters");
  revalidateTag(`story:${existing.story.slug}`);
  redirect(`/admin/stories/${existing.storyId}/chapters`);
}

export async function deleteChapter(id: string) {
  await requireSession();
  const ch = await prisma.chapter.findUnique({
    where: { id },
    include: { story: true },
  });
  if (!ch) return;
  await prisma.chapter.delete({ where: { id } });
  revalidatePath("/admin/chapters");
  revalidateTag(`story:${ch.story.slug}`);
}
