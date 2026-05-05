import { notFound, redirect } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scheduleChapter, publishNow } from "@/app/admin/_actions/review";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Lên lịch đăng" };

export default async function ScheduleChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { story: { select: { title: true, slug: true } } },
  });
  if (!chapter) notFound();

  const scheduleAction = async (formData: FormData) => {
    "use server";
    const raw = formData.get("scheduledAt");
    if (typeof raw !== "string" || !raw) throw new Error("Thiếu thời gian");
    await scheduleChapter(id, new Date(raw));
    redirect("/admin/chapters?status=SCHEDULED");
  };

  const publishNowAction = async () => {
    "use server";
    await publishNow(id);
    redirect("/admin/chapters?status=PUBLISHED");
  };

  return (
    <section>
      <PageHeader
        title={`Lên lịch: Ch.${chapter.number} ${chapter.title}`}
        description={chapter.story.title}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <form action={scheduleAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Đăng vào lúc (giờ địa phương)</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
            />
          </div>
          <Button type="submit">Lên lịch</Button>
          <p className="text-xs text-ink-muted">
            Publisher chạy 60s/lần — sẽ tự đăng khi đến giờ.
          </p>
        </form>
        <form action={publishNowAction} className="space-y-3">
          <p className="text-sm">Hoặc đăng ngay không qua hẹn giờ.</p>
          <Button type="submit" variant="outline">
            Đăng ngay
          </Button>
        </form>
      </div>
    </section>
  );
}
