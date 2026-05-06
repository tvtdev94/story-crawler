import { beforeEach, describe, expect, it, vi } from "vitest";

type Item = {
  id: string;
  storyId: string;
  externalId: string;
  number: number;
  title: string;
  sourceUrl: string | null;
  status: string;
  errorMessage: string | null;
  attempts: number;
  fetchedAt: Date | null;
  chapterId: string | null;
  source: {
    id: string;
    adapterKey: string;
    licenseMode: "FULL" | "METADATA_ONLY" | "MOCK";
    rateLimitMs: number;
  };
  story: { id: string };
};

const state: { item: Item | null; chapters: any[] } = { item: null, chapters: [] };
const fetchSpy = vi.fn(async (_id: string) => "Hello chapter content");

vi.mock("@story-crawler/db", () => ({
  prisma: {
    discoveredItem: {
      findUnique: vi.fn(async () => state.item),
      update: vi.fn(async ({ data }: { data: any }) => {
        if (state.item) {
          if (data.status) state.item.status = data.status;
          if ("chapterId" in data) state.item.chapterId = data.chapterId;
          if ("fetchedAt" in data) state.item.fetchedAt = data.fetchedAt;
        }
        return state.item;
      }),
    },
    chapter: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: any }) => {
        const ch = { id: `chapter_${state.chapters.length + 1}`, ...data };
        state.chapters.push(ch);
        return ch;
      }),
    },
  },
}));

vi.mock("../src/crawlers/adapter-registry", () => ({
  getAdapter: vi.fn(() => ({
    key: "test",
    licenseMode: "FULL",
    discoverStories: vi.fn(),
    fetchChapters: vi.fn(),
    fetchChapterContent: fetchSpy,
  })),
}));

import { fetchItem } from "../src/services/fetch-item";

function baseItem(overrides: Partial<Item["source"]> = {}): Item {
  return {
    id: "item_1",
    storyId: "story_1",
    externalId: "ch_external",
    number: 1,
    title: "Chapter One",
    sourceUrl: "https://x.test/c1",
    status: "QUEUED",
    errorMessage: null,
    attempts: 0,
    fetchedAt: null,
    chapterId: null,
    source: {
      id: "src_1",
      adapterKey: "test",
      licenseMode: "FULL",
      rateLimitMs: 0,
      ...overrides,
    },
    story: { id: "story_1" },
  };
}

describe("fetchItem", () => {
  beforeEach(() => {
    state.item = null;
    state.chapters = [];
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValue("Hello chapter content");
  });

  it("FULL mode: calls adapter and stores content", async () => {
    state.item = baseItem({ licenseMode: "FULL" });
    const out = await fetchItem("item_1");
    expect(out.kind).toBe("FETCHED");
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(state.chapters[0].content).toBe("Hello chapter content");
    expect(state.item!.status).toBe("FETCHED");
  });

  it("MOCK mode: calls adapter and stores content", async () => {
    state.item = baseItem({ licenseMode: "MOCK" });
    const out = await fetchItem("item_1");
    expect(out.kind).toBe("FETCHED");
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(state.chapters[0].content).toBe("Hello chapter content");
  });

  it("METADATA_ONLY: does NOT call adapter, content=null enforced", async () => {
    state.item = baseItem({ licenseMode: "METADATA_ONLY" });
    const out = await fetchItem("item_1");
    expect(out.kind).toBe("FETCHED");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.chapters[0].content).toBeNull();
  });

  it("skips when status !== QUEUED (idempotency guard)", async () => {
    state.item = baseItem();
    state.item.status = "FETCHED";
    const out = await fetchItem("item_1");
    expect(out.kind).toBe("SKIPPED_NOT_QUEUED");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.chapters.length).toBe(0);
  });
});
