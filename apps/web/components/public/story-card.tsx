import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  coverUrl?: string | null;
  authorName?: string | null;
  description?: string | null;
  chapterCount?: number;
};

export function StoryCard({
  slug,
  title,
  coverUrl,
  authorName,
  description,
  chapterCount,
}: Props) {
  return (
    <Link
      href={`/truyen/${slug}`}
      className="group flex flex-col gap-2 rounded-lg border border-border p-3 transition hover:border-accent hover:shadow-sm"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-paper-dark/5">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-ink-muted">
            {title.slice(0, 1)}
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 font-serif text-base">{title}</h3>
      {authorName && (
        <p className="text-xs text-ink-muted">{authorName}</p>
      )}
      {description && (
        <p className="line-clamp-2 text-xs text-ink-muted">{description}</p>
      )}
      {typeof chapterCount === "number" && (
        <p className="mt-auto text-xs text-accent">{chapterCount} chương</p>
      )}
    </Link>
  );
}
