import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { ChapterForm } from "@/components/admin/forms/chapter-form";
import { createChapter } from "@/app/admin/_actions/chapter";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Thêm chương" };

export default async function NewChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ storyId?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const stories = await prisma.story.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, licenseStatus: true },
    take: 500,
  });
  const lockedStory = sp.storyId
    ? stories.find((s) => s.id === sp.storyId)
    : undefined;

  return (
    <section>
      <PageHeader title="Thêm chương" />
      <ChapterForm
        action={createChapter}
        stories={stories}
        lockedStory={lockedStory}
        initial={{ storyId: sp.storyId }}
      />
    </section>
  );
}
