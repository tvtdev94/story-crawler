import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { StoryForm } from "@/components/admin/forms/story-form";
import { updateStory } from "@/app/admin/_actions/story";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Sửa truyện" };

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const [story, authors, genres] = await Promise.all([
    prisma.story.findUnique({
      where: { id },
      include: { genres: true },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!story) notFound();

  const action = async (formData: FormData) => {
    "use server";
    await updateStory(id, formData);
  };

  return (
    <section>
      <PageHeader title={`Sửa: ${story.title}`} />
      <StoryForm
        action={action}
        authors={authors}
        genres={genres}
        initial={{
          title: story.title,
          slug: story.slug,
          authorId: story.authorId,
          description: story.description,
          coverUrl: story.coverUrl,
          storyStatus: story.storyStatus,
          licenseStatus: story.licenseStatus,
          sourceUrl: story.sourceUrl,
          genreIds: story.genres.map((g) => g.genreId),
        }}
      />
    </section>
  );
}
