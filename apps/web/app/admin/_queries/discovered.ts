import { prisma } from "@story-crawler/db";
import { DiscoveredStatus } from "@story-crawler/core";

export type DiscoveredFilter = {
  status?: DiscoveredStatus;
  sourceId?: string;
  page?: number;
  limit?: number;
};

export async function listDiscovered(filter: DiscoveredFilter) {
  const status = filter.status ?? DiscoveredStatus.DISCOVERED;
  const page = Math.max(1, filter.page ?? 1);
  const limit = filter.limit ?? 50;
  const where = {
    status,
    ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.discoveredItem.findMany({
      where,
      orderBy: [{ discoveredAt: "desc" }, { number: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        story: { select: { title: true, slug: true } },
        source: { select: { name: true } },
      },
    }),
    prisma.discoveredItem.count({ where }),
  ]);
  return { rows, total, page, limit };
}

export type SourceCounts = Record<string, Record<DiscoveredStatus, number>>;

export async function getSourceInboxCounts(): Promise<SourceCounts> {
  const grouped = await prisma.discoveredItem.groupBy({
    by: ["sourceId", "status"],
    _count: { _all: true },
  });
  const out: SourceCounts = {};
  for (const g of grouped) {
    const bucket =
      out[g.sourceId] ??
      (out[g.sourceId] = {
        DISCOVERED: 0,
        QUEUED: 0,
        FETCHED: 0,
        SKIPPED: 0,
        FAILED: 0,
      });
    bucket[g.status as DiscoveredStatus] = g._count._all;
  }
  return out;
}

export async function getInboxTabCounts(sourceId?: string) {
  const where = sourceId ? { sourceId } : {};
  const grouped = await prisma.discoveredItem.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });
  const out: Record<DiscoveredStatus, number> = {
    DISCOVERED: 0,
    QUEUED: 0,
    FETCHED: 0,
    SKIPPED: 0,
    FAILED: 0,
  };
  for (const g of grouped) {
    out[g.status as DiscoveredStatus] = g._count._all;
  }
  return out;
}
