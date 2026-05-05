import { notFound } from "next/navigation";
import { StoryCard } from "@/components/public/story-card";
import { Pagination } from "@/components/admin/pagination";
import { getGenreBySlug, listStories } from "@/lib/public/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  return { title: genre ? `Thể loại: ${genre.name}` : "Thể loại" };
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const genre = await getGenreBySlug(slug);
  if (!genre) notFound();

  const page = Math.max(1, Number(sp.page ?? "1"));
  const limit = 20;
  const { total, items } = await listStories({
    genreSlug: slug,
    page,
    limit,
  });

  return (
    <main className="container space-y-6 py-8">
      <h1 className="font-serif text-3xl">Thể loại: {genre.name}</h1>
      {items.length === 0 ? (
        <p className="text-ink-muted">Chưa có truyện thuộc thể loại này.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((s) => (
            <StoryCard
              key={s.id}
              slug={s.slug}
              title={s.title}
              coverUrl={s.coverUrl}
              authorName={s.author?.name}
              description={s.description}
            />
          ))}
        </div>
      )}
      <Pagination
        page={page}
        total={total}
        limit={limit}
        basePath={`/the-loai/${slug}`}
      />
    </main>
  );
}
