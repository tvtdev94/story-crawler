# Changelog

## 0.1.0 — 2026-05-05 — MVP

### Added
- Monorepo (`apps/web`, `apps/worker`, `packages/{db,core}`) with pnpm workspaces.
- Docker Compose (Postgres 16 + Redis 7).
- Prisma schema: User, Author, Genre, Story, StoryGenre, Chapter, Source, CrawlJob, PublishLog.
- NextAuth v5 credentials provider + admin layout + middleware gate.
- Admin CRUD for Authors, Genres, Stories (with filters/search/pagination), Chapters, Sources.
- Public site: home, story list/detail, reader (mobile-first, max-width 680px), search, genre pages, sitemap, robots, JSON-LD.
- Crawler core with adapter registry + license chokepoint.
- 3 adapters: `mock-fixture` (MOCK), `gutenberg-vi` (FULL), `metadata-only-demo` (METADATA_ONLY).
- BullMQ crawl queue + admin "Run now" trigger.
- Review queue (bulk approve), per-chapter scheduler.
- Publisher worker (60s repeatable tick, concurrency=1, idempotent flip).
- Internal revalidate webhook (token-gated).
- Dashboard stats + CrawlJob list/detail + PublishLog list.
- Seed: admin/editor users, 5 genres, 5 authors, 3 sources, 1 sample published story.
- Vitest unit tests: license-guard (5), slugify (8), hash (3) — 13 total, all pass.
- Docs: `run-local`, `crawler-demo`, `schedule-test`, `system-architecture`, `code-standards`, `development-roadmap`.

### Notes
- Renamed root project from `tram-tuyen` → `story-crawler` (matching repo).
- Display title fixed: `Trạm Tuyện` → `Trạm Truyện`.
- README hero screenshots captured via headless Edge.
