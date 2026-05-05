import { LicenseMode } from "@story-crawler/core";
import type {
  CrawlerAdapter,
  StoryStub,
  ChapterStub,
} from "./adapter-interface";

export const metadataOnlyDemoAdapter: CrawlerAdapter = {
  key: "metadata-only-demo",
  licenseMode: LicenseMode.METADATA_ONLY,
  async discoverStories(): Promise<StoryStub[]> {
    return [
      {
        externalId: "external-source-001",
        title: "Truyện ngoại bản — bản quyền chưa cấp",
        authorName: "Tác giả mẫu",
        description:
          "Đây là demo của adapter chỉ lưu metadata. Nội dung sẽ KHÔNG được lưu vào DB.",
        sourceUrl: "https://example.com/truyen-ngoai-ban",
        genres: ["Đô thị"],
      },
    ];
  },
  async fetchChapters(storyExternalId: string): Promise<ChapterStub[]> {
    if (storyExternalId !== "external-source-001") return [];
    return Array.from({ length: 3 }, (_, i) => ({
      externalId: `${storyExternalId}#${i + 1}`,
      storyExternalId,
      number: i + 1,
      title: `Chương ${i + 1}`,
      sourceUrl: `https://example.com/truyen-ngoai-ban/chuong-${i + 1}`,
    }));
  },
  // No fetchChapterContent — chokepoint will null content out anyway.
};
