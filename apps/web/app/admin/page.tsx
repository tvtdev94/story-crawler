import { requireSession } from "@/lib/auth/require-role";
import {
  getDashboardStats,
  getRecentActivity,
} from "@/app/admin/_queries/dashboard-stats";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Tổng quan" };

export default async function AdminDashboard() {
  const session = await requireSession();
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(15),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tổng quan"
        description={`Chào ${session.user.email} · ${session.user.role}`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Truyện" value={stats.storyCount} />
        <StatCard label="Chương đã đăng" value={stats.publishedChapters} />
        <StatCard
          label="Chờ duyệt"
          value={stats.pendingReview}
          hint={stats.pendingReview > 0 ? "Có chương cần xử lý" : undefined}
        />
        <StatCard label="Đã lên lịch" value={stats.scheduled} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatCard
          label="Crawl 24h"
          value={`${stats.recentCrawl.success} ✓ / ${stats.recentCrawl.failed} ✗`}
        />
        <StatCard
          label="Publish 24h"
          value={`${stats.recentPublish.success} ✓ / ${stats.recentPublish.failed} ✗`}
        />
      </div>

      <div>
        <h2 className="mb-3 font-serif text-xl">Hoạt động gần đây</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-ink-muted">Chưa có hoạt động.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {activity.map((a) => (
              <li
                key={`${a.kind}-${a.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="flex-1">{a.label}</span>
                <span className="shrink-0">
                  {a.kind === "crawl" ? (
                    <StatusBadge
                      kind="job"
                      value={
                        (a.status as "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED") ??
                        "QUEUED"
                      }
                    />
                  ) : (
                    <span
                      className={
                        a.status === "SUCCESS"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
                      }
                    >
                      {a.status}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {a.at.toLocaleString("vi-VN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
