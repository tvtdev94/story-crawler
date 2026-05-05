---
phase: 07
title: Logs UI + Dashboard stats
status: pending
priority: P1
effort: S
depends: [06]
---

# Phase 07 — Logs UI + Dashboard

## Context Links
- [plan.md](plan.md)
- [Phase 06](phase-06-review-schedule-publisher.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Observability cho admin: dashboard tổng quan (counts, recent activity), CrawlJob log UI (filter source/status), PublishLog UI (filter chapter/status), drill-down errorMessage.

## Key Insights
- Server-rendered tables, không cần realtime cho MVP.
- Auto-refresh 30s (router.refresh) trên dashboard và logs.
- pino structured log → có thể tail file/console khi dev; UI chỉ lấy từ DB rows (CrawlJob + PublishLog).

## Requirements
**Functional:** dashboard 4 stat cards + recent crawl jobs + recent publish logs; CrawlJob list với filter + detail modal; PublishLog list với filter + detail modal.
**Non-functional:** queries indexed, pagination, không nặng DB.

## Architecture
```
apps/web/app/admin/
├── (dashboard)/page.tsx                # rebuild dashboard with stats
├── crawl-jobs/
│   ├── page.tsx                        # list + filters
│   └── [id]/page.tsx                   # detail w/ errorMessage
├── publish-logs/
│   ├── page.tsx
│   └── [id]/page.tsx
└── _queries/
    ├── dashboard-stats.ts
    ├── crawl-jobs.ts
    └── publish-logs.ts

apps/web/components/admin/
├── stat-card.tsx
├── recent-activity-feed.tsx
└── error-detail-card.tsx
```

## Related Code Files
**Create:**
- `apps/web/app/admin/(dashboard)/page.tsx` (replace placeholder)
- `apps/web/app/admin/crawl-jobs/{page,[id]/page}.tsx`
- `apps/web/app/admin/publish-logs/{page,[id]/page}.tsx`
- `apps/web/app/admin/_queries/{dashboard-stats,crawl-jobs,publish-logs}.ts`
- `apps/web/components/admin/{stat-card,recent-activity-feed,error-detail-card}.tsx`

## Implementation Steps
1. **Dashboard stats query**:
   - Total stories, total chapters PUBLISHED, chapters PENDING_REVIEW, chapters SCHEDULED.
   - Last 24h: crawl jobs count + success rate, publish jobs count + success rate.
2. **Stat cards** shadcn Card grid 4 cols mobile→2, 4 lg.
3. **Recent activity feed**: 10 latest CrawlJob + PublishLog merged by timestamp, with badge status.
4. **CrawlJob list**:
   - Cols: source, status, startedAt, finishedAt, itemsFound, itemsNew, errorMessage (truncated).
   - Filters: sourceId, status, dateFrom/dateTo.
   - Sort startedAt DESC, pagination 25/page.
   - Click row → detail page with full errorMessage + stack.
5. **PublishLog list**:
   - Cols: chapterId (link), status, attemptedAt, message.
   - Filters: status, dateFrom/dateTo.
   - Pagination.
6. **Auto-refresh**: client component wrapper calling `router.refresh()` every 30s while tab visible.
7. **Indexes** (add migration nếu chưa có): `CrawlJob.startedAt DESC`, `PublishLog.attemptedAt DESC`, `CrawlJob.sourceId`, `PublishLog.chapterId`.

## Todo List
- [ ] Dashboard stats queries
- [ ] Stat card component + dashboard layout
- [ ] Recent activity feed
- [ ] CrawlJob list page + filters + pagination
- [ ] CrawlJob detail page
- [ ] PublishLog list page + filters
- [ ] PublishLog detail page
- [ ] Auto-refresh 30s wrapper
- [ ] Add DB indexes for log queries

## Success Criteria
- Dashboard hiển thị đúng số liệu sau khi crawl + publish vài chapter.
- Filter CrawlJob theo source + status hoạt động.
- Click vào job FAILED → thấy errorMessage + stack.
- Auto-refresh thấy job mới sau 30s không cần reload tay.
- Query <200ms với 10k rows logs (verify với seed lớn).

## Risk Assessment
- **Risk:** errorMessage chứa stack lớn ảnh hưởng performance → truncate display 500 ký tự ở list, full ở detail.
- **Risk:** Auto-refresh thrash → use `document.visibilityState`.
- **Risk:** Logs phình to → MVP không cleanup; phase 2 thêm retention 30 ngày.

## Security Considerations
- errorMessage có thể leak path/secret → sanitize trước khi lưu (strip env vars patterns).
- Logs chỉ ADMIN xem (EDITOR không thấy menu).

## Next Steps
→ Phase 08 (Seed + tests + docs) — phase cuối shippable.
