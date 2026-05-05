---
slug: tram-tuyen-mvp
date: 2026-05-05
status: pending
mode: fast
brainstorm: ../reports/brainstorm-260505-2111-tram-tuyen-mvp.md
blockedBy: []
blocks: []
---

# Plan — Trạm Truyện MVP

> "Trạm Truyện — nơi mỗi câu chuyện dừng chân."

MVP đọc truyện: public site mobile-first + admin CMS + crawler hợp pháp (FULL/METADATA_ONLY/MOCK) + workflow duyệt/hẹn giờ + log crawl/publish. Greenfield. Stack: Next.js 15 + Prisma + Postgres + BullMQ + Redis. Self-host Docker Compose.

## Brainstorm Context
- [Brainstorm Report](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md) — design approved 2026-05-05.

## Stack Locked
Next.js 15 App Router · TS strict · Tailwind · shadcn/ui · Prisma · PostgreSQL 16 · BullMQ · Redis 7 · NextAuth v5 · Zod · pino · Vitest · Playwright · pnpm monorepo · Docker Compose.

## Repo Layout
```
apps/web         # Next.js public + /admin
apps/worker      # BullMQ worker (crawl + publish)
packages/db      # Prisma schema + client + seed
packages/core    # domain types, slugify, hash, license guard
docker           # compose, Dockerfiles
```

## Phases

| # | Phase | File | Status | Effort | Depends |
|---|-------|------|--------|--------|---------|
| 01 | Bootstrap monorepo + Docker + Prisma | [phase-01](phase-01-bootstrap-monorepo.md) | pending | M | — |
| 02 | Auth + admin layout + RBAC | [phase-02](phase-02-auth-rbac.md) | pending | S | 01 |
| 03 | Domain CRUD admin | [phase-03](phase-03-domain-crud.md) | pending | L | 02 |
| 04 | Public site + SEO | [phase-04](phase-04-public-site-seo.md) | pending | L | 03 |
| 05 | Crawler core + 3 adapters | [phase-05](phase-05-crawler-adapters.md) | pending | L | 03 |
| 06 | Review + schedule + publisher worker | [phase-06](phase-06-review-schedule-publisher.md) | pending | M | 05 |
| 07 | Logs UI + dashboard stats | [phase-07](phase-07-logs-dashboard.md) | pending | S | 06 |
| 08 | Seed + tests + docs | [phase-08](phase-08-seed-tests-docs.md) | pending | M | 07 |

## Success Criteria (MVP shippable)
- `pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev` chạy được local.
- Login admin → CRUD truyện + chương → public site hiển thị.
- Trigger crawl `mock-fixture` → 5 stories vào PENDING_REVIEW.
- `metadata-only-demo` adapter KHÔNG lưu content (verified by test).
- Approve + schedule chapter +1 phút → publisher tự flip PUBLISHED + log SUCCESS.
- Lighthouse mobile reader: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90.
- `pnpm typecheck && pnpm lint && pnpm build` pass.

## Out of Scope (MVP)
User accounts, comments, ratings, bookmarks, i18n, FTS (`tsvector`), payment, ads, mobile native.

## Unresolved Questions
1. Domain + VPS provider (không block dev).
2. Logo/branding visual (giải quyết phase 04 qua `ui-ux-pro-max`).
3. Postgres backup strategy (đề xuất phase 2 — pg_dump cron).
4. Admin audit log (đề xuất phase 2).
