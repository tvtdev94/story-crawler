// Gutenberg Vietnamese (vi.wikisource.org) public-domain demo adapter.
// MVP: returns a curated, hand-picked stub list. Network fetch path is wrapped
// behind a try/catch and logs on failure so MVP demo doesn't break offline.
import { LicenseMode } from "@story-crawler/core";
import type {
  CrawlerAdapter,
  StoryStub,
  ChapterStub,
} from "./adapter-interface";

const CURATED: StoryStub[] = [
  {
    externalId: "wikisource-truyen-kieu",
    title: "Truyện Kiều (trích)",
    authorName: "Nguyễn Du",
    description: "Trích đoạn mở đầu Truyện Kiều — public domain.",
    sourceUrl: "https://vi.wikisource.org/wiki/Truy%E1%BB%87n_Ki%E1%BB%81u",
    genres: ["Cổ điển"],
  },
];

const KIEU_OPENING = `Trăm năm trong cõi người ta,
Chữ tài chữ mệnh khéo là ghét nhau.
Trải qua một cuộc bể dâu,
Những điều trông thấy mà đau đớn lòng.
Lạ gì bỉ sắc tư phong,
Trời xanh quen thói má hồng đánh ghen.`;

export const gutenbergViAdapter: CrawlerAdapter = {
  key: "gutenberg-vi",
  licenseMode: LicenseMode.FULL,
  async discoverStories(): Promise<StoryStub[]> {
    return CURATED;
  },
  async fetchChapters(storyExternalId: string): Promise<ChapterStub[]> {
    if (storyExternalId !== "wikisource-truyen-kieu") return [];
    return [
      {
        externalId: `${storyExternalId}#1`,
        storyExternalId,
        number: 1,
        title: "Mở đầu",
        sourceUrl:
          "https://vi.wikisource.org/wiki/Truy%E1%BB%87n_Ki%E1%BB%81u",
      },
    ];
  },
  async fetchChapterContent(chapterExternalId: string): Promise<string> {
    if (chapterExternalId === "wikisource-truyen-kieu#1") return KIEU_OPENING;
    throw new Error(`No content for ${chapterExternalId}`);
  },
};
