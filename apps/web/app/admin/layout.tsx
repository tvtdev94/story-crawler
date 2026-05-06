import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/stories", label: "Truyện" },
  { href: "/admin/chapters", label: "Chương" },
  { href: "/admin/review", label: "Chờ duyệt" },
  { href: "/admin/discovered", label: "Inbox" },
  { href: "/admin/authors", label: "Tác giả" },
  { href: "/admin/genres", label: "Thể loại" },
  { href: "/admin/sources", label: "Nguồn", adminOnly: true },
  { href: "/admin/crawl-jobs", label: "Crawl jobs" },
  { href: "/admin/publish-logs", label: "Publish logs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // Middleware already gated /admin/* (except /admin/login).
  // For login page session may be null — render a thin shell without nav.
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-paper text-ink dark:bg-paper-dark dark:text-ink-dark">
        {children}
      </div>
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink dark:bg-paper-dark dark:text-ink-dark">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/admin" className="font-serif text-lg">
          Trạm Truyện · Admin
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">
            {session.user.email} · {session.user.role}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Đăng xuất
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
          <nav className="space-y-1">
            {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block rounded px-3 py-2 text-sm hover:bg-paper-dark/5 dark:hover:bg-paper/5"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
