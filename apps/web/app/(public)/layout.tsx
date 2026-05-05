import Link from "next/link";
import { ThemeToggle } from "@/components/public/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-paper/80 backdrop-blur dark:bg-paper-dark/80">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-serif text-lg">
            Trạm Truyện
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/truyen" className="hover:text-accent">
              Truyện
            </Link>
            <Link href="/tim-kiem" className="hover:text-accent">
              Tìm kiếm
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border py-6 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Trạm Truyện · Nơi mỗi câu chuyện dừng chân.
      </footer>
    </div>
  );
}
