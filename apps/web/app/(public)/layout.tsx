import Link from "next/link";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { SearchIcon } from "@/components/public/icons";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col font-body">
      <header className="sticky top-0 z-30 hairline-b bg-paper/80 backdrop-blur-md dark:bg-paper-dark/80">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="font-serif text-2xl tracking-tight text-ink hover:text-accent dark:text-ink-dark dark:hover:text-accent-soft"
          >
            Trạm Truyện
          </Link>
          <nav className="flex items-center gap-1 font-sans text-sm md:gap-4">
            <Link
              href="/truyen"
              className="hidden rounded px-2 py-1 text-ink/80 transition-colors duration-200 hover:text-accent dark:text-ink-dark/80 dark:hover:text-accent-soft md:inline"
            >
              Thư viện
            </Link>
            <Link
              href="/tim-kiem"
              aria-label="Tìm kiếm"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors duration-200 hover:bg-paper-deep hover:text-accent dark:text-ink-dark-dim dark:hover:bg-paper-dark-elev"
            >
              <SearchIcon className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="hairline-t mt-section">
        <div className="container flex flex-col items-center gap-2 py-10 text-center text-xs text-ink-muted dark:text-ink-dark-dim">
          <p className="font-serif text-base italic text-ink-dim dark:text-ink-dark-dim">
            Nơi mỗi câu chuyện dừng chân.
          </p>
          <p className="smallcaps">© {new Date().getFullYear()} · Trạm Truyện</p>
        </div>
      </footer>
    </div>
  );
}
