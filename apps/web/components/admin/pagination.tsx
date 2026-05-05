import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  total,
  limit,
  basePath,
  query = {},
}: {
  page: number;
  total: number;
  limit: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2),
  );

  return (
    <nav className="mt-4 flex items-center gap-2 text-sm" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="rounded border border-border px-3 py-1 hover:bg-paper-dark/5"
        >
          ‹ Trước
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={cn(
            "rounded border px-3 py-1",
            p === page
              ? "border-accent bg-accent text-white"
              : "border-border hover:bg-paper-dark/5",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          className="rounded border border-border px-3 py-1 hover:bg-paper-dark/5"
        >
          Sau ›
        </Link>
      )}
      <span className="ml-2 text-ink-muted">
        Tổng {total} · Trang {page}/{totalPages}
      </span>
    </nav>
  );
}
