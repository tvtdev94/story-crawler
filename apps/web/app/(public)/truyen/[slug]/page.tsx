import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoryDetail } from "@/lib/public/queries";

export const revalidate = 60;

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
    <main className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-paper-dark/5">
          {story.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.coverUrl}
              alt={story.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-ink-muted">
              {story.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl">{story.title}</h1>
          {story.author?.name && (
            <p className="text-ink-muted">Tác giả: {story.author.name}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {story.genres.map((g) => (
              <Link
                key={g.genreId}
                href={`/the-loai/${g.genre.slug}`}
                className="rounded-full border border-border px-2 py-0.5 hover:border-accent"
              >
                {g.genre.name}
              </Link>
            ))}
          </div>
          {story.licenseStatus === "METADATA_ONLY" && (
            <p className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              Truyện này chỉ có metadata. Đọc tại nguồn gốc nếu có liên kết.
            </p>
          )}
          {story.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {story.description}
            </p>
          )}
        </div>
      </article>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-2xl">Danh sách chương</h2>
        {story.chapters.length === 0 ? (
          <p className="text-ink-muted">Chưa có chương được đăng.</p>
        ) : (
          <ol className="grid gap-1 text-sm md:grid-cols-2">
            {story.chapters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/truyen/${story.slug}/${c.slug}`}
                  className="block rounded px-3 py-2 hover:bg-paper-dark/5"
                >
                  Ch.{c.number}: {c.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
