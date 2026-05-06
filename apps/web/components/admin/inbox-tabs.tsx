import Link from "next/link";
import { cn } from "@/lib/utils";
import { DiscoveredStatus } from "@story-crawler/core";

const TABS: { status: DiscoveredStatus; label: string }[] = [
  { status: "DISCOVERED", label: "Mới" },
  { status: "QUEUED", label: "Đang xử lý" },
  { status: "FETCHED", label: "Đã fetch" },
  { status: "SKIPPED", label: "Bỏ qua" },
  { status: "FAILED", label: "Lỗi" },
];

export function InboxTabs({
  current,
  counts,
  sourceId,
}: {
  current: DiscoveredStatus;
  counts: Record<DiscoveredStatus, number>;
  sourceId?: string;
}) {
  const buildHref = (status: DiscoveredStatus) => {
    const sp = new URLSearchParams({ status });
    if (sourceId) sp.set("sourceId", sourceId);
    return `/admin/discovered?${sp.toString()}`;
  };
  return (
    <nav className="mb-4 flex flex-wrap gap-2 border-b border-border">
      {TABS.map((t) => (
        <Link
          key={t.status}
          href={buildHref(t.status)}
          className={cn(
            "rounded-t border-b-2 px-3 py-2 text-sm",
            t.status === current
              ? "border-accent text-accent"
              : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          {t.label}
          <span className="ml-2 text-xs text-ink-muted">
            ({counts[t.status] ?? 0})
          </span>
        </Link>
      ))}
    </nav>
  );
}
