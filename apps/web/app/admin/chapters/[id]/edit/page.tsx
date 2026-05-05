import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { ChapterForm } from "@/components/admin/forms/chapter-form";
import { updateChapter } from "@/app/admin/_actions/chapter";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Sửa chương" };

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { story: { select: { id: true, title: true, licenseStatus: true } } },
  });
  if (!chapter) notFound();

  const action = async (formData: FormData) => {
    "use server";
    await updateChapter(id, formData);
  };

  return (
    <section>
      <PageHeader title={`Sửa chương ${chapter.number}: ${chapter.title}`} />
      <ChapterForm
        action={action}
        stories={[chapter.story]}
        lockedStory={chapter.story}
        initial={{
          storyId: chapter.storyId,
          number: chapter.number,
          title: chapter.title,
          slug: chapter.slug,
          content: chapter.content,
          sourceUrl: chapter.sourceUrl,
          publishStatus: chapter.publishStatus,
          scheduledAt: chapter.scheduledAt
            ? chapter.scheduledAt.toISOString()
            : null,
        }}
      />
    </section>
  );
}
