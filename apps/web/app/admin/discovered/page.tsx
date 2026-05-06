import Link from "next/link";
import { prisma } from "@story-crawler/db";
import { DiscoveredStatus } from "@story-crawler/core";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { InboxTabs } from "@/components/admin/inbox-tabs";
import {
  BulkActionForm,
  type BulkAction,
  type BulkActionRow,
} from "@/components/admin/bulk-action-form";
import {
  listDiscovered,
  getInboxTabCounts,
} from "@/app/admin/_queries/discovered";
import {
  bulkFetch,
  bulkSkip,
  restoreItems,
  retryFailed,
} from "./_actions";
import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Inbox" };

const ALL_STATUS: DiscoveredStatus[] = [
  "DISCOVERED",
  "QUEUED",
  "FETCHED",
  "SKIPPED",
  "FAILED",
];

function parseStatus(v: string | undefined): DiscoveredStatus {
  if (v && (ALL_STATUS as string[]).includes(v)) return v as DiscoveredStatus;
  return "DISCOVERED";
}

export default async function DiscoveredInboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const sp = await searchParams;
  const status = parseStatus(typeof sp.status === "string" ? sp.status : undefined);
  const sourceId = typeof sp.sourceId === "string" ? sp.sourceId : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;

  const [{ rows, total, limit }, counts, sources] = await Promise.all([
    listDiscovered({ status, sourceId, page }),
    getInboxTabCounts(sourceId),
    prisma.source.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const tableRows: BulkActionRow[] = rows.map((r) => ({
    id: r.id,
    cells: [
      <Link
        key="story"
        href={`/admin/stories/${r.storyId}/edit`}
        className="text-accent"
      >
        {r.story.title}
      </Link>,
      <span key="ch" className="font-mono text-xs">
        Ch.{r.number}
      </span>,
      <span key="title">{r.title}</span>,
      <span key="src" className="text-xs text-ink-muted">
        {r.source.name}
      </span>,
      r.errorMessage ? (
        <span key="err" className="text-xs text-red-600">
          {r.errorMessage.slice(0, 80)}
        </span>
      ) : (
        <span key="when" className="text-xs text-ink-muted">
          {r.discoveredAt.toLocaleString("vi-VN")}
        </span>
      ),
    ],
  }));

  const actions = bulkActionsForStatus(status);

  return (
    <section>
      <PageHeader
        title="Inbox phát hiện"
        description="Danh sách chương stub đã discover. Chọn để fetch nội dung hoặc bỏ qua."
      />
      <InboxTabs current={status} counts={counts} sourceId={sourceId} />
      <div className="mb-3 flex items-center gap-3 text-sm">
        <form className="flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <select
            name="sourceId"
            defaultValue={sourceId ?? ""}
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="">— Tất cả nguồn —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded border border-border px-3 py-1 hover:bg-paper-dark/5"
          >
            Lọc
          </button>
        </form>
      </div>
      <BulkActionForm
        headers={["Truyện", "Số", "Tiêu đề", "Nguồn", "Thông tin"]}
        rows={tableRows}
        actions={actions}
        empty="Không có dòng nào ở tab này."
      />
      <Pagination
        page={page}
        total={total}
        limit={limit}
        basePath="/admin/discovered"
        query={{ status, sourceId }}
      />
    </section>
  );
}

function bulkActionsForStatus(status: DiscoveredStatus): BulkAction[] {
  switch (status) {
    case "DISCOVERED":
      return [
        {
          key: "fetch",
          label: "Fetch nội dung",
          action: async (ids) => {
            "use server";
            await bulkFetch(ids);
          },
        },
        {
          key: "skip",
          label: "Bỏ qua",
          variant: "outline",
          action: async (ids) => {
            "use server";
            await bulkSkip(ids);
          },
        },
      ];
    case "SKIPPED":
      return [
        {
          key: "restore",
          label: "Khôi phục",
          action: async (ids) => {
            "use server";
            await restoreItems(ids);
          },
        },
      ];
    case "FAILED":
      return [
        {
          key: "retry",
          label: "Retry",
          action: async (ids) => {
            "use server";
            await retryFailed(ids);
          },
        },
      ];
    default:
      return [];
  }
}
