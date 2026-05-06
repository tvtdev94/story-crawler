---
type: brainstorm
date: 2026-05-06
slug: two-phase-discover-fetch
status: approved
extends: brainstorm-260505-2111-tram-tuyen-mvp
---

# Brainstorm — Two-phase Crawl: Discover → Approve → Fetch

## 1. Problem Statement

MVP hiện cào nguồn 1 pass: discover + fetch content + save → tất cả vào `PENDING_REVIEW`.
Editor không có cơ hội xem trước list bài. Crawl rộng = phí băng thông + DB phình + có thể lấy bài không muốn.

Yêu cầu mới:
1. Nhập nguồn → cào **chỉ title + link** (discovery).
2. Editor xem inbox → **chọn từng chương** để approve.
3. Worker cào nội dung **chỉ những chương đã approve**.
4. Có **refresh** (manual + optional auto) để sync chương mới.
5. Chương đã fetched → **không bao giờ re-fetch**.
6. Skip được + **un-skip** được.

## 2. Constraints (kế thừa MVP)

- License chokepoint vẫn áp dụng — METADATA_ONLY source vẫn `content=null`.
- BullMQ + Redis 7 + Prisma + Postgres 16.
- Adapter interface đã có 3 method tách biệt (`discoverStories`, `fetchChapters`, `fetchChapterContent?`). Không phải đổi adapter.
- Backward-compat: data cũ (Chapter PENDING_REVIEW từ MVP flow) giữ nguyên.

## 3. Decisions Locked (qua brainstorm Q&A)

| Decision | Chọn | Lý do |
|---|---|---|
| Storage | **Bảng `DiscoveredItem` riêng** | Tách inbox vs Chapter; không lẫn semantic với METADATA_ONLY (cũng `content=null`); query/filter dễ |
| Granularity approve | **Per-chapter only** | Story metadata "free" → auto-save khi discover; KISS |
| Refresh | **Manual button + optional cron per source** | Linh hoạt nhất. `Source.refreshIntervalHours: Int?` null = manual |
| Skip | **Soft skip (un-skip được)** | Có tab SKIPPED trong inbox; restore về DISCOVERED |

## 4. Approaches Evaluated (đã loại)

| # | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | DiscoveredItem table | clean, dedupe rõ, tab UI tự nhiên | +1 migration +1 page | **CHỌN** |
| B | Add `DISCOVERED` enum vào `Chapter.publishStatus` + content=null | đỡ migration | Lẫn với METADATA_ONLY (cùng content=null), query rối | Reject |
| C | `Chapter.contentFetchedAt` field | nhỏ nhất | "Discovered chapter" và "metadata-only chapter" cùng schema, semantic confusing | Reject |

## 5. Final Solution

### 5.1 Schema (Prisma)

```prisma
enum DiscoveredStatus {
  DISCOVERED
  QUEUED
  FETCHED
  SKIPPED
  FAILED
}

model DiscoveredItem {
  id            String           @id @default(cuid())
  sourceId      String
  storyId       String           // Story tự upsert lúc discover
  externalId    String           // chapter externalId từ adapter
  number        Int
  title         String
  sourceUrl     String?
  status        DiscoveredStatus @default(DISCOVERED)
  errorMessage  String?
  attempts      Int              @default(0)
  discoveredAt  DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  fetchedAt     DateTime?
  chapterId     String?          // sau khi fetch thành công
  source        Source           @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  story         Story            @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([sourceId, externalId])
  @@index([status, discoveredAt])
  @@index([sourceId, status])
  @@index([storyId])
}

// Source mở rộng:
model Source {
  // ... existing fields
  refreshIntervalHours Int?       // null = manual only
}
```

### 5.2 State Machine

```
                          ┌──── (skip) ────▶ SKIPPED ──(un-skip)──▶ DISCOVERED
                          │
DISCOVERED ──(approve)──▶ QUEUED ──(fetch ok)──▶ FETCHED  → Chapter PENDING_REVIEW
                          │
                          └──(fetch fail × 3)──▶ FAILED ──(retry)──▶ QUEUED
```

Sau khi `FETCHED`, chương đi qua flow MVP cũ: PENDING_REVIEW → DRAFT → SCHEDULED → PUBLISHED.

