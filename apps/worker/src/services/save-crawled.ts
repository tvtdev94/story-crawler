import { prisma } from "@story-crawler/db";
import {
  applyLicensePolicy,
  sha256Normalized,
  slugifyVi,
  chapterSlug,
  LicenseMode,
} from "@story-crawler/core";
import type { Source } from "@prisma/client";
import type { CrawlerAdapter, StoryStub } from "../crawlers/adapter-interface";
import { logger } from "../logger";

export type SaveResult = {
  storiesFound: number;
  storiesNew: number;
  chaptersFound: number;
  chaptersNew: number;
};

export async function saveCrawled(
  source: Source,
  adapter: CrawlerAdapter,
): Promise<SaveResult> {
  const stories = await adapter.discoverStories();
  let storiesNew = 0;
  let chaptersFound = 0;
  let chaptersNew = 0;

  for (const stub of stories) {
    const story = await upsertStory(source.id, source.licenseMode, stub);
    if (story.created) storiesNew += 1;

    const chapters = await adapter.fetchChapters(stub.externalId);
    chaptersFound += chapters.length;

    for (const ch of chapters) {
      // Dedupe by (storyId, number)
      const exists = await prisma.chapter.findUnique({
        where: { storyId_number: { storyId: story.id, number: ch.number } },
      });
      if (exists) continue;

      let rawContent: string | null = null;
      if (
        source.licenseMode === LicenseMode.FULL ||
        source.licenseMode === LicenseMode.MOCK
      ) {
        if (adapter.fetchChapterContent) {
          try {
            rawContent = await adapter.fetchChapterContent(ch.externalId);
          } catch (err) {
            logger.warn(
              { err, chapter: ch.externalId },
              "fetchChapterContent failed",
            );
            rawContent = null;
          }
        }
      }

      const policed = applyLicensePolicy(source.licenseMode, {
        content: rawContent,
        sourceUrl: ch.sourceUrl ?? null,
      });

      const contentHash = policed.content
        ? sha256Normalized(policed.content)
        : null;

      // Dedupe by (storyId, contentHash) when content present.
      if (contentHash) {
        const dup = await prisma.chapter.findUnique({
          where: { storyId_contentHash: { storyId: story.id, contentHash } },
        });
        if (dup) continue;
      }

      try {
        await prisma.chapter.create({
          data: {
            storyId: story.id,
            number: ch.number,
            title: ch.title,
            slug: chapterSlug(ch.title, ch.number),
            content: policed.content,
            contentHash,
            sourceUrl: policed.sourceUrl,
            externalId: ch.externalId,
            publishStatus: "PENDING_REVIEW",
          },
        });
        chaptersNew += 1;
      } catch (err) {
        logger.warn({ err, chapter: ch.externalId }, "create chapter failed");
      }
    }
  }

  await prisma.source.update({
    where: { id: source.id },
    data: { lastRunAt: new Date() },
  });

  return {
    storiesFound: stories.length,
    storiesNew,
    chaptersFound,
    chaptersNew,
  };
}

async function upsertStory(
  sourceId: string,
  licenseMode: LicenseMode,
  stub: StoryStub,
): Promise<{ id: string; created: boolean; slug: string }> {
  const existing = await prisma.story.findFirst({
    where: { sourceId, externalId: stub.externalId },
  });
  if (existing) {
    return { id: existing.id, created: false, slug: existing.slug };
  }

  const author = stub.authorName
    ? await prisma.author.upsert({
        where: { slug: slugifyVi(stub.authorName) },
        update: {},
        create: {
          name: stub.authorName,
          slug: slugifyVi(stub.authorName),
        },
      })
    : null;

  let baseSlug = slugifyVi(stub.title);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.story.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${baseSlug}-${i}`;
  }

  const policed = applyLicensePolicy(licenseMode, {
    content: null,
    sourceUrl: stub.sourceUrl,
  });

  const story = await prisma.story.create({
    data: {
      title: stub.title,
      slug,
      authorId: author?.id,
      description: stub.description ?? null,
      coverUrl: stub.coverUrl ?? null,
      storyStatus: "ONGOING",
      licenseStatus: policed.licenseStatus,
      sourceUrl: stub.sourceUrl,
      sourceId,
      externalId: stub.externalId,
    },
  });

  if (stub.genres && stub.genres.length > 0) {
    for (const name of stub.genres) {
      const gSlug = slugifyVi(name);
      const genre = await prisma.genre.upsert({
        where: { slug: gSlug },
        update: {},
        create: { name, slug: gSlug },
      });
      await prisma.storyGenre.upsert({
        where: { storyId_genreId: { storyId: story.id, genreId: genre.id } },
        update: {},
        create: { storyId: story.id, genreId: genre.id },
      });
    }
  }

  return { id: story.id, created: true, slug: story.slug };
}
