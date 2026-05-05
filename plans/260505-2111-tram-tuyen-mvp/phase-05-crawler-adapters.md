---
phase: 05
title: Crawler core + 3 adapters + manual trigger
status: pending
priority: P0
effort: L
depends: [03]
---

# Phase 05 — Crawler Core + Adapters

## Context Links
- [plan.md](plan.md)
- [Phase 03](phase-03-domain-crud.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Crawler engine với pluggable adapters, license enforcement chokepoint, dedupe, error logging. 3 adapters: `mock-fixture`, `gutenberg-vi` (FULL), `metadata-only-demo`. Manual trigger từ admin CMS.

## Key Insights
- **License chokepoint**: tất cả write to DB đi qua `saveCrawled()` service. Adapter KHÔNG được import Prisma.
- BullMQ worker xử lý `crawl` queue; admin "Run crawl" enqueue job.
- Dedupe 2 lớp: `(storyId, chapterNumber)` + `(storyId, contentHash)`.
- contentHash = SHA-256 của normalized content (trim, collapse whitespace, lowercase).
- Adapter có config rate limit cơ bản (delay ms giữa requests).

## Requirements
**Functional:** quản lý nguồn (CRUD trong CMS), trigger crawl manual per source, run job in worker, write to DB qua chokepoint, log success/failure, set new chapters to PENDING_REVIEW.
**Non-functional:** không leak content khi METADATA_ONLY, dedupe đúng, retry thoái lui, log đủ context để debug.

## Architecture
```
apps/worker/src/
├── index.ts                            # boot worker
├── queues/
│   ├── crawl-queue.ts                  # BullMQ queue init
│   └── publish-queue.ts                # (phase 06)
├── jobs/
│   └── crawl-job.ts                    # worker handler for 'crawl'
├── crawlers/
│   ├── adapter-interface.ts            # CrawlerAdapter type
│   ├── adapter-registry.ts             # map adapterKey → adapter
│   ├── mock-fixture-adapter.ts
│   ├── gutenberg-vi-adapter.ts
│   ├── metadata-only-demo-adapter.ts
│   └── fixtures/
│       └── mock-stories.json
└── services/
    ├── save-crawled.ts                 # CHOKEPOINT
    ├── dedupe.ts
    └── crawl-logger.ts                 # writes CrawlJob rows

packages/core/src/license-guard.ts      # enforceLicense(licenseMode, payload)
```

Admin side:
```
apps/web/app/admin/sources/
├── page.tsx                            # source list
├── new/page.tsx, [id]/edit/page.tsx
└── [id]/run/route.ts                   # POST trigger enqueue
apps/web/app/admin/_actions/source.ts
apps/web/lib/queues/crawl-enqueue.ts    # share Redis connection
```

## Related Code Files
**Create:**
- All under `apps/worker/src/`
- `apps/web/app/admin/sources/{page,new/page,[id]/edit/page}.tsx`
- `apps/web/app/admin/sources/[id]/run/route.ts`
- `apps/web/app/admin/_actions/source.ts`
- `apps/web/lib/queues/crawl-enqueue.ts`
- `packages/core/src/license-guard.ts` (already in phase 01 skeleton — implement here)

## Implementation Steps
1. **Adapter interface** in `apps/worker/src/crawlers/adapter-interface.ts`:
   ```ts
   export type StoryStub = { externalId: string; title: string; authorName?: string; description?: string; coverUrl?: string; sourceUrl: string; genres?: string[] }
   export type ChapterStub = { externalId: string; storyExternalId: string; number: number; title: string; sourceUrl?: string }
   export interface CrawlerAdapter {
     key: string
     licenseMode: LicenseMode
     discoverStories(): Promise<StoryStub[]>
     fetchChapters(storyExternalId: string): Promise<ChapterStub[]>
     fetchChapterContent?(chapterExternalId: string): Promise<string>
   }
   ```
2. **Adapter registry** map adapterKey → instance.
3. **License guard** in `packages/core/src/license-guard.ts`:
   ```ts
   export function applyLicensePolicy(licenseMode, payload) {
     if (licenseMode !== 'FULL') return { ...payload, content: null, licenseStatus: 'METADATA_ONLY' }
     return { ...payload, licenseStatus: 'PUBLIC_DOMAIN' /* or per source config */ }
   }
   ```
4. **`saveCrawled()` chokepoint** service:
   - Input: source, adapter result (stories + chapters).
   - For each story: upsert by (sourceId, externalId) → Story row.
   - For each chapter: apply license policy → compute contentHash if content present → upsert if not dedupe'd → set publishStatus=PENDING_REVIEW.
   - Returns counts: itemsFound, itemsNew.
5. **Dedupe service**: query existing (storyId, number) and (storyId, contentHash) → skip duplicates.
6. **Crawl job handler**:
   - Read source by sourceId.
   - Create CrawlJob row status=RUNNING.
   - Lookup adapter from registry.
   - Run adapter.discoverStories() → for each → fetchChapters() → if FULL: fetchChapterContent().
   - Pass to saveCrawled().
   - Update CrawlJob status=SUCCESS/FAILED + counts + errorMessage.
7. **Mock-fixture adapter**: read `fixtures/mock-stories.json`, produce 5 stories + 3 chapters each with placeholder content.
8. **Gutenberg-vi adapter**: HTTP fetch (axios + cheerio) public domain Vietnamese works (example: `https://vi.wikisource.org/...`). Rate limit 1s/request. Document the source legality in adapter file header.
9. **Metadata-only-demo adapter**: HTTP fetch a demo source, return stubs với sourceUrl, NO `fetchChapterContent` method.
10. **Admin Sources UI**: list + create + edit + delete + "Run now" button → POST `/admin/sources/[id]/run` enqueues.
11. **Test license enforcement**: unit test `saveCrawled()` với licenseMode=METADATA_ONLY → assert content=null in DB.
12. Test idempotency: chạy crawl 2 lần → itemsNew lần 2 = 0.

## Todo List
- [ ] CrawlerAdapter interface + types
- [ ] Adapter registry
- [ ] License guard (`applyLicensePolicy`)
- [ ] `saveCrawled()` chokepoint service
- [ ] Dedupe service (storyId+number, storyId+contentHash)
- [ ] crawl-job worker handler + CrawlJob status updates
- [ ] BullMQ crawl queue init (worker + web enqueue)
- [ ] Mock-fixture adapter + fixtures/mock-stories.json
- [ ] Gutenberg-vi adapter (HTTP + cheerio + rate limit)
- [ ] Metadata-only-demo adapter
- [ ] Admin Sources CRUD UI
- [ ] "Run now" trigger endpoint
- [ ] Unit test license enforcement (3 modes)
- [ ] Unit test dedupe idempotency

## Success Criteria
- Trigger `mock-fixture` từ CMS → CrawlJob row + 5 stories + 15 chapters PENDING_REVIEW.
- Re-trigger → itemsNew=0, status=SUCCESS.
- Trigger `metadata-only-demo` → chapters có `content=null`, `licenseStatus=METADATA_ONLY`.
- Trigger `gutenberg-vi` → 1+ public domain story với content.
- Adapter ghi đè licenseStatus=OWNED bị ép về METADATA_ONLY nếu source.licenseMode khác FULL.
- CrawlJob status FAILED khi adapter throw, errorMessage lưu stack tóm tắt.

## Risk Assessment
- **Risk:** Adapter import Prisma trực tiếp → enforce qua ESLint rule `no-restricted-imports` cho `crawlers/*`.
- **Risk:** Gutenberg HTML structure đổi → wrap fetch in try/catch, fail gracefully + log.
- **Risk:** Rate limit nhẹ vẫn bị block IP → thêm User-Agent rõ ràng "TramTuyenBot/0.1 (+contact)".
- **Risk:** BullMQ Redis connection drift giữa web (enqueue) và worker → share config từ env.

## Security Considerations
- Validate sourceUrl scheme (http/https only).
- Limit fetch size (max 5MB per chapter) tránh OOM.
- Strip `<script>` từ HTML khi extract content.
- KHÔNG expose admin "Run now" endpoint công khai — middleware check role ADMIN.
- Log không chứa cookies/auth headers nếu adapter dùng.

## Next Steps
→ Phase 06 (Review + Schedule + Publisher).
