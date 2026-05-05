import Link from "next/link";
import { StoryCard } from "@/components/public/story-card";
import { ArrowRightIcon } from "@/components/public/icons";
import {
  getLatestStories,
  getLatestChapters,
} from "@/lib/public/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [stories, chapters] = await Promise.all([
    getLatestStories(8),
    getLatestChapters(8),
  ]);

  return (
    <main>
      {/* Hero — editorial, oversized type */}
      <section className="container pt-20 pb-section md:pt-28">
        <p className="smallcaps mb-6 text-accent">Tạp chí truyện · est. 2026</p>
        <h1 className="font-serif text-display-xl text-balance">
          Nơi mỗi câu chuyện
          <br />
          <em className="not-italic text-accent">dừng chân.</em>
        </h1>
        <p className="mt-8 max-w-prose font-body text-lede text-ink-dim text-pretty dark:text-ink-dark-dim">
          Trạm Truyện là một nhà ga nhỏ trong đời sống đọc — tuyển chọn và
          sắp đặt lại những trang sách cũ, mới, có bản quyền và thuộc public
          domain. Không quảng cáo, không nhịp cuộn vô tận. Chỉ có chữ.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
          <Link
            href="/truyen"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-paper transition-colors duration-200 hover:bg-accent dark:bg-ink-dark dark:text-paper-dark dark:hover:bg-accent-soft dark:hover:text-paper-dark"
          >
            Vào thư viện
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/tim-kiem"
            className="text-ink-dim underline-offset-4 hover:text-accent hover:underline dark:text-ink-dark-dim"
          >
            Tìm theo tên truyện
          </Link>
        </div>
      </section>

      {/* Latest stories */}
      <section className="container hairline-t pt-section">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="smallcaps mb-2 text-ink-muted dark:text-ink-dark-dim">
              Mới cập nhật
            </p>
            <h2 className="font-serif text-display">Tủ sách hôm nay</h2>
          </div>
          <Link
            href="/truyen"
            className="hidden font-sans text-sm text-ink-dim hover:text-accent dark:text-ink-dark-dim sm:inline"
          >
            Xem tất cả →
          </Link>
        </header>
        {stories.length === 0 ? (
          <p className="font-body italic text-ink-muted dark:text-ink-dark-dim">
            Tủ sách đang được sắp xếp. Hãy quay lại sau.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
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

      {/* Latest chapters — editorial list */}
      <section className="container hairline-t mt-section pt-section">
        <header className="mb-10">
          <p className="smallcaps mb-2 text-ink-muted dark:text-ink-dark-dim">
            Vừa lên kệ
          </p>
          <h2 className="font-serif text-display">Chương mới</h2>
        </header>
        {chapters.length === 0 ? (
          <p className="font-body italic text-ink-muted dark:text-ink-dark-dim">
            Chưa có chương nào.
          </p>
        ) : (
          <ol className="divide-y divide-rule dark:divide-rule-dark">
            {chapters.map((c, idx) => (
              <li key={c.id}>
                <Link
                  href={`/truyen/${c.story.slug}/${c.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-5 transition-opacity duration-200 hover:opacity-90 sm:gap-6"
                >
                  <span className="font-serif text-2xl text-ink-muted tabular-nums dark:text-ink-dark-dim">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-title text-balance text-ink group-hover:text-accent dark:text-ink-dark">
                      {c.story.title}
                    </p>
                    <p className="mt-1 line-clamp-1 font-body text-sm text-ink-dim dark:text-ink-dark-dim">
                      Chương {c.number} · {c.title}
                    </p>
                  </div>
                  <span className="hidden shrink-0 font-sans text-xs text-ink-muted tabular-nums dark:text-ink-dark-dim sm:inline">
                    {c.publishedAt?.toLocaleDateString("vi-VN")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
