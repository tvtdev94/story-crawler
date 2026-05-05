import Link from "next/link";
import { StoryCard } from "@/components/public/story-card";
import {
  getLatestStories,
  getLatestChapters,
} from "@/lib/public/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [stories, chapters] = await Promise.all([
    getLatestStories(8),
    getLatestChapters(10),
  ]);

  return (
    <main className="container space-y-12 py-10">
      <section className="space-y-3 text-center">
        <h1 className="font-serif text-4xl md:text-5xl">Trạm Truyện</h1>
        <p className="text-ink-muted">Nơi mỗi câu chuyện dừng chân.</p>
        <Link
          href="/truyen"
          className="inline-block rounded-md border border-accent px-5 py-2 text-sm text-accent hover:bg-accent hover:text-white"
        >
          Khám phá thư viện
        </Link>
      </section>

      <section>
        <header className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl">Mới cập nhật</h2>
          <Link href="/truyen" className="text-sm text-accent hover:underline">
            Tất cả →
          </Link>
        </header>
        {stories.length === 0 ? (
          <p className="text-ink-muted">Chưa có truyện được đăng.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {stories.map((s) => (
              <StoryCard
                key={s.id}
                slug={s.slug}
                title={s.title}
                coverUrl={s.coverUrl}
                authorName={s.author?.name}
                description={s.description}
                chapterCount={s._count.chapters}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Chương mới</h2>
        {chapters.length === 0 ? (
          <p className="text-ink-muted">Chưa có chương được đăng.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {chapters.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <Link
                  href={`/truyen/${c.story.slug}/${c.slug}`}
                  className="flex items-baseline justify-between gap-3 hover:text-accent"
                >
                  <span className="line-clamp-1">
                    <span className="font-medium">{c.story.title}</span>{" "}
                    <span className="text-ink-muted">— Ch.{c.number}: {c.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {c.publishedAt?.toLocaleDateString("vi-VN")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
