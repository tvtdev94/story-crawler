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
      className="group flex flex-col gap-3 transition-opacity duration-200 hover:opacity-95"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-paper-deep shadow-sm transition-shadow duration-300 group-hover:shadow-md dark:bg-paper-dark-elev">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
            <span className="font-serif text-6xl text-accent/70">
              {title.slice(0, 1)}
            </span>
            <span className="smallcaps text-ink-muted dark:text-ink-dark-dim">
              Trạm Truyện
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg leading-tight text-balance text-ink decoration-accent/40 underline-offset-4 group-hover:underline dark:text-ink-dark">
          {title}
        </h3>
        {authorName && (
          <p className="font-sans text-xs text-ink-dim dark:text-ink-dark-dim">
            {authorName}
          </p>
        )}
        {description && (
          <p className="line-clamp-2 pt-1 font-body text-sm leading-relaxed text-ink-dim dark:text-ink-dark-dim">
            {description}
          </p>
        )}
        {typeof chapterCount === "number" && chapterCount > 0 && (
          <p className="pt-1 smallcaps text-accent">
            {chapterCount} chương
          </p>
        )}
      </div>
    </Link>
  );
}
