"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { StoryInput, slugifyVi, RESERVED_SLUGS } from "@story-crawler/core";
import { requireSession } from "@/lib/auth/require-role";

function ensureSlug(input: { slug?: string | null; title: string }) {
  const out = (input.slug || slugifyVi(input.title)).trim();
  if (!out || RESERVED_SLUGS.has(out)) {
    throw new Error(`Slug không hợp lệ hoặc bị reserved: "${out}"`);
  }
  return out;
}

function parseStoryForm(formData: FormData) {
  return StoryInput.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    authorId: formData.get("authorId") || null,
    description: formData.get("description") || null,
    coverUrl: formData.get("coverUrl") || null,
    storyStatus: formData.get("storyStatus") || "ONGOING",
    licenseStatus: formData.get("licenseStatus") || "METADATA_ONLY",
    sourceUrl: formData.get("sourceUrl") || null,
    genreIds: formData.getAll("genreIds").map(String).filter(Boolean),
  });
}

export async function createStory(formData: FormData) {
  await requireSession();
  const parsed = parseStoryForm(formData);
  const slug = ensureSlug(parsed);
  await prisma.story.create({
    data: {
      title: parsed.title,
      slug,
      authorId: parsed.authorId || null,
      description: parsed.description ?? null,
      coverUrl: parsed.coverUrl ?? null,
      storyStatus: parsed.storyStatus,
      licenseStatus: parsed.licenseStatus,
      sourceUrl: parsed.sourceUrl ?? null,
      genres: {
        create: parsed.genreIds.map((genreId: string) => ({ genreId })),
      },
    },
  });
  revalidatePath("/admin/stories");
  redirect("/admin/stories");
}

export async function updateStory(id: string, formData: FormData) {
  await requireSession();
  const parsed = parseStoryForm(formData);
  const slug = ensureSlug(parsed);
  await prisma.$transaction(async (tx) => {
    await tx.story.update({
      where: { id },
      data: {
        title: parsed.title,
        slug,
        authorId: parsed.authorId || null,
        description: parsed.description ?? null,
        coverUrl: parsed.coverUrl ?? null,
        storyStatus: parsed.storyStatus,
        licenseStatus: parsed.licenseStatus,
        sourceUrl: parsed.sourceUrl ?? null,
      },
    });
    await tx.storyGenre.deleteMany({ where: { storyId: id } });
    if (parsed.genreIds.length > 0) {
      await tx.storyGenre.createMany({
        data: parsed.genreIds.map((genreId: string) => ({ storyId: id, genreId })),
        skipDuplicates: true,
      });
    }
  });
  revalidatePath("/admin/stories");
  revalidateTag(`story:${slug}`);
  redirect("/admin/stories");
}

export async function deleteStory(id: string) {
  await requireSession();
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return;
  await prisma.story.delete({ where: { id } });
  revalidatePath("/admin/stories");
  revalidateTag(`story:${story.slug}`);
}
