---
slug: two-phase-discover-fetch
date: 2026-05-06
status: completed
mode: fast
brainstorm: ../reports/brainstorm-260506-0604-two-phase-discover-fetch.md
extends: ../260505-2111-tram-tuyen-mvp/plan.md
blockedBy: []
blocks: []
---

# Plan — Two-phase Crawl (Discover → Approve → Fetch)

> Tách crawl 1-pass thành: (1) discover title+link, (2) editor approve per-chapter, (3) fetch nội dung theo lựa chọn. Refresh idempotent. Skip có un-skip.

## Brainstorm Context

- [Brainstorm Report](../reports/brainstorm-260506-0604-two-phase-discover-fetch.md) — design approved 2026-05-06.
- Decisions locked: `DiscoveredItem` table · per-chapter approve · manual+optional cron · soft skip.

## Stack (đã có)

Next.js 15 · Prisma 6 · Postgres 16 · BullMQ 5 · Redis 7 · TypeScript strict · pnpm workspaces.

## Phases

| # | Phase | File | Status | Effort | Depends |
|---|-------|------|--------|--------|---------|
| 01 | Schema migration + types | [phase-01](phase-01-schema.md) | completed | S | — |
| 02 | Worker split: discover-job + fetch-job | [phase-02](phase-02-worker-split.md) | completed | M | 01 |
| 03 | Admin Inbox UI + Source refresh | [phase-03](phase-03-admin-inbox-ui.md) | completed | M | 02 |
| 04 | Per-source cron + tests + docs | [phase-04](phase-04-cron-tests-docs.md) | completed | S | 03 |

## Success Criteria (Definition of Done)

- Run "Refresh nguồn" mock-fixture từ `/admin/sources` → 5 stories upsert + 15 `DiscoveredItem` rows status=DISCOVERED. **Không có Chapter mới**.
- Re-run "Refresh nguồn" → DiscoveredItem count không đổi (idempotent).
- `/admin/discovered`: select 3 chương → "Fetch nội dung" → 3 fetch jobs → 3 Chapter rows PENDING_REVIEW + 3 DiscoveredItem FETCHED.
- Skip 2 chương → tab SKIPPED có 2 rows; refresh không đụng SKIPPED.
- Un-skip 1 chương → quay về tab DISCOVERED.
- Set Source.refreshIntervalHours=1 → BullMQ repeatable đăng ký jobId=`discover:{sourceId}`; sau interval auto-discover.
- METADATA_ONLY source: approve fetch → Chapter `content=null` (verify SQL).
- `pnpm typecheck && pnpm test && pnpm --filter @story-crawler/web build` pass.
- Backward-compat: Chapter PENDING_REVIEW từ MVP flow vẫn render đúng `/admin/review`.

## Out of Scope (giữ trong brainstorm phase 12)

Bulk-fetch all source · hierarchical approve story-level · RSS/sitemap discovery · `If-Modified-Since` · auto archive >90d · analytics dashboard.

## Unresolved Questions (deferred)

Xem brainstorm §12. Quyết định sau khi P3 xong:
1. Story metadata refresh policy (overwrite vs only-if-null).
2. Auto archive FETCHED rows >30d.
3. Sidebar badge count cho DISCOVERED.
4. Permanent-skip vs reuse SKIPPED.
5. Queue-level rate limiter per-adapter.
