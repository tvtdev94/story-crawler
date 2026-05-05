import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoryDetail } from "@/lib/public/queries";
import { ArrowRightIcon } from "@/components/public/icons";

export const revalidate = 60;

const STATUS_LABEL: Record<string, string> = {
  ONGOING: "Đang tiến hành",
  COMPLETED: "Hoàn thành",
  HIATUS: "Tạm dừng",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryDetail(slug);
  if (!story) return { title: "Không tìm thấy truyện" };
  return {
    title: story.title,
    description: story.description ?? `Đọc truyện ${story.title} tại Trạm Truyện.`,
    openGraph: {
      title: story.title,
      description: story.description ?? "",
      type: "book",
      images: story.coverUrl ? [{ url: story.coverUrl }] : undefined,
    },
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStoryDetail(slug);
  if (!story) notFound();

  const firstChapter = story.chapters[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: story.title,
    author: story.author?.name
      ? { "@type": "Person", name: story.author.name }
      : undefined,
    description: story.description ?? undefined,
    image: story.coverUrl ?? undefined,
    inLanguage: "vi",
    numberOfPages: story.chapters.length,
  };

  return (
    <main className="container py-12 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <article className="grid gap-10 md:grid-cols-[240px_1fr] lg:gap-16">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-sm bg-paper-deep shadow-md dark:bg-paper-dark-elev">
          {story.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
              <span className="font-serif text-7xl text-accent/70">
                {story.title.slice(0, 1)}
              </span>
              <span className="smallcaps text-ink-muted dark:text-ink-dark-dim">
                Trạm Truyện
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="smallcaps text-accent">
              {STATUS_LABEL[story.storyStatus] ?? "Truyện"}
            </p>
            <h1 className="font-serif text-display-lg text-balance">
              {story.title}
            </h1>
            {story.author?.name && (
              <p className="font-body text-lg text-ink-dim italic dark:text-ink-dark-dim">
                bởi {story.author.name}
              </p>
            )}
          </div>

          {story.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 font-sans text-xs">
              {story.genres.map((g) => (
                <Link
                  key={g.genreId}
                  href={`/the-loai/${g.genre.slug}`}
                  className="rounded-full border border-rule px-3 py-1.5 text-ink-dim transition-colors duration-200 hover:border-accent hover:text-accent dark:border-rule-dark dark:text-ink-dark-dim dark:hover:text-accent-soft"
                >
                  {g.genre.name}
                </Link>
              ))}
            </div>
          )}

          {story.licenseStatus === "METADATA_ONLY" && (
            <div className="rounded-sm border border-accent/30 bg-accent/5 p-4 font-body text-sm text-ink dark:border-accent-soft/30 dark:bg-accent/10 dark:text-ink-dark">
              <p className="font-medium">Chỉ có metadata.</p>
              <p className="mt-1 text-ink-dim dark:text-ink-dark-dim">
                Trạm Truyện không lưu nội dung của tác phẩm này. Hãy đọc tại
                nguồn gốc nếu có liên kết.
              </p>
            </div>
          )}

          {story.description && (
            <p className="max-w-prose font-body text-lede leading-relaxed text-ink-dim text-pretty dark:text-ink-dark-dim">
              {story.description}
            </p>
          )}

          {firstChapter && (
            <div className="pt-4">
              <Link
                href={`/truyen/${story.slug}/${firstChapter.slug}`}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-sans text-sm text-paper transition-colors duration-200 hover:bg-accent dark:bg-ink-dark dark:text-paper-dark dark:hover:bg-accent-soft dark:hover:text-paper-dark"
              >
                Bắt đầu đọc
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* Chapter list */}
      <section className="mt-section hairline-t pt-12">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="smallcaps mb-1 text-ink-muted dark:text-ink-dark-dim">
              Mục lục
            </p>
            <h2 className="font-serif text-display">
              {story.chapters.length} chương
            </h2>
          </div>
        </header>
        {story.chapters.length === 0 ? (
          <p className="font-body italic text-ink-muted dark:text-ink-dark-dim">
            Chưa có chương được đăng.
          </p>
        ) : (
          <ol className="grid gap-x-8 md:grid-cols-2">
            {story.chapters.map((c) => (
              <li
                key={c.id}
                className="hairline-b first:hairline-t md:first:[&:nth-child(-n+2)]:hairline-t"
              >
                <Link
                  href={`/truyen/${story.slug}/${c.slug}`}
                  className="group grid grid-cols-[auto_1fr] items-baseline gap-4 py-4 transition-opacity duration-200 hover:opacity-90"
                >
                  <span className="font-serif text-xl text-ink-muted tabular-nums dark:text-ink-dark-dim">
                    {String(c.number).padStart(2, "0")}
                  </span>
                  <span className="font-body text-base text-balance text-ink group-hover:text-accent dark:text-ink-dark">
                    {c.title}
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
