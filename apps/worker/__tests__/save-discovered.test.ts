import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  stories: new Map<string, { id: string; sourceId: string; externalId: string; slug: string }>(),
  items: new Map<string, { sourceId: string; externalId: string }>(),
};

vi.mock("@story-crawler/db", () => {
  return {
    prisma: {
      story: {
        findFirst: vi.fn(async ({ where }: { where: { sourceId: string; externalId: string } }) => {
          for (const s of state.stories.values()) {
            if (s.sourceId === where.sourceId && s.externalId === where.externalId) return s;
          }
          return null;
        }),
        findUnique: vi.fn(async ({ where }: { where: { slug: string } }) => {
          for (const s of state.stories.values()) {
            if (s.slug === where.slug) return s;
          }
          return null;
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = `story_${state.stories.size + 1}`;
          const s = {
            id,
            sourceId: data.sourceId,
            externalId: data.externalId,
            slug: data.slug,
          };
          state.stories.set(id, s);
          return s;
        }),
      },
      author: { upsert: vi.fn(async ({ create }: any) => ({ id: `author_${create.slug}` })) },
      genre: { upsert: vi.fn(async () => ({ id: "g" })) },
      storyGenre: { upsert: vi.fn(async () => ({})) },
      discoveredItem: {
        createMany: vi.fn(
          async ({
            data,
            skipDuplicates,
          }: {
            data: { sourceId: string; externalId: string }[];
            skipDuplicates?: boolean;
          }) => {
            let count = 0;
            for (const d of data) {
              const key = `${d.sourceId}:${d.externalId}`;
              if (state.items.has(key)) {
                if (skipDuplicates) continue;
                throw new Error("dup");
              }
              state.items.set(key, { sourceId: d.sourceId, externalId: d.externalId });
              count += 1;
            }
            return { count };
          },
        ),
      },
      source: {
        update: vi.fn(async () => ({})),
      },
    },
  };
});

import { saveDiscovered } from "../src/services/save-discovered";

const fakeSource = {
  id: "src_1",
  licenseMode: "MOCK",
  rateLimitMs: 0,
} as any;

function makeAdapter(stories = 2, chapters = 3) {
  const storyStubs = Array.from({ length: stories }, (_, i) => ({
    externalId: `s${i + 1}`,
    title: `Story ${i + 1}`,
    sourceUrl: `https://x.test/s${i + 1}`,
  }));
  const chs = (storyId: string) =>
    Array.from({ length: chapters }, (_, i) => ({
      externalId: `${storyId}-ch${i + 1}`,
      storyExternalId: storyId,
      number: i + 1,
      title: `Ch ${i + 1}`,
    }));
  return {
    key: "test",
    licenseMode: "MOCK" as const,
    discoverStories: vi.fn(async () => storyStubs),
    fetchChapters: vi.fn(async (id: string) => chs(id)),
  };
}

describe("saveDiscovered", () => {
  beforeEach(() => {
    state.stories.clear();
    state.items.clear();
  });

  it("inserts stories + DiscoveredItem stubs (2 × 3 = 6)", async () => {
    const adapter = makeAdapter(2, 3);
    const result = await saveDiscovered(fakeSource, adapter as any);
    expect(result.storiesFound).toBe(2);
    expect(result.storiesNew).toBe(2);
    expect(result.itemsFound).toBe(6);
    expect(result.itemsNew).toBe(6);
    expect(state.items.size).toBe(6);
  });

  it("re-run is idempotent (0 new on second call)", async () => {
    const adapter = makeAdapter(2, 3);
    await saveDiscovered(fakeSource, adapter as any);
    const second = await saveDiscovered(fakeSource, adapter as any);
    expect(second.itemsNew).toBe(0);
    expect(second.storiesNew).toBe(0);
    expect(state.items.size).toBe(6);
  });
});
