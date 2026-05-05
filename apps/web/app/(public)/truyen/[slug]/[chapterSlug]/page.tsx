import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapter, getAdjacentChapters } from "@/lib/public/queries";

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
    <main className="mx-auto max-w-reader px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-4 text-xs text-ink-muted">
        <Link href={`/truyen/${chapter.story.slug}`} className="hover:text-accent">
          ← {chapter.story.title}
        </Link>
      </nav>
      <header className="mb-6 space-y-1 border-b border-border pb-4">
        <p className="text-sm text-ink-muted">Chương {chapter.number}</p>
        <h1 className="font-serif text-3xl">{chapter.title}</h1>
      </header>
      {isMetaOnly || !chapter.content ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-2 font-medium">Chương chỉ có metadata.</p>
          {chapter.sourceUrl ? (
            <a
              href={chapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Đọc tại nguồn gốc →
            </a>
          ) : (
            <p>Không có liên kết nguồn.</p>
          )}
        </div>
      ) : (
        <article className="font-reader whitespace-pre-line text-base leading-reader">
          {chapter.content}
        </article>
      )}
      <nav className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        {prev ? (
          <Link
            href={`/truyen/${chapter.story.slug}/${prev.slug}`}
            className="rounded border border-border px-3 py-2 hover:border-accent"
          >
            ← Ch.{prev.number}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/truyen/${chapter.story.slug}`}
          className="text-ink-muted hover:text-accent"
        >
          Mục lục
        </Link>
        {next ? (
          <Link
            href={`/truyen/${chapter.story.slug}/${next.slug}`}
            className="rounded border border-border px-3 py-2 hover:border-accent"
          >
            Ch.{next.number} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
