import { prisma } from "@story-crawler/db";
import {
  applyLicensePolicy,
  sha256Normalized,
  chapterSlug,
  LicenseMode,
  DiscoveredStatus,
} from "@story-crawler/core";
import { getAdapter } from "../crawlers/adapter-registry";
import { logger } from "../logger";

export type FetchItemResult =
  | { kind: "FETCHED"; chapterId: string }
  | { kind: "DUPLICATE" }
  | { kind: "SKIPPED_NOT_QUEUED" };

export async function fetchItem(
  discoveredItemId: string,
): Promise<FetchItemResult> {
  const item = await prisma.discoveredItem.findUnique({
    where: { id: discoveredItemId },
    include: { source: true, story: true },
  });
  if (!item) throw new Error(`DiscoveredItem ${discoveredItemId} not found`);

  if (item.status !== DiscoveredStatus.QUEUED) {
    logger.info(
      { id: discoveredItemId, status: item.status },
      "fetch-item skip: not QUEUED",
    );
    return { kind: "SKIPPED_NOT_QUEUED" };
  }

  const source = item.source;
  if (item.sourceUrl) {
    const ok = /^https?:\/\//i.test(item.sourceUrl);
    if (!ok) throw new Error(`Invalid sourceUrl scheme: ${item.sourceUrl}`);
  }

  const adapter = getAdapter(source.adapterKey);
  if (!adapter) throw new Error(`Adapter ${source.adapterKey} unknown`);

  let rawContent: string | null = null;
  if (
    source.licenseMode === LicenseMode.FULL ||
    source.licenseMode === LicenseMode.MOCK
  ) {
    if (adapter.fetchChapterContent) {
      rawContent = await adapter.fetchChapterContent(item.externalId);
    }
    if (source.rateLimitMs > 0) {
      await sleep(source.rateLimitMs);
    }
  }

  const policed = applyLicensePolicy(source.licenseMode, {
    content: rawContent,
    sourceUrl: item.sourceUrl,
  });

  const contentHash = policed.content
    ? sha256Normalized(policed.content)
    : null;

  if (contentHash) {
    const dup = await prisma.chapter.findUnique({
      where: {
        storyId_contentHash: { storyId: item.storyId, contentHash },
      },
    });
    if (dup) {
      await prisma.discoveredItem.update({
        where: { id: item.id },
        data: {
          status: DiscoveredStatus.FETCHED,
          fetchedAt: new Date(),
          chapterId: dup.id,
        },
      });
      logger.info(
        { id: item.id, chapterId: dup.id },
        "fetch-item duplicate by contentHash",
      );
      return { kind: "DUPLICATE" };
    }
  }

  const chapter = await prisma.chapter.create({
    data: {
      storyId: item.storyId,
      number: item.number,
      title: item.title,
      slug: chapterSlug(item.title, item.number),
      content: policed.content,
      contentHash,
      sourceUrl: policed.sourceUrl,
      externalId: item.externalId,
      publishStatus: "PENDING_REVIEW",
    },
  });

  await prisma.discoveredItem.update({
    where: { id: item.id },
    data: {
      status: DiscoveredStatus.FETCHED,
      fetchedAt: new Date(),
      chapterId: chapter.id,
    },
  });

  return { kind: "FETCHED", chapterId: chapter.id };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
