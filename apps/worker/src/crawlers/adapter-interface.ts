import type { LicenseMode } from "@story-crawler/core";

export type StoryStub = {
  externalId: string;
  title: string;
  authorName?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  sourceUrl: string;
  genres?: string[];
};

export type ChapterStub = {
  externalId: string;
  storyExternalId: string;
  number: number;
  title: string;
  sourceUrl?: string | null;
};

export interface CrawlerAdapter {
  key: string;
  licenseMode: LicenseMode;
  discoverStories(): Promise<StoryStub[]>;
  fetchChapters(storyExternalId: string): Promise<ChapterStub[]>;
  fetchChapterContent?(chapterExternalId: string): Promise<string>;
}