### 5.3 Queue Design

| Queue | Job name | Concurrency | Trigger |
|---|---|---|---|
| `crawl-discover` | `discover` | 1 | Manual button + optional repeatable per source |
| `crawl-fetch` | `fetch-item` | 2 | Editor approve (1 job/item, hoặc batch) |

**Discovery worker** (`apps/worker/src/jobs/discover-job.ts`):
1. Load Source + adapter.
2. Adapter.discoverStories() → upsert Story (metadata only, no chapters published).
3. Cho mỗi story → adapter.fetchChapters(externalId).
4. Bulk INSERT DiscoveredItem with `skipDuplicates: true` qua `(sourceId, externalId)` UNIQUE.
5. Update Source.lastRunAt.

**Fetch worker** (`apps/worker/src/jobs/fetch-job.ts`):
1. Load DiscoveredItem + Source + adapter.
2. status=QUEUED → status=FETCHING (inline guard).
3. Nếu source.licenseMode === METADATA_ONLY → content=null.
4. Else → `adapter.fetchChapterContent(externalId)`.
5. `applyLicensePolicy(licenseMode, { content, sourceUrl })` ← chokepoint giữ nguyên.
6. Dedupe `(storyId, contentHash)` → nếu trùng, mark FETCHED + log.
7. INSERT Chapter publishStatus=PENDING_REVIEW.
8. UPDATE DiscoveredItem status=FETCHED, chapterId=…, fetchedAt=now().
9. On error: increment attempts, status=QUEUED nếu <3 với backoff, FAILED nếu ≥3.

### 5.4 Refresh Strategy

- **Manual:** nút "Refresh nguồn" trên `/admin/sources` → enqueue discover.
- **Auto:** nếu `Source.refreshIntervalHours` set, worker boot tự register repeatable job (jobId = `discover:${sourceId}`) — restart-safe.
- Idempotent vì discovery dùng `INSERT skipDuplicates` qua `(sourceId, externalId)`. SKIPPED rows KHÔNG bị touch.
- Story metadata được upsert mỗi refresh → tiêu đề/cover mới sẽ cập nhật, nhưng Chapter rows không đổi.

### 5.5 Admin UI

**`/admin/discovered`** (inbox mới)
- Tabs: `[Đã phát hiện] [Đang fetch] [Đã fetch] [Bỏ qua] [Lỗi]`
- Filter: source dropdown.
- Mỗi row: checkbox + story title + chapter number + chapter title + sourceUrl + discoveredAt.
- Bulk action: `[Fetch nội dung]` `[Bỏ qua]` `[Khôi phục]` (tab SKIPPED).
- Click row → chi tiết errorMessage (cho FAILED).

**`/admin/sources`** (mở rộng)
- Cột mới: Discovered/Fetched/Skipped count per source.
- Nút `Refresh ngay` → enqueue discover.
- Form edit thêm field `refreshIntervalHours` (null/3/6/12/24).

**`/admin/review`** giữ nguyên — vẫn hiện Chapter `PENDING_REVIEW` (nay chỉ là chương đã fetched).

### 5.6 Sidebar Update

Admin nav thêm mục `Inbox` → `/admin/discovered`. Badge số DISCOVERED chưa xử lý.

## 6. Migration Path

1. Thêm migration: tạo `DiscoveredItem` + thêm cột `refreshIntervalHours` vào `Source`.
2. Cũ flow `runSource()` (one-pass crawl) → đổi tên thành `runDiscover()`. UI nút Run trên Sources page giờ kích hoạt discover only.
3. Data cũ (Chapter PENDING_REVIEW từ MVP run) giữ nguyên — vẫn xử lý bình thường ở `/admin/review`.
4. Adapter interface không đổi.

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Adapter `fetchChapters()` đắt khi list dài → mỗi refresh re-list cả nguồn | MVP chấp nhận; phase 2 thêm `If-Modified-Since` / pagination cursor |
| Race: refresh đang chạy + editor approve cùng item | Discovery dùng `INSERT skipDuplicates` → không update existing → không đè status |
| SKIPPED row bị refresh tạo lại | Không xảy ra vì `(sourceId, externalId)` UNIQUE + skipDuplicates |
| Cron sau worker restart bị duplicate | `jobId = discover:${sourceId}` stable; khi boot xoá repeatable cũ rồi đăng ký lại (như publish-tick) |
| Adapter throw giữa chừng discover → state inconsistent | Wrap try/catch ngoài cùng, mark CrawlJob FAILED, errorMessage; partial inserts vẫn safe vì idempotent |
| User pick 100 chương → fetch worker quá tải | Concurrency=2 + rate-limit per-adapter qua `Source.rateLimitMs` đã có |
| FAILED items chiếm chỗ inbox | Tab riêng + cho retry button |

