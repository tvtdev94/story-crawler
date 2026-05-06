---
phase: 03
title: Admin Inbox UI + Source refresh
status: completed
priority: P0
effort: M
depends: [02]
---

# Phase 03 — Admin Inbox UI + Source refresh

## Context Links

- [plan.md](plan.md)
- [Phase 02](phase-02-worker-split.md)
- [Brainstorm §5.5 Admin UI](../reports/brainstorm-260506-0604-two-phase-discover-fetch.md)

## Overview

Tạo trang `/admin/discovered` (inbox 5 tabs), bulk actions Fetch/Skip/Restore. Mở rộng `/admin/sources`: nút Refresh + field `refreshIntervalHours` + counts. Update sidebar nav.

## Key Insights

- Reuse component admin có sẵn: `DataTable`, `Pagination`, `PageHeader`, `BulkApproveForm` (clone thành `BulkActionForm` generic hơn).
- Tabs = query param `?status=DISCOVERED|QUEUED|FETCHED|SKIPPED|FAILED`. Default DISCOVERED.
- Bulk select pattern giống `/admin/review` đã có.
- Sidebar: thêm `Inbox` link với badge count (DISCOVERED).

## Requirements

**Functional:**
- List DiscoveredItem theo tab + filter source.
- Bulk Fetch → enqueue jobs.
- Bulk Skip → status=SKIPPED.
- Tab SKIPPED có nút "Khôi phục" (un-skip → DISCOVERED).
- Tab FAILED có nút "Retry" (status=DISCOVERED, attempts=0).
- Source list: cột Inbox count (D/F/S), nút "Refresh ngay", form edit `refreshIntervalHours`.

**Non-functional:** mobile-friendly bảng (overflow-x), loading.tsx skeleton, empty state thân thiện.

## Architecture

```
apps/web/app/admin/
├── discovered/
│   ├── page.tsx                          # inbox với tabs
│   └── _actions.ts                       # bulkFetch/bulkSkip/restore/retry
├── sources/
│   ├── page.tsx                          # mở rộng cột counts + nút Refresh
│   ├── new/page.tsx                      # form thêm refreshIntervalHours
│   └── [id]/edit/page.tsx                # form thêm refreshIntervalHours
└── _queries/
    └── discovered.ts                     # list query có filter+pagination

apps/web/components/admin/
├── inbox-tabs.tsx                        # 5 tabs link-based
├── bulk-action-form.tsx                  # generic bulk select + 1-3 actions
└── forms/source-form.tsx                 # mở rộng field interval
```

Sidebar `app/admin/layout.tsx` nav array: insert `{ href: "/admin/discovered", label: "Inbox" }` ngay sau "Chờ duyệt".

## Related Code Files

**Create:**
- `apps/web/app/admin/discovered/page.tsx`
- `apps/web/app/admin/discovered/_actions.ts`
- `apps/web/app/admin/_queries/discovered.ts`
- `apps/web/components/admin/inbox-tabs.tsx`
- `apps/web/components/admin/bulk-action-form.tsx`

**Modify:**
- `apps/web/components/admin/forms/source-form.tsx` (thêm field `refreshIntervalHours`)
- `apps/web/app/admin/sources/page.tsx` (cột counts + Refresh nút đã có, đổi action thành discover)
- `apps/web/app/admin/_actions/source.ts` (validate refreshIntervalHours 1..720)
- `apps/web/app/admin/layout.tsx` (sidebar: thêm Inbox)
- `packages/core/src/schemas/source.ts` (Zod thêm `refreshIntervalHours: z.coerce.number().int().min(1).max(720).nullable().optional()`)

## Implementation Steps

1. **Schema update Zod:** SourceInput thêm `refreshIntervalHours` nullable optional.
2. **Source form UI:** select "Tự động làm mới" với options [Tắt, 1h, 3h, 6h, 12h, 24h, 168h] mapping null/1/3/6/12/24/168.
3. **Source list:** thêm cột "Inbox" hiển thị `discovered/fetched/skipped`. Nút "Refresh" giữ nguyên (action `runSource` từ Phase 02 đã trả về enqueue discover).
4. **InboxTabs component:** 5 link-based tabs giữ filter source qua querystring.
5. **`/admin/discovered/page.tsx`:**
   - Parse `?status=…&sourceId=…&page=…`.
   - Query DiscoveredItem với JOIN story.title + source.name.
   - Render: PageHeader "Inbox" + InboxTabs + filter source select + DataTable với checkbox column.
   - Bulk action bar phía dưới: tuỳ tab hiện 1 trong 3 nút:
     - DISCOVERED → [Fetch nội dung] [Bỏ qua]
     - QUEUED → [Huỷ → Discover lại] (optional, KISS skip nếu phức tạp)
     - FETCHED → readonly, link tới Chapter
     - SKIPPED → [Khôi phục]
     - FAILED → [Retry]
6. **Server actions trong `_actions.ts`:**
   - `bulkFetch(ids)`: updateMany DISCOVERED→QUEUED + enqueueFetch(ids).
   - `bulkSkip(ids)`: updateMany → SKIPPED.
   - `restoreItems(ids)`: updateMany SKIPPED→DISCOVERED.
   - `retryFailed(ids)`: updateMany FAILED→DISCOVERED, attempts=0, errorMessage=null.
   - Tất cả `revalidatePath("/admin/discovered")`.
7. **Sidebar update:** thêm `{ href: "/admin/discovered", label: "Inbox" }`.

## Todo List

- [ ] Zod schema source thêm refreshIntervalHours
- [ ] SourceForm field interval select
- [ ] Source list cột counts (subquery hoặc include _count)
- [ ] InboxTabs component
- [ ] BulkActionForm generic
- [ ] /admin/discovered page (5 tabs render)
- [ ] _actions.ts (bulkFetch/Skip/Restore/Retry)
- [ ] Sidebar nav thêm Inbox
- [ ] Smoke test: discover → DISCOVERED → bulk Fetch → FETCHED + Chapter PENDING_REVIEW
- [ ] Smoke test: Skip → tab SKIPPED → Restore
- [ ] Build pass

## Success Criteria

- `/admin/discovered?status=DISCOVERED` show 15 rows sau khi mock-fixture discover.
- Bulk select 3 → "Fetch nội dung" → 3 rows chuyển QUEUED → sau worker xong → FETCHED.
- `/admin/review` show 3 Chapter PENDING_REVIEW (flow cũ).
- Skip 2 → tab SKIPPED có 2 → Restore → DISCOVERED tab có lại.
- Source form set "6h" → Source.refreshIntervalHours=6 trong DB (cron sẽ active sau Phase 04).

## Risk Assessment

- **Risk:** Counts query đắt khi nhiều DiscoveredItem → dùng `_count` của Prisma + index `(sourceId, status)`.
- **Risk:** Bulk select state phức tạp client-side → reuse pattern `BulkApproveForm` từ Phase 06 MVP, đã verified.
- **Risk:** Actions race nếu user double-click → server action có updateMany với `where` guard status hiện tại.

## Security Considerations

- Cả 4 action: `requireSession()` (EDITOR đủ). Riêng `enqueueDiscover` (Refresh button) `requireRole("ADMIN")`.
- Validate ids array length ≤ 200 mỗi lần để chống DoS.

## Next Steps

→ Phase 04 (Cron + tests + docs).
