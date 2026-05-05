import type { MetadataRoute } from "next";
import { getAllPublishedForSitemap } from "@/lib/public/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const { stories, chapters } = await getAllPublishedForSitemap();

  const storyUrls: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${base}/truyen/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const chapterUrls: MetadataRoute.Sitemap = chapters.map((c) => ({
    url: `${base}/truyen/${c.story.slug}/${c.slug}`,
    lastModified: c.publishedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: base,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/truyen`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...storyUrls,
    ...chapterUrls,
  ];
}
