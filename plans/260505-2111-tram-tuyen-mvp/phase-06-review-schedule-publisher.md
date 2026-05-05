---
phase: 06
title: Review + Schedule + Publisher worker
status: pending
priority: P0
effort: M
depends: [05]
---

# Phase 06 — Review + Schedule + Publisher

## Context Links
- [plan.md](plan.md)
- [Phase 05](phase-05-crawler-adapters.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Workflow duyệt nội dung và đăng tải: editor approve, schedule chapter, publisher worker tự flip SCHEDULED→PUBLISHED, ghi PublishLog. Đóng vòng lặp crawl→review→publish.

## Key Insights
- BullMQ repeatable job mỗi 60s quét chapters đến hạn — đơn giản, deterministic, không cần delayed jobs riêng cho mỗi chapter.
- Concurrency=1 cho publish queue tránh race condition.
- Idempotent: re-check `publishStatus=SCHEDULED` trong handler trước khi flip.
- Bulk approve để efficiency khi crawl xong nhiều chapter.

## Requirements
**Functional:** approve chapter (PENDING_REVIEW→DRAFT), schedule chapter (set scheduledAt + status=SCHEDULED), bulk approve, view scheduled queue, publisher auto-flip, retry on failure (max 3 exp backoff), PublishLog entries.
**Non-functional:** không double-publish, log đầy đủ kết quả, dễ debug khi fail.

## Architecture
```
apps/worker/src/
├── jobs/
│   └── publish-job.ts                  # repeatable handler
├── queues/
│   └── publish-queue.ts                # BullMQ + repeatable scheduling
└── services/
    └── publish-service.ts              # flip + log + revalidate hook

apps/web/app/admin/
├── review/
│   ├── page.tsx                        # PENDING_REVIEW queue
│   └── _actions/{approve,reject,bulk-approve}.ts
├── chapters/[id]/schedule/page.tsx     # date-time picker
└── _actions/schedule.ts

apps/web/lib/queues/publish-events.ts   # web ←→ worker via Redis pub/sub for revalidate
```

## Related Code Files
**Create:**
- `apps/worker/src/queues/publish-queue.ts`
- `apps/worker/src/jobs/publish-job.ts`
- `apps/worker/src/services/publish-service.ts`
- `apps/web/app/admin/review/page.tsx`
- `apps/web/app/admin/review/_actions/{approve,reject,bulk-approve}.ts`
- `apps/web/app/admin/chapters/[id]/schedule/page.tsx`
- `apps/web/app/admin/_actions/schedule.ts`
- `apps/web/components/admin/{schedule-picker,bulk-action-bar}.tsx`
- `apps/web/app/api/internal/revalidate/route.ts` (worker → web webhook)

## Implementation Steps
1. **Review queue UI** `/admin/review`: list chapters `publishStatus=PENDING_REVIEW`, columns [story, number, title, source, license], bulk select + bulk approve action.
2. **Approve action**: PENDING_REVIEW → DRAFT (chưa publish).
3. **Reject action**: PENDING_REVIEW → DRAFT + remove? — MVP: chỉ flip về DRAFT, edit/delete sau.
4. **Schedule UI** `/admin/chapters/[id]/schedule`: date-time picker (timezone Asia/Bangkok), validate scheduledAt > now+1min, action sets `publishStatus=SCHEDULED, scheduledAt=...`.
5. **Publisher worker**:
   - On boot: register repeatable job `publish-tick` every 60s.
   - Handler: query `Chapter` where `publishStatus=SCHEDULED && scheduledAt <= NOW()` limit 100.
   - For each: transactionally flip → PUBLISHED + set publishedAt=NOW() + write PublishLog SUCCESS.
   - On error: increment attempt counter (in-memory map keyed by chapterId), if <3 → reschedule with backoff via delayed BullMQ job; if ≥3 → flip FAILED + PublishLog FAILED.
6. **Idempotency**: SELECT FOR UPDATE row hoặc check publishStatus=SCHEDULED ngay trước UPDATE — Prisma transaction.
7. **Revalidate hook**: sau khi publish thành công, call internal API `/api/internal/revalidate` (signed token from worker) → `revalidateTag('story:'+storySlug)`.
8. **Admin scheduled queue UI** `/admin/chapters?status=SCHEDULED` — phase 03 đã có filter, chỉ verify.
9. **Test thủ công**:
   - Approve chapter → set scheduledAt = now+90s → wait → verify PUBLISHED + log SUCCESS + public site hiện chapter.
   - Force scheduledAt < now → next tick publish ngay.
   - Simulate failure (vd disconnect DB tạm) → assert retry → eventually FAILED.

## Todo List
- [ ] Publish queue + repeatable 60s
- [ ] publish-job handler + idempotent flip
- [ ] PublishLog write SUCCESS/FAILED
- [ ] Retry logic max 3 exp backoff
- [ ] Review queue UI + bulk approve
- [ ] Schedule picker UI + action
- [ ] Worker → web revalidate webhook (signed token)
- [ ] Internal revalidate route
- [ ] Manual flow test (publish in 90s)
- [ ] Failure retry test

## Success Criteria
- Bulk approve 5 chapters → all DRAFT.
- Schedule chapter +90s → đến giờ flip PUBLISHED, public site cập nhật trong vòng 60s nữa (tag revalidate).
- PublishLog có 1 row SUCCESS per chapter.
- Force fail (disconnect DB) → retry, sau 3 lần → FAILED + 3 PublishLog FAILED entries.
- Re-run publisher khi không có chapter SCHEDULED → no-op, no log spam.

## Risk Assessment
- **Risk:** Double-publish khi 2 worker instance → MVP single worker, but enforce concurrency=1 + transactional check.
- **Risk:** Repeatable job duplicate sau worker restart → use stable jobId `publish-tick`.
- **Risk:** Clock skew giữa worker và DB → query với DB `NOW()` (Prisma raw) không trust local clock.
- **Risk:** Revalidate webhook fail → retry 1 lần, log warn nhưng KHÔNG fail publish (consistency eventual).

## Security Considerations
- Internal revalidate endpoint dùng shared secret `INTERNAL_REVALIDATE_TOKEN` từ env.
- Schedule action validate scheduledAt parseable + future + reasonable range (≤ 1 năm).
- KHÔNG cho EDITOR force publish backdated mà không qua approval flow.
- Audit basics: log userId vào PublishLog.message khi action manual (phase 2 full audit log).

## Next Steps
→ Phase 07 (Logs UI + Dashboard).
