# Development Roadmap

## MVP (shipped)

- [x] Phase 01 — Bootstrap monorepo + Docker + Prisma
- [x] Phase 02 — NextAuth credentials + admin layout + RBAC
- [x] Phase 03 — Domain CRUD admin (Stories/Chapters/Authors/Genres)
- [x] Phase 04 — Public site + reader + SEO (sitemap, robots, JSON-LD)
- [x] Phase 05 — Crawler core + 3 adapters (mock, gutenberg-vi, metadata-only)
- [x] Phase 06 — Review queue + schedule + publisher worker (60s tick)
- [x] Phase 07 — Dashboard stats + crawl-jobs/publish-logs UI
- [x] Phase 08 — Seed + license-guard tests + docs
- [x] Phase 09 — Two-phase crawl (discover → approve → fetch) + per-source cron (2026-05-06)

## Phase 2 (post-MVP)

- [ ] User-facing accounts (bookmark, reading progress)
- [ ] Comments + ratings
- [ ] Postgres FTS (`tsvector`) for search
- [ ] Audit log (who changed what)
- [ ] Postgres backup strategy (pg_dump cron)
- [ ] Rate limit middleware (login, crawl trigger)
- [ ] Rich text editor for chapter content
- [ ] More adapters (with proper licensing)
- [ ] i18n (`vi`/`en`)
- [ ] Mobile native app (React Native)
- [ ] Lighthouse CI on PR
- [ ] Production Docker compose + deploy script

## Tech Debt / Known Issues

- `next-auth/jwt` module augmentation typed via `Record<string, unknown>` — could be tightened in Phase 2.
- Prisma 7 will deprecate `package.json#prisma` block — migrate to `prisma.config.ts`.
- Edge headless screenshots used for README generation — switch to Playwright in CI for consistency.
- Default `ADMIN_PASSWORD` in `.env.example` is `changeme123` — must be rotated before any non-local deploy.
