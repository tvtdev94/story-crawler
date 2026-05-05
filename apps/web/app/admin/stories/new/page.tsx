import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { StoryForm } from "@/components/admin/forms/story-form";
import { createStory } from "@/app/admin/_actions/story";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Thêm truyện" };

export default async function NewStoryPage() {
  await requireSession();
  const [authors, genres] = await Promise.all([
    prisma.author.findMany({ orderBy: { name: "asc" } }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <section>
      <PageHeader title="Thêm truyện" />
      <StoryForm action={createStory} authors={authors} genres={genres} />
    </section>
  );
}