## 8. Security Considerations

- License chokepoint **không đổi** — METADATA_ONLY vẫn không lưu content kể cả khi adapter trả.
- Approve action: server check `requireRole("ADMIN" | "EDITOR")`.
- Refresh action: chỉ ADMIN.
- Validate Source.refreshIntervalHours ≥ 1 ≤ 720 (30 ngày).

## 9. Implementation Phases (đề xuất)

| # | Phase | Effort | Deliverable |
|---|---|---|---|
| P1 | Schema migration + types | S | `DiscoveredItem` + `refreshIntervalHours` + Prisma client gen |
| P2 | Worker split: discover-job + fetch-job | M | 2 queue + 2 worker; refactor `save-crawled.ts` → `save-discovered.ts` (story+stubs) + `fetch-item.ts` (content) |
| P3 | Admin Inbox UI + Source refresh button | M | `/admin/discovered` page + 5 tabs + bulk actions; Source page mở rộng |
| P4 | Per-source cron + tests + docs | S | Repeatable job per Source.refreshIntervalHours; vitest test idempotency; cập nhật `docs/crawler-demo.md` |

Tổng: **~M-L** (1-2 ngày dev nếu liên tục).

## 10. Success Metrics

- Trigger discover `mock-fixture` → 5 stories upsert + 15 DiscoveredItem rows DISCOVERED, 0 chapter mới trong DB.
- Approve 3 chương → 3 fetch jobs → 3 Chapter rows PENDING_REVIEW + 3 DiscoveredItem FETCHED.
- Re-trigger discover → DiscoveredItem count không đổi (idempotent).
- Skip 2 chương → tab SKIPPED có 2 rows, refresh không đụng.
- Un-skip 1 chương → quay về tab DISCOVERED.
- Set Source.refreshIntervalHours=1 → sau 60 phút auto-discover (verify CrawlJob row).
- METADATA_ONLY source: approve fetch → Chapter content=null vẫn enforce (test).

## 11. Out of Scope (cho phase này)

- Bulk-fetch ALL của một source (`autoFetchAll`).
- Hierarchical approve (story-level → chapter-level).
- RSS / sitemap-based discovery.
- Conditional GET với `If-Modified-Since` headers.
- Archive cleanup (xoá SKIPPED/FETCHED >90 ngày).
- Analytics: discovery success rate per source.

## 12. Unresolved Questions

1. **Story metadata refresh policy:** khi adapter trả title/description khác → có overwrite Story rows hiện tại không, hay chỉ update khi field DB đang null? (Đề xuất: chỉ update khi null để không đè edit thủ công của editor.)
2. **DiscoveredItem cleanup:** tab FETCHED chứa rows đã chuyển thành Chapter — có nên auto-archive sau 30 ngày để inbox sạch? (Đề xuất: phase 2.)
3. **Failed permanently:** items FAILED nhiều lần — có cho editor "đánh dấu bỏ qua vĩnh viễn" để khỏi retry? (Đề xuất: dùng status=SKIPPED với errorMessage giữ.)
4. **Notification:** sau auto-refresh có discover được items mới — có cần badge count trong sidebar admin? (Đề xuất: có, đơn giản — query count DISCOVERED.)
5. **Per-source rate limit khi fetch hàng loạt:** hiện `Source.rateLimitMs` chỉ delay giữa requests trong 1 job. Khi user approve 50 chương → 50 fetch jobs concurrency=2 — vẫn có thể nhanh hơn rate limit. Có cần queue-level rate limiter (BullMQ `limiter`)? (Đề xuất: thêm `Queue({ limiter: { max: 1, duration: source.rateLimitMs }})` per-adapter trong phase tới.)
