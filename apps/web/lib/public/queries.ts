import { prisma } from "@story-crawler/db";
import type { Prisma } from "@prisma/client";

const publishedChapter: Prisma.ChapterWhereInput = {
  publishStatus: "PUBLISHED",
};

export async function getLatestStories(limit = 12) {
  return prisma.story.findMany({
    where: { chapters: { some: publishedChapter } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true, slug: true } },
      _count: { select: { chapters: { where: publishedChapter } } },
    },
  });
}

export async function getLatestChapters(limit = 10) {
  return prisma.chapter.findMany({
    where: publishedChapter,
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      story: { select: { title: true, slug: true, coverUrl: true } },
    },
  });
}

export async function listStories(opts: {
  q?: string;
  status?: "ONGOING" | "COMPLETED" | "HIATUS";
  genreSlug?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.StoryWhereInput = {
    chapters: { some: publishedChapter },
    ...(opts.q
      ? { title: { contains: opts.q, mode: "insensitive" } }
      : {}),
    ...(opts.status ? { storyStatus: opts.status } : {}),
    ...(opts.genreSlug
      ? { genres: { some: { genre: { slug: opts.genreSlug } } } }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.story.count({ where }),
    prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      include: {
        author: { select: { name: true, slug: true } },
        genres: { include: { genre: true } },
      },
    }),
  ]);
  return { total, items };
}

export async function getStoryDetail(slug: string) {
  return prisma.story.findFirst({
    where: { slug },
    include: {
      author: true,
      genres: { include: { genre: true } },
      chapters: {
        where: publishedChapter,
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          slug: true,
          publishedAt: true,
        },
      },
    },
  });
}

export async function getChapter(storySlug: string, number: number) {
  return prisma.chapter.findFirst({
    where: {
      number,
      story: { slug: storySlug },
      publishStatus: "PUBLISHED",
    },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          licenseStatus: true,
          coverUrl: true,
        },
      },
    },
  });
}

export async function getAdjacentChapters(storyId: string, number: number) {
  const [prev, next] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        storyId,
        publishStatus: "PUBLISHED",
        number: { lt: number },
      },
      orderBy: { number: "desc" },
      select: { number: true, slug: true },
    }),
    prisma.chapter.findFirst({
      where: {
        storyId,
        publishStatus: "PUBLISHED",
        number: { gt: number },
      },
      orderBy: { number: "asc" },
      select: { number: true, slug: true },
    }),
  ]);
  return { prev, next };
}

export async function listGenres() {
  return prisma.genre.findMany({ orderBy: { name: "asc" } });
}

export async function getGenreBySlug(slug: string) {
  return prisma.genre.findUnique({ where: { slug } });
}

export async function searchStories(q: string, limit = 30) {
  if (!q.trim()) return [];
  return prisma.story.findMany({
    where: {
      title: { contains: q, mode: "insensitive" },
      chapters: { some: publishedChapter },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { author: { select: { name: true, slug: true } } },
  });
}

export async function getAllPublishedForSitemap() {
  const [stories, chapters] = await Promise.all([
    prisma.story.findMany({
      where: { chapters: { some: publishedChapter } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.chapter.findMany({
      where: publishedChapter,
      select: {
        number: true,
        slug: true,
        publishedAt: true,
        story: { select: { slug: true } },
      },
    }),
  ]);
  return { stories, chapters };
}
