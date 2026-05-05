"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { GenreInput, slugifyVi } from "@story-crawler/core";
import { requireSession } from "@/lib/auth/require-role";

export async function createGenre(formData: FormData) {
  await requireSession();
  const parsed = GenreInput.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
  });
  await prisma.genre.create({
    data: {
      name: parsed.name,
      slug: parsed.slug || slugifyVi(parsed.name),
    },
  });
  revalidatePath("/admin/genres");
  redirect("/admin/genres");
}

export async function updateGenre(id: string, formData: FormData) {
  await requireSession();
  const parsed = GenreInput.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
  });
  await prisma.genre.update({
    where: { id },
    data: {
      name: parsed.name,
      slug: parsed.slug || slugifyVi(parsed.name),
    },
  });
  revalidatePath("/admin/genres");
  redirect("/admin/genres");
}

export async function deleteGenre(id: string) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.genre.delete({ where: { id } });
  revalidatePath("/admin/genres");
}
