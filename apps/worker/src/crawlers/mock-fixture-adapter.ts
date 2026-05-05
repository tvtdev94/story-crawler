import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LicenseMode } from "@story-crawler/core";
import type {
  CrawlerAdapter,
  StoryStub,
  ChapterStub,
} from "./adapter-interface";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures", "mock-stories.json");

type Fixture = {
  stories: StoryStub[];
  chaptersByStory: Record<
    string,
    Array<{ number: number; title: string; content: string }>
  >;
};

let cache: Fixture | null = null;
async function loadFixture(): Promise<Fixture> {
  if (cache) return cache;
  const raw = await readFile(FIXTURE, "utf8");
  cache = JSON.parse(raw) as Fixture;
  return cache;
}

export const mockFixtureAdapter: CrawlerAdapter = {
  key: "mock-fixture",
  licenseMode: LicenseMode.MOCK,
  async discoverStories(): Promise<StoryStub[]> {
    const fx = await loadFixture();
    return fx.stories;
  },
  async fetchChapters(storyExternalId: string): Promise<ChapterStub[]> {
    const fx = await loadFixture();
    const list = fx.chaptersByStory[storyExternalId] ?? [];
    return list.map((c) => ({
      externalId: `${storyExternalId}#ch${c.number}`,
      storyExternalId,
      number: c.number,
      title: c.title,
    }));
  },
  async fetchChapterContent(chapterExternalId: string): Promise<string> {
    const fx = await loadFixture();
    const [storyExternalId, chRef] = chapterExternalId.split("#");
    if (!storyExternalId || !chRef) throw new Error("Invalid externalId");
    const num = Number(chRef.replace("ch", ""));
    const list = fx.chaptersByStory[storyExternalId] ?? [];
    const ch = list.find((x) => x.number === num);
    if (!ch) throw new Error(`Chapter ${chapterExternalId} not found`);
    return ch.content;
  },
};
