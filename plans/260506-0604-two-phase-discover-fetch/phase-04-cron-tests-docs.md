---
phase: 04
title: Per-source cron + tests + docs
status: completed
priority: P0
effort: S
depends: [03]
---

# Phase 04 — Per-source cron + tests + docs

## Context Links

- [plan.md](plan.md)
- [Phase 03](phase-03-admin-inbox-ui.md)
- [Brainstorm §5.4 Refresh Strategy + §10 Success Metrics](../reports/brainstorm-260506-0604-two-phase-discover-fetch.md)

## Overview

Đăng ký BullMQ repeatable job per source theo `refreshIntervalHours`. Worker boot scan sources, ensure repeatables (idempotent qua jobId stable). Viết test idempotency + license enforce vẫn áp dụng. Cập nhật `docs/crawler-demo.md` flow mới.

## Key Insights

- Pattern giống `publish-tick` đã có (Phase 06 MVP): khi worker boot, drain repeatables cũ + register lại, jobId stable.
- jobId per-source: `discover:${sourceId}` → restart không tạo trùng.
- Khi source.update() đổi `refreshIntervalHours` từ admin → server action sau update phải re-register hoặc remove repeatable. Đơn giản: emit Redis pub/sub event "sources-changed" → worker ack + re-sync. **MVP simpler**: worker poll Source mỗi 5 phút và sync repeatables (đủ).

## Requirements

**Functional:**
- Worker boot → scan Source enabled với `refreshIntervalHours != null` → ensure repeatable jobs.
- Source admin update interval → trong vòng 5 phút worker tự pickup.
- Source admin set null → worker remove repeatable.
- License chokepoint test: METADATA_ONLY enforce content=null trong fetch path mới.
- Idempotency test: re-run discover → 0 inserts.

**Non-functional:** test runtime <30s, không network call thật (mock adapter).

## Architecture

```
apps/worker/src/
├── jobs/
│   ├── discover-job.ts          # đã có
│   └── discover-cron.ts         # ⊕ NEW: sync repeatables theo Source

packages/core/__tests__/
└── license-guard.test.ts        # đã pass — confirm vẫn pass với fetch path mới (re-run)

apps/worker/__tests__/
├── save-discovered.test.ts      # ⊕ NEW: idempotency
└── fetch-item.test.ts           # ⊕ NEW: license enforce trong fetch path

docs/
├── crawler-demo.md              # ⟳ rewrite cho 2-phase flow
└── system-architecture.md       # ⟳ update diagram
```

## Related Code Files

**Create:**
- `apps/worker/src/jobs/discover-cron.ts`
- `apps/worker/__tests__/save-discovered.test.ts`
- `apps/worker/__tests__/fetch-item.test.ts`
- `apps/worker/vitest.config.ts` (nếu chưa có)

**Modify:**
- `apps/worker/src/index.ts` (boot discover-cron)
- `apps/worker/package.json` (test script + vitest dep)
- `docs/crawler-demo.md` (rewrite cho 2-phase)
- `docs/system-architecture.md` (update flow)
- `docs/development-roadmap.md` (mark Phase 09 done — đề xuất số phase mới)
- `docs/project-changelog.md` (append entry)
- `README.md` (1-2 dòng note flow mới + screenshot inbox nếu có)

## Implementation Steps

1. **`discover-cron.ts`:**
   - `syncRepeatables()`: query `Source.findMany({ where: { enabled: true } })`.
   - For each source: nếu `refreshIntervalHours != null` → ensure repeatable `discover:${sourceId}` với `every: hours * 3600 * 1000`. Nếu null → removeRepeatableByKey nếu có.
   - Schedule poll mỗi 5 phút (setInterval) hoặc dùng repeatable `cron-sync-tick`.
   - Boot: gọi syncRepeatables() ngay.
2. **`worker/index.ts`:** thêm `await syncRepeatables()` + `setInterval(syncRepeatables, 5 * 60 * 1000)`.
3. **Tests:**
   - `save-discovered.test.ts`: mock adapter trả 2 stories × 3 chapters → call `saveDiscovered()` → expect 2 Story upsert + 6 DiscoveredItem. Re-run → expect 0 new (skipDuplicates).
   - `fetch-item.test.ts`:
     - METADATA_ONLY source + adapter `fetchChapterContent` defined → expect content=null trong Chapter, licenseStatus=METADATA_ONLY, adapter.fetchChapterContent KHÔNG được gọi.
     - FULL source + adapter trả "Hello" → Chapter.content="Hello".
     - MOCK source: tương tự FULL.
   - Mock prisma bằng vitest mocks hoặc dùng `prisma-mock` lib (KISS: dùng test DB riêng + cleanup).
4. **Vitest config worker:** include `__tests__/**/*.test.ts`, environment node.
5. **Rewrite `docs/crawler-demo.md`:**
   - Diagram 2-phase.
   - Hướng dẫn discover → approve → fetch → review → schedule → publish.
   - SQL verify license enforcement vẫn áp dụng.
6. **Update `docs/system-architecture.md`:** Data Flow section thêm step "Discover" trước "Save", thêm DiscoveredItem trong table list.
7. **README:** 1 dòng "Now 2-phase: discover stubs → editor approve → fetch content". Screenshot inbox optional.
8. **Final pass:** `pnpm typecheck && pnpm test && pnpm --filter @story-crawler/web build`.

## Todo List

- [ ] discover-cron.ts syncRepeatables
- [ ] Worker boot + 5-min poll
- [ ] save-discovered.test.ts (2 cases: insert + idempotent)
- [ ] fetch-item.test.ts (3 cases: FULL/MOCK/METADATA_ONLY)
- [ ] Vitest config apps/worker
- [ ] docs/crawler-demo.md rewrite
- [ ] docs/system-architecture.md update
- [ ] docs/project-changelog.md entry
- [ ] README hint
- [ ] Final typecheck + test + build pass

## Success Criteria

- Set Source.refreshIntervalHours=1 → worker log "registered repeatable discover:<sourceId> every 3600000ms". Sau 1h → CrawlJob row mới.
- Set null → worker log "removed repeatable …".
- `pnpm test` show ≥18 passing (13 cũ + 5 mới).
- `pnpm typecheck` + `pnpm --filter @story-crawler/web build` pass.

## Risk Assessment

- **Risk:** 5-min poll trễ — chấp nhận được cho MVP. Phase 2: pub/sub event-driven.
- **Risk:** Test DB pollution — dùng `DATABASE_URL_TEST` env riêng + `prisma migrate reset --skip-seed` trước test.
- **Risk:** BullMQ repeatable cũ bị orphan khi xoá Source — `discover-cron` cần xoá repeatable cho source không còn enabled.

## Security Considerations

- Test creds chỉ trong `.env.test` (không commit).
- Worker không expose endpoint nào — không tăng attack surface.

## Next Steps

→ Ship. Phase 5 candidates: hierarchical approve, RSS/sitemap discovery, conditional GET, archive cleanup, queue-level rate limiter.
