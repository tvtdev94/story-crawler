import Link from "next/link";
import { searchStories } from "@/lib/public/queries";

export const metadata = { title: "Tìm kiếm" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const results = q ? await searchStories(q) : [];

  return (
    <main className="container space-y-6 py-8">
      <h1 className="font-serif text-3xl">Tìm kiếm</h1>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nhập tiêu đề truyện…"
          className="h-10 flex-1 rounded-md border border-border bg-transparent px-3 text-sm"
          autoFocus
        />
        <button className="h-10 rounded-md border border-accent px-4 text-sm text-accent hover:bg-accent hover:text-white">
          Tìm
        </button>
      </form>
      {q && (
        <p className="text-sm text-ink-muted">
          {results.length} kết quả cho “{q}”
        </p>
      )}
      <ul className="divide-y divide-border rounded-lg border border-border">
        {results.map((s) => (
          <li key={s.id}>
            <Link
              href={`/truyen/${s.slug}`}
              className="block px-4 py-3 hover:bg-paper-dark/5"
            >
              <span className="font-medium">{s.title}</span>
              {s.author?.name && (
                <span className="ml-2 text-xs text-ink-muted">
                  {s.author.name}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
