---
phase: 08
title: Seed data + tests + docs
status: pending
priority: P0
effort: M
depends: [07]
---

# Phase 08 — Seed + Tests + Docs

## Context Links
- [plan.md](plan.md)
- [Phase 07](phase-07-logs-dashboard.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Seed dữ liệu mẫu đủ chạy demo, cover các test quan trọng (license guard, dedupe, publish flow), viết docs onboarding (README, run-local, seed, crawler demo, test schedule).

## Key Insights
- Seed phải tạo: 1 admin + 1 editor user, 5 stories (mix license), 30 chapters (mix status), 5 genres, 5 authors, 3 sources, 3 crawl jobs, 5 publish logs.
- Tests prioritize: license enforcement (highest, legal), dedupe, publish idempotency, RBAC.
- Docs gọn: 1 README chính + `docs/` có `run-local.md`, `crawler-demo.md`, `schedule-test.md`, `system-architecture.md`.
- E2E Playwright: chỉ smoke flow critical, không full coverage MVP.

## Requirements
**Functional:** `pnpm db:seed` chạy ổn từ DB rỗng, idempotent. Test suite pass. Docs render markdown ổn.
**Non-functional:** test runtime < 60s, seed runtime < 10s.

## Architecture
```
packages/db/src/seed.ts                  # main seed entry
packages/db/src/seed/
├── users.ts
├── authors.ts, genres.ts
├── stories.ts                           # PUBLIC_DOMAIN + METADATA_ONLY mix
├── chapters.ts                          # mix all 5 statuses
├── sources.ts                           # 3 sources (mock + gutenberg + metadata-only)
└── logs.ts                              # sample CrawlJob + PublishLog

apps/web/__tests__/                      # Vitest unit + integration
apps/worker/__tests__/                   # Vitest worker tests
e2e/                                     # Playwright
├── public-reader.spec.ts
├── admin-login.spec.ts
└── crawl-publish-flow.spec.ts

README.md
docs/
├── system-architecture.md
├── run-local.md
├── crawler-demo.md
├── schedule-test.md
├── code-standards.md
└── development-roadmap.md
```

## Related Code Files
**Create:**
- All under `packages/db/src/seed/`
- `apps/web/__tests__/auth.test.ts`, `apps/web/__tests__/rbac.test.ts`
- `apps/worker/__tests__/license-guard.test.ts` ← **CRITICAL**
- `apps/worker/__tests__/dedupe.test.ts`
- `apps/worker/__tests__/publish-idempotency.test.ts`
- `e2e/{public-reader,admin-login,crawl-publish-flow}.spec.ts`
- `playwright.config.ts`, `vitest.config.ts`
- `README.md`
- `docs/{system-architecture,run-local,crawler-demo,schedule-test,code-standards,development-roadmap}.md`

## Implementation Steps
1. **Seed**:
   - Admin user (from env `ADMIN_EMAIL/ADMIN_PASSWORD`) + 1 editor user.
   - 5 genres (Tiên hiệp, Đô thị, Cổ điển, Thiếu nhi, Khoa học viễn tưởng).
   - 5 authors.
   - 5 stories: 2 PUBLIC_DOMAIN (with full content), 1 OWNED, 1 LICENSED, 1 METADATA_ONLY.
   - 30 chapters: mix DRAFT, PENDING_REVIEW, SCHEDULED (some past time so publisher picks up), PUBLISHED, FAILED.
   - 3 sources: mock-fixture, gutenberg-vi, metadata-only-demo.
   - 3 sample CrawlJob (1 SUCCESS, 1 FAILED, 1 RUNNING-stale).
   - 5 PublishLog (4 SUCCESS, 1 FAILED).
   - Idempotent: upsert by stable keys.
2. **Vitest config** (apps/web + apps/worker share root config).
3. **License guard tests** (mandatory):
   - `licenseMode=FULL` → content kept, licenseStatus respects input.
   - `licenseMode=METADATA_ONLY` → content nullified, licenseStatus=METADATA_ONLY.
   - `licenseMode=MOCK` → behaves like FULL (mock fixtures).
4. **Dedupe tests**: 2nd insert same (storyId, number) → skip; same contentHash different number → skip.
5. **Publish idempotency test**: call publish handler twice on same chapter → only 1 PublishLog SUCCESS.
6. **Auth/RBAC tests**: ADMIN can access user mgmt route, EDITOR redirected.
7. **Playwright e2e**:
   - Public reader: visit home → click story → click chapter → assert content visible + theme toggle works.
   - Admin login: invalid creds → error; valid → redirected dashboard.
   - Crawl-publish: login admin → run mock-fixture → assert chapters PENDING_REVIEW → bulk approve → schedule one +60s → wait → assert PUBLISHED.
8. **README.md**:
   - Tagline + screenshot placeholder.
   - Stack summary.
   - Quick start: prerequisites (Node 20, pnpm 9, Docker).
   - 5-line "run local" → link to `docs/run-local.md`.
   - Folder structure.
   - License section (project license).
9. **docs/run-local.md**: step-by-step (clone, env, docker compose up, migrate, seed, dev, login URL + creds from env).
10. **docs/crawler-demo.md**: how to run mock + gutenberg + metadata-only adapter; expected outputs; how to view CrawlJob + errors.
11. **docs/schedule-test.md**: how to schedule chapter +60s; how to verify; troubleshooting if not flipping.
12. **docs/system-architecture.md**: ascii diagram + module responsibilities + data flow crawl→review→publish.
13. **docs/code-standards.md**: TS strict, Zod everywhere, license guard chokepoint, kebab-case files <200 lines.
14. **docs/development-roadmap.md**: MVP scope checked + phase 2 list (FTS, comments, audit log, backups, mobile native).
15. CI script (optional): `pnpm typecheck && pnpm lint && pnpm test && pnpm build` for sanity.

## Todo List
- [ ] Seed: users/authors/genres/stories/chapters/sources/logs
- [ ] Seed idempotent (upsert)
- [ ] Vitest config + base setup
- [ ] License guard tests (3 modes) — **MUST**
- [ ] Dedupe tests
- [ ] Publish idempotency test
- [ ] Auth/RBAC tests
- [ ] Playwright config + 3 e2e specs
- [ ] README.md
- [ ] docs/run-local.md
- [ ] docs/crawler-demo.md
- [ ] docs/schedule-test.md
- [ ] docs/system-architecture.md
- [ ] docs/code-standards.md
- [ ] docs/development-roadmap.md
- [ ] Final `typecheck && lint && test && build` pass

## Success Criteria
- `pnpm db:seed` từ DB rỗng → kết quả như spec, idempotent (chạy lại không nhân đôi).
- `pnpm test` pass tất cả unit + integration; license guard cover 3 modes.
- `pnpm e2e` pass 3 flows.
- `pnpm typecheck && pnpm lint && pnpm build` pass.
- README đủ để dev mới chạy local trong <10 phút.

## Risk Assessment
- **Risk:** Test rò rỉ DB state → mỗi test suite dùng test DB riêng (`DATABASE_URL_TEST`), `prisma migrate reset` trước run.
- **Risk:** Playwright flaky với scheduling timing → dùng worker tick frequency 5s ở test mode (env `PUBLISH_TICK_MS=5000`).
- **Risk:** Seed chạy ở production → guard `if (process.env.NODE_ENV === 'production') throw`.

## Security Considerations
- Seed admin password từ env, KHÔNG hardcode trong code.
- Test creds chỉ trong `.env.test` không commit.
- Docs KHÔNG chứa secrets — chỉ placeholder và link tới `.env.example`.

## Next Steps
→ Ship MVP. Phase 2 candidates:
- Postgres FTS (`tsvector`).
- Audit log đầy đủ.
- Backup/restore strategy (pg_dump cron).
- User-facing accounts + bookmarks + comments.
- Rich text editor cho chapter.
- Rate limit middleware (login + crawl trigger).
- Backup/disaster recovery.
- Mobile native app.
