"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { AuthorInput, slugifyVi } from "@story-crawler/core";
import { requireSession } from "@/lib/auth/require-role";

export async function createAuthor(formData: FormData) {
  await requireSession();
  const parsed = AuthorInput.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    bio: formData.get("bio") || null,
  });
  await prisma.author.create({
    data: {
      name: parsed.name,
      slug: parsed.slug || slugifyVi(parsed.name),
      bio: parsed.bio ?? null,
    },
  });
  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}

export async function updateAuthor(id: string, formData: FormData) {
  await requireSession();
  const parsed = AuthorInput.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    bio: formData.get("bio") || null,
  });
  await prisma.author.update({
    where: { id },
    data: {
      name: parsed.name,
      slug: parsed.slug || slugifyVi(parsed.name),
      bio: parsed.bio ?? null,
    },
  });
  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}

export async function deleteAuthor(id: string) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.author.delete({ where: { id } });
  revalidatePath("/admin/authors");
}
