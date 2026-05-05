import Link from "next/link";
import { StoryCard } from "@/components/public/story-card";
import { Pagination } from "@/components/admin/pagination";
import { listStories, listGenres } from "@/lib/public/queries";

export const revalidate = 60;
export const metadata = { title: "Thư viện" };

const STATUS_LABELS = {
  ONGOING: "Đang tiến hành",
  COMPLETED: "Hoàn thành",
  HIATUS: "Tạm dừng",
} as const;

function isStoryStatus(v: unknown): v is keyof typeof STATUS_LABELS {
  return typeof v === "string" && v in STATUS_LABELS;
}

export default async function StoryListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const limit = 20;
  const status = isStoryStatus(sp.status) ? sp.status : undefined;
  const q = sp.q?.trim();
  const { total, items } = await listStories({ q, status, page, limit });
  const genres = await listGenres();

  return (
    <main className="container space-y-12 py-16 md:py-20">
      <header className="space-y-3">
        <p className="smallcaps text-accent">Thư viện</p>
        <h1 className="font-serif text-display-lg text-balance">
          {q ? `Kết quả cho “${q}”` : "Tất cả truyện"}
        </h1>
        {total > 0 && (
          <p className="font-body text-ink-dim dark:text-ink-dark-dim">
            {total} đầu sách trên kệ.
          </p>
        )}
      </header>

      {/* Filter form */}
      <form className="hairline-b flex flex-wrap items-center gap-3 pb-6 font-sans text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Tìm theo tiêu đề"
          className="h-10 flex-1 min-w-[180px] rounded-none border-0 border-b border-rule bg-transparent px-1 placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-0 dark:border-rule-dark dark:placeholder:text-ink-dark-dim"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-none border-0 border-b border-rule bg-transparent px-1 focus:border-accent focus:outline-none dark:border-rule-dark"
        >
          <option value="">Mọi trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-full bg-ink px-5 text-paper transition-colors duration-200 hover:bg-accent dark:bg-ink-dark dark:text-paper-dark dark:hover:bg-accent-soft">
          Lọc
        </button>
      </form>

      {/* Genre chips */}
      {genres.length > 0 && (
        <nav className="flex flex-wrap gap-2 font-sans text-xs">
          <span className="smallcaps mr-2 self-center text-ink-muted dark:text-ink-dark-dim">
            Thể loại
          </span>
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/the-loai/${g.slug}`}
              className="rounded-full border border-rule px-3 py-1.5 text-ink-dim transition-colors duration-200 hover:border-accent hover:text-accent dark:border-rule-dark dark:text-ink-dark-dim dark:hover:text-accent-soft"
            >
              {g.name}
            </Link>
          ))}
        </nav>
      )}

      {/* Grid or empty */}
      {items.length === 0 ? (
        <div className="hairline-t pt-12 text-center font-body italic text-ink-muted dark:text-ink-dark-dim">
          Không tìm thấy truyện phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
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
        basePath="/truyen"
        query={{ q, status }}
      />
    </main>
  );
}
