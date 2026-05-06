---
phase: 02
title: Worker split — discover-job + fetch-job
status: completed
priority: P0
effort: M
depends: [01]
---

# Phase 02 — Worker split

## Context Links

- [plan.md](plan.md)
- [Phase 01](phase-01-schema.md)
- [Brainstorm §5.3 Queue Design](../reports/brainstorm-260506-0604-two-phase-discover-fetch.md)

## Overview

Tách worker hiện tại (`crawl-job` chạy 1-pass) thành 2 job:
1. **discover-job** (queue `crawl-discover`): adapter.discoverStories + fetchChapters → upsert Story + bulk-insert DiscoveredItem stubs.
2. **fetch-job** (queue `crawl-fetch`): nhận `{ discoveredItemId }` → adapter.fetchChapterContent (hoặc skip nếu METADATA_ONLY) → applyLicensePolicy → INSERT Chapter PENDING_REVIEW + UPDATE DiscoveredItem FETCHED.

License chokepoint vẫn nằm chỉ trong fetch-job. Discovery KHÔNG chạm content.

## Key Insights

- Adapter interface KHÔNG đổi — đã có sẵn 3 method cần thiết.
- Refactor `apps/worker/src/services/save-crawled.ts` → tách 2 service:
  - `save-discovered.ts` — Story upsert + DiscoveredItem bulk insert (skipDuplicates).
  - `fetch-item.ts` — single-item fetch + license enforce + Chapter create + DiscoveredItem state transition.
- Concurrency: discover=1 (như cũ), fetch=2 (cho phép song song nhẹ; rate-limit qua `Source.rateLimitMs` đã có).
- State guard idempotent: fetch-job kiểm `status=QUEUED` trước khi fetch để tránh double-process.

## Requirements

**Functional:**
- Trigger discover từ admin → DiscoveredItem rows DISCOVERED, không có Chapter mới.
- Trigger fetch theo discoveredItemId → Chapter row PENDING_REVIEW + DiscoveredItem FETCHED.
- METADATA_ONLY source: fetch không gọi adapter.fetchChapterContent, content=null vẫn enforce.
- Re-run discover: itemsNew=0.

**Non-functional:** Worker boot khởi cả 2 worker, graceful shutdown đóng cả 2.

## Architecture

```
apps/worker/src/
├── index.ts                                  # boot 2 workers
├── queues/
│   ├── crawl-queue.ts        ── ⟳ rename to crawl-discover-queue
│   └── crawl-fetch-queue.ts  ── ⊕ NEW
├── jobs/
│   ├── crawl-job.ts          ── ⟳ rename → discover-job.ts
│   └── fetch-job.ts          ── ⊕ NEW
└── services/
    ├── save-crawled.ts       ── ⟳ rename → save-discovered.ts (no content)
    └── fetch-item.ts         ── ⊕ NEW (single-item fetch + license + Chapter)
```

```
apps/web/lib/queues/
├── crawl-enqueue.ts          ── ⟳ rename → discover-enqueue.ts
└── fetch-enqueue.ts          ── ⊕ NEW
```

## Related Code Files

**Create:**
- `apps/worker/src/queues/crawl-fetch-queue.ts`
- `apps/worker/src/jobs/fetch-job.ts`
- `apps/worker/src/services/fetch-item.ts`
- `apps/web/lib/queues/fetch-enqueue.ts`

**Rename + Modify:**
- `apps/worker/src/queues/crawl-queue.ts` → `crawl-discover-queue.ts` (export `CRAWL_DISCOVER_QUEUE_NAME`)
- `apps/worker/src/jobs/crawl-job.ts` → `discover-job.ts`
- `apps/worker/src/services/save-crawled.ts` → `save-discovered.ts` (drop content fetch loop, output `{storiesNew, chaptersFound, chaptersNew}` based on DiscoveredItem inserts)
- `apps/web/lib/queues/crawl-enqueue.ts` → `discover-enqueue.ts`
- `apps/worker/src/index.ts` (boot cả 2 worker)
- `apps/web/app/admin/_actions/source.ts` — `runSource()` đổi thành `enqueueDiscover()`, giữ tên action `runSource` cho UI compat.

## Implementation Steps

1. **Rename phase:** đổi tên file/symbol như liệt kê. Giữ behavior cũ tạm.
2. **Refactor `save-discovered.ts`:**
   - Bỏ block `fetchChapterContent` + `applyLicensePolicy` + Chapter INSERT.
   - Thay bằng: bulk INSERT `DiscoveredItem` với `skipDuplicates: true` qua `(sourceId, externalId)`.
   - Story upsert giữ nguyên (metadata only).
   - Return `{ storiesFound, storiesNew, itemsFound, itemsNew }`. Map sang `CrawlJob.itemsFound/itemsNew`.
