import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapter, getAdjacentChapters } from "@/lib/public/queries";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
} from "@/components/public/icons";

export const revalidate = 60;

function parseChapterSlug(slug: string): number | null {
  const m = /^chuong-(\d+)/.exec(slug);
  return m ? Number(m[1]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const n = parseChapterSlug(chapterSlug);
  if (n === null) return { title: "Không tìm thấy chương" };
  const chapter = await getChapter(slug, n);
  if (!chapter) return { title: "Không tìm thấy chương" };
  return {
    title: `Ch.${chapter.number} ${chapter.title}`,
    description: `${chapter.story.title} — Chương ${chapter.number}: ${chapter.title}`,
    openGraph: {
      title: `${chapter.story.title} — Ch.${chapter.number}`,
      description: chapter.title,
      type: "article",
      images: chapter.story.coverUrl
        ? [{ url: chapter.story.coverUrl }]
        : undefined,
    },
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}) {
  const { slug, chapterSlug } = await params;
  const n = parseChapterSlug(chapterSlug);
  if (n === null) notFound();
  const chapter = await getChapter(slug, n);
  if (!chapter) notFound();

  const { prev, next } = await getAdjacentChapters(chapter.story.id, n);
  const isMetaOnly = chapter.story.licenseStatus === "METADATA_ONLY";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapter.title,
    position: chapter.number,
    isPartOf: { "@type": "Book", name: chapter.story.title },
    inLanguage: "vi",
  };

  return (
    <article className="mx-auto max-w-reader px-5 pb-24 pt-10 md:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-12 font-sans text-xs text-ink-muted dark:text-ink-dark-dim">
        <Link
          href={`/truyen/${chapter.story.slug}`}
          className="inline-flex items-center gap-1.5 hover:text-accent dark:hover:text-accent-soft"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {chapter.story.title}
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-12 space-y-3">
        <p className="smallcaps text-accent">Chương {chapter.number}</p>
        <h1 className="font-serif text-display-lg text-balance">
          {chapter.title}
        </h1>
      </header>

      {/* Body */}
      {isMetaOnly || !chapter.content ? (
        <section className="rounded-sm border border-accent/30 bg-accent/5 p-6 font-body dark:border-accent-soft/30 dark:bg-accent/10">
          <p className="font-serif text-xl">Chương chỉ có metadata.</p>
          <p className="mt-2 text-ink-dim dark:text-ink-dark-dim">
            Trạm Truyện không lưu nội dung tác phẩm này. Bạn có thể đọc tại
            nguồn gốc.
          </p>
          {chapter.sourceUrl && (
            <a
              href={chapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-accent underline-offset-4 hover:underline dark:text-accent-soft"
            >
              Đọc tại nguồn gốc
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          )}
        </section>
      ) : (
        <section className="prose-reader font-body text-reader text-ink dark:text-ink-dark">
          {chapter.content
            .split(/\n\s*\n/)
            .map((p, i) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </section>
      )}

      {/* Ornament */}
      <div className="my-16 flex items-center justify-center text-accent/40 dark:text-accent-soft/40">
        <span className="font-serif text-2xl tracking-[1em] -mr-[1em]">
          ❦
        </span>
      </div>

      {/* Footer nav */}
      <nav className="hairline-t grid grid-cols-3 items-center gap-2 pt-6 font-sans text-sm">
        <div className="justify-self-start">
          {prev ? (
            <Link
              href={`/truyen/${chapter.story.slug}/${prev.slug}`}
              className="group inline-flex items-center gap-2 text-ink-dim hover:text-accent dark:text-ink-dark-dim dark:hover:text-accent-soft"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Chương {prev.number}</span>
              <span className="sm:hidden">Trước</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
        <Link
          href={`/truyen/${chapter.story.slug}`}
          className="inline-flex items-center justify-center gap-2 justify-self-center text-ink-muted hover:text-accent dark:text-ink-dark-dim dark:hover:text-accent-soft"
        >
          <BookIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Mục lục</span>
        </Link>
        <div className="justify-self-end">
          {next ? (
            <Link
              href={`/truyen/${chapter.story.slug}/${next.slug}`}
              className="group inline-flex items-center gap-2 text-ink-dim hover:text-accent dark:text-ink-dark-dim dark:hover:text-accent-soft"
            >
              <span className="hidden sm:inline">Chương {next.number}</span>
              <span className="sm:hidden">Sau</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </nav>
    </article>
  );
}
