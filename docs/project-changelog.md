# Changelog

## 0.2.0 — 2026-05-06 — Two-phase crawl

### Changed
- Single-pass crawl split into **discover** and **fetch** queues.
  - `crawl-discover` (concurrency 1): adapter discoverStories + fetchChapters → upsert Story + bulk insert `DiscoveredItem` stubs (no content).
  - `crawl-fetch` (concurrency 2, attempts 3 expo): per-item fetch with **license chokepoint preserved** in `services/fetch-item.ts`.
- Renamed: `services/save-crawled.ts` → `save-discovered.ts`; `queues/crawl-queue.ts` → `crawl-discover-queue.ts`; `lib/queues/crawl-enqueue.ts` → `discover-enqueue.ts`; `jobs/crawl-job.ts` → `discover-job.ts`.

### Added
- Prisma: enum `DiscoveredStatus`, model `DiscoveredItem` (UNIQUE `sourceId+externalId`), `Source.refreshIntervalHours`.
- Admin `/admin/discovered` inbox with 5 tabs (DISCOVERED/QUEUED/FETCHED/SKIPPED/FAILED) + bulk actions (Fetch/Skip/Restore/Retry, max 200/op).
- Source form: "Tự động làm mới" select (Off/1h/3h/6h/12h/24h/168h).
- `discover-cron` worker: `syncRepeatables()` polls `Source` every 5 min and registers/removes BullMQ repeatable `discover:{sourceId}`.
- Sources list: per-source inbox counts column (D/F/S) linking to filtered inbox.
- Sidebar: "Inbox" link.
- Tests: `save-discovered.test.ts` (insert + idempotent), `fetch-item.test.ts` (FULL/MOCK/METADATA_ONLY/idempotency guard).

### Notes
- Migration `20260506062005_two_phase_discover_fetch` adds new table/enum/column without touching existing data.
- Old MVP flow (single-pass content fetch) is retired; backward-compat for existing `Chapter PENDING_REVIEW` rows preserved.

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
