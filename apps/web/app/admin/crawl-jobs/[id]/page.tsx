import { notFound } from "next/navigation";
import { prisma } from "@story-crawler/db";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Crawl job detail" };

export default async function CrawlJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const job = await prisma.crawlJob.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!job) notFound();

  return (
    <section className="space-y-4">
      <PageHeader
        title={`Crawl ${job.source.name}`}
        description={`#${job.id}`}
      />
      <dl className="grid gap-3 rounded-lg border border-border p-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ink-muted">Trạng thái</dt>
          <dd>
            <StatusBadge kind="job" value={job.status} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Adapter</dt>
          <dd>
            <code>{job.source.adapterKey}</code>
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Bắt đầu</dt>
          <dd>{job.startedAt.toLocaleString("vi-VN")}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Kết thúc</dt>
          <dd>{job.finishedAt?.toLocaleString("vi-VN") ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Items found / new</dt>
          <dd>
            {job.itemsFound} / {job.itemsNew}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Triggered by</dt>
          <dd>{job.triggeredBy ?? "—"}</dd>
        </div>
      </dl>
      {job.errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <h2 className="mb-2 font-medium text-red-900">Error message</h2>
          <pre className="whitespace-pre-wrap text-xs text-red-900">
            {job.errorMessage}
          </pre>
        </div>
      )}
    </section>
  );
}