3. **Tạo `crawl-fetch-queue.ts`:**
   - `CRAWL_FETCH_QUEUE_NAME = "crawl-fetch"`.
   - `Queue<{ discoveredItemId: string }>` với `attempts: 3`, `backoff: { type: 'exponential', delay: 5000 }`.
4. **Tạo `fetch-job.ts`:**
   - Worker concurrency=2.
   - Handler: load DiscoveredItem + Source + Story.
   - State guard: nếu status≠`QUEUED` → return early (idempotent).
   - Lookup adapter via `getAdapter(source.adapterKey)`.
   - Build `FetchInput`: nếu `source.licenseMode === METADATA_ONLY` → content=null (KHÔNG gọi adapter). Else → `adapter.fetchChapterContent(item.externalId)`.
   - Gọi `applyLicensePolicy(licenseMode, { content, sourceUrl })`.
   - Compute `contentHash` nếu policed.content !== null.
   - Dedupe: nếu `(storyId, contentHash)` trùng → mark DiscoveredItem FETCHED + log SKIPPED-DUP, KHÔNG INSERT Chapter.
   - INSERT Chapter (publishStatus=PENDING_REVIEW, slug=chapterSlug(title, number)).
   - UPDATE DiscoveredItem `status=FETCHED, chapterId=…, fetchedAt=now()`.
   - On error: `attempts++`, BullMQ retry tự động (≤3 attempts với exponential). Sau cùng FAILED → set DiscoveredItem `status=FAILED, errorMessage=…`.
5. **Tạo `fetch-enqueue.ts`** trong web:
   - `enqueueFetch(itemIds: string[])` → bulk add jobs.
   - Trước khi enqueue: `prisma.discoveredItem.updateMany({ where:{ id: in itemIds, status: 'DISCOVERED' }, data:{ status: 'QUEUED' }})` để guard.
6. **Update `apps/worker/src/index.ts`:** boot cả `startDiscoverWorker()` + `startFetchWorker()`. Graceful shutdown đóng cả 2.
7. **Update `apps/web/app/admin/_actions/source.ts`:** `runSource()` giờ chỉ enqueue discover (không đổi gì cho UI hiện tại).

## Todo List

- [ ] Rename queue/job/service files + update imports
- [ ] Refactor `save-discovered.ts` (bỏ content fetch)
- [ ] Tạo `crawl-fetch-queue.ts`
- [ ] Tạo `fetch-job.ts` (license chokepoint preserved)
- [ ] Tạo `fetch-item.ts` service
- [ ] Tạo `fetch-enqueue.ts` (web side)
- [ ] Update worker index.ts boot 2 worker
- [ ] Update source action `runSource` → enqueueDiscover
- [ ] Smoke test mock-fixture: discover only → 0 Chapter mới
- [ ] Smoke test approve 3 chương → 3 Chapter PENDING_REVIEW
- [ ] Smoke test METADATA_ONLY source: Chapter content=null

## Success Criteria

- `pnpm typecheck` pass.
- `scripts/enqueue-test-crawl.ts` (đổi tên thành `enqueue-discover.ts`) → DiscoveredItem 15 rows, Chapter 0 rows mới.
- Manual fetch via prisma update QUEUED + enqueue → Chapter PENDING_REVIEW xuất hiện.
- METADATA_ONLY: `SELECT content FROM "Chapter" WHERE …` → null.
- Re-discover → DiscoveredItem count không đổi.

## Risk Assessment

- **Risk:** Race khi 2 fetch-job concurrent đụng cùng discoveredItem → state guard `status=QUEUED` + DB-level UPDATE WHERE status=QUEUED RETURNING.
- **Risk:** Adapter fail giữa story → wrap try/catch per-story trong save-discovered, log và tiếp tục.
- **Risk:** BullMQ retry quá mạnh dội nguồn → `Source.rateLimitMs` áp dụng inline trong fetch-item.

## Security Considerations

- License chokepoint: `applyLicensePolicy()` BẮT BUỘC chạy trong fetch-item, không bypass. Test riêng (Phase 04).
- Validate sourceUrl scheme http/https only trước khi gọi adapter.
- Không log full content/cookies khi fail.

## Next Steps

→ Phase 03 (Admin Inbox UI).
