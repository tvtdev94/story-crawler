import Link from "next/link";
import { StoryCard } from "@/components/public/story-card";
import { Pagination } from "@/components/admin/pagination";
import { listStories, listGenres } from "@/lib/public/queries";

export const revalidate = 60;
export const metadata = { title: "Tất cả truyện" };

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
    <main className="container space-y-6 py-8">
      <h1 className="font-serif text-3xl">Tất cả truyện</h1>
      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Tìm tiêu đề…"
          className="h-9 rounded-md border border-border bg-transparent px-3"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-border bg-transparent px-3"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="h-9 rounded-md border border-border px-3">
          Lọc
        </button>
      </form>

      <nav className="flex flex-wrap gap-2 text-sm">
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/the-loai/${g.slug}`}
            className="rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent"
          >
            {g.name}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="text-ink-muted">Không tìm thấy truyện nào.</p>
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
        basePath="/truyen"
        query={{ q, status }}
      />
    </main>
  );
}
