import { prisma } from "@story-crawler/db";
import { applyLicensePolicy, slugifyVi } from "@story-crawler/core";
import type { Source } from "@prisma/client";
import type { CrawlerAdapter, StoryStub } from "../crawlers/adapter-interface";
import { logger } from "../logger";

export type SaveDiscoveredResult = {
  storiesFound: number;
  storiesNew: number;
  itemsFound: number;
  itemsNew: number;
};

export async function saveDiscovered(
  source: Source,
  adapter: CrawlerAdapter,
): Promise<SaveDiscoveredResult> {
  const stories = await adapter.discoverStories();
  let storiesNew = 0;
  let itemsFound = 0;
  let itemsNew = 0;

  for (const stub of stories) {
    let story: { id: string; created: boolean };
    try {
      story = await upsertStory(source.id, source.licenseMode, stub);
    } catch (err) {
      logger.warn({ err, story: stub.externalId }, "upsertStory failed");
      continue;
    }
    if (story.created) storiesNew += 1;

    try {
      const chapters = await adapter.fetchChapters(stub.externalId);
      itemsFound += chapters.length;

      if (chapters.length === 0) continue;

      const created = await prisma.discoveredItem.createMany({
        data: chapters.map((ch) => ({
          sourceId: source.id,
          storyId: story.id,
          externalId: ch.externalId,
          number: ch.number,
          title: ch.title,
          sourceUrl: ch.sourceUrl ?? null,
        })),
        skipDuplicates: true,
      });
      itemsNew += created.count;
    } catch (err) {
      logger.warn({ err, story: stub.externalId }, "discover chapters failed");
    }
  }

  await prisma.source.update({
    where: { id: source.id },
    data: { lastRunAt: new Date() },
  });

  return { storiesFound: stories.length, storiesNew, itemsFound, itemsNew };
}

async function upsertStory(
  sourceId: string,
  licenseMode: Source["licenseMode"],
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
        create: { name: stub.authorName, slug: slugifyVi(stub.authorName) },
      })
    : null;

  const baseSlug = slugifyVi(stub.title);
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
