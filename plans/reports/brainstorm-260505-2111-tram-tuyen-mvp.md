---
type: brainstorm
date: 2026-05-05
slug: tram-tuyen-mvp
status: approved
---

# Brainstorm Report — Trạm Tuyện MVP

**Tagline:** "Trạm Tuyện — nơi mỗi câu chuyện dừng chân."

## 1. Problem Statement

Cần MVP một hệ thống đọc truyện gồm: public site đọc truyện (mobile-first, SEO), admin CMS quản lý nội dung, crawler hợp pháp (FULL/METADATA_ONLY/MOCK), workflow duyệt + hẹn giờ đăng chương, log crawl + publish. Codebase trống — greenfield.

## 2. Constraints

- Không vi phạm bản quyền: crawler chỉ chạm OWNED / LICENSED / PUBLIC_DOMAIN / METADATA_ONLY.
- Nguồn chưa có quyền: chỉ lưu metadata, KHÔNG full content.
- Không secret trong code, không phá build, type/lint pass.
- Mobile-first reader, admin dễ thao tác, có loading/empty/error states.

## 3. Approaches Evaluated

| # | Approach | Pros | Cons | Verdict |
|---|----------|------|------|---------|
| A | Next.js 15 monorepo + Prisma + Postgres + BullMQ | 1 stack TS, share types, ship nhanh, full-control crawler | Cần quản lý worker process | **CHỌN** |
| B | Next.js + NestJS tách BE | NestJS mạnh queue/DI | Overhead 2 service cho MVP | Reject |
| C | Next.js + FastAPI | Python crawler ecosystem | 2 ngôn ngữ, deploy phức tạp | Reject |
| D | Astro + Hono + edge | Cheap, fast | Crawler/scheduler bị giới hạn edge runtime | Reject |

**Queue:** BullMQ + Redis chốt — repeatable jobs cho cả crawl và publish, retry/dead-letter sẵn.

**Crawler scope:** 3 adapters — `mock-fixture`, `gutenberg-vi` (FULL public domain), `metadata-only-demo` — đủ chứng minh license enforcement.

**Deploy:** Docker Compose self-host VPS — web + worker + postgres + redis.

## 4. Final Solution

### 4.1 Stack
- **Frontend + Admin:** Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui, lucide-icons.
- **Backend:** Next.js Route Handlers + Server Actions; worker process tách riêng cho BullMQ.
- **DB:** PostgreSQL 16 + Prisma ORM.
- **Queue:** BullMQ + Redis 7.
- **Auth:** NextAuth v5 credentials, JWT session, role ADMIN/EDITOR.
- **Validation:** Zod. **Logging:** pino. **Tests:** Vitest + Playwright.

### 4.2 Repo Layout (pnpm workspaces)
```
trạm-tuyện/
├── apps/web/              # Next.js public + /admin
├── apps/worker/           # BullMQ worker (crawl + publish jobs)
├── packages/db/           # Prisma schema, client, seed
├── packages/core/         # domain types, slugify, hash, license guard
├── docker/                # compose, Dockerfiles
└── .env.example
```

### 4.3 Data Model (key tables)
- `User(id,email,passwordHash,role,createdAt)`
- `Author(id,name,slug)`
- `Genre(id,name,slug)`
- `Story(id,title,slug,authorId,description,coverUrl,storyStatus,licenseStatus,sourceUrl?,sourceId?,timestamps)`
- `StoryGenre(storyId,genreId)` — M2M
- `Chapter(id,storyId,number,title,slug,content?,contentHash?,sourceUrl?,publishStatus,scheduledAt?,publishedAt?,createdAt)`
- `Source(id,name,baseUrl,adapterKey,licenseMode[FULL|METADATA_ONLY|MOCK],enabled,lastRunAt)`
- `CrawlJob(id,sourceId,status,startedAt,finishedAt,itemsFound,itemsNew,errorMessage?)`
- `PublishLog(id,chapterId,status,message?,attemptedAt)`

**Enums:** `Role`, `StoryStatus`, `LicenseStatus`, `PublishStatus`, `LicenseMode`, `JobStatus`.

**Uniques:** `Story.slug`, `(Chapter.storyId,number)`, `(Chapter.storyId,contentHash)`.

### 4.4 Crawler Architecture
- Interface `CrawlerAdapter`: `discoverStories()`, `fetchChapters()`, `fetchChapterContent?()`.
- License guard tập trung trong service `saveCrawled()` — chokepoint duy nhất ghi DB:
  - `licenseMode === FULL` → save content.
  - `licenseMode !== FULL` → `content = null`, `licenseStatus = METADATA_ONLY`.
- Dedupe: skip nếu match `(storyId, number)` hoặc `(storyId, contentHash)`.
- Mới crawl → `publishStatus = PENDING_REVIEW` (KHÔNG auto publish).
- Adapters MVP: `mock-fixture` (JSON local), `gutenberg-vi` (FULL), `metadata-only-demo`.

### 4.5 Publish Flow
1. Editor approve → `DRAFT` hoặc `SCHEDULED + scheduledAt`.
2. Repeatable BullMQ job mỗi 60s quét `SCHEDULED && scheduledAt <= now()` → flip `PUBLISHED`, ghi `PublishLog`.
3. Lỗi → `FAILED` + log message, retry max 3 exponential backoff.

### 4.6 Public UI/UX
- Mobile-first, max-width reader 680px, line-height 1.75.
- Font: serif body (Lora/Source Serif), sans heading (Inter).
- Background warm `#FAF8F3`, dark mode toggle, font-size selector.
- Reader: sticky chapter prev/next, progress bar, no ads, no animation phân tâm.
- SEO: `/truyen/{slug}`, `/truyen/{slug}/chuong-{n}-{chapter-slug}`, OG tags, JSON-LD Book/Chapter, sitemap.xml, robots.txt.

### 4.7 Admin CMS
- shadcn/ui Data Table, Sheet, Dialog, AlertDialog confirm cho destructive.
- Pages: Dashboard, Stories, Chapters (filter by status), Authors, Genres, Sources, Crawl Jobs, Publish Logs.
- Trigger crawl manual, view crawl log + error, review chapter, schedule chapter.
- RBAC: ADMIN full, EDITOR no user/source mgmt.

## 5. Implementation Phases

| # | Phase | Deliverable |
|---|-------|-------------|
| 01 | Bootstrap monorepo + Docker + Prisma schema + .env.example | `pnpm dev` runs, DB migrated |
| 02 | NextAuth + admin layout + RBAC middleware | Login, role guard |
| 03 | CRUD Stories/Chapters/Authors/Genres + admin tables | Admin manages content |
| 04 | Public site: home, list, detail, reader, search/filter, SEO | Public live |
| 05 | Crawler core + 3 adapters + manual trigger | Crawl into PENDING_REVIEW |
| 06 | Review + schedule + publisher worker | E2E publish flow |
| 07 | Crawl + publish logs UI + dashboard stats | Observability |
| 08 | Seed data + tests + docs (README, run-local, seed, crawl, schedule) | Shippable MVP |

## 6. Risks & Mitigations

- **License bypass** → single chokepoint `saveCrawled()`, unit test mỗi licenseMode.
- **Scheduler drift / double-publish** → publisher queue concurrency=1, idempotency check `publishStatus` trước khi flip.
- **Dedupe miss khi format đổi** → hash trên content normalized (trim, collapse whitespace).
- **Worker crash mất job** → BullMQ persistent, Redis AOF, retry policy.
- **Crawler bị chặn IP** → MVP chỉ chạy manual trigger, rate limit trong adapter.

## 7. Out of Scope (MVP)

- User-facing accounts (chỉ admin/editor login).
- Comments, ratings, bookmarks.
- i18n.
- Full-text search (dùng `ILIKE` title; `tsvector` phase 2).
- Payment, ads.
- Mobile app native.

## 8. Success Metrics

- Login admin → tạo story + chapter thủ công → public site hiển thị < 5 phút.
- Trigger crawl `mock-fixture` → 5 stories vào PENDING_REVIEW < 10s.
- Approve + schedule chapter +1 phút → publisher tự flip PUBLISHED, log SUCCESS.
- Lighthouse mobile reader: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90.
- `pnpm typecheck && pnpm lint && pnpm build` pass.

## 9. Decisions Locked

- ✅ Stack: Next.js 15 + Prisma + Postgres + BullMQ + Redis
- ✅ Repo: pnpm monorepo (`apps/web`, `apps/worker`, `packages/{db,core}`)
- ✅ Auth: NextAuth v5 credentials, role ADMIN/EDITOR
- ✅ Crawler adapters MVP: mock-fixture + gutenberg-vi (FULL) + metadata-only-demo
- ✅ Deploy: Docker Compose self-host
- ✅ License enforcement: chokepoint `saveCrawled()` service
- ✅ Publisher: BullMQ repeatable 60s, concurrency=1
- ✅ Out of scope MVP: comments, user accounts, i18n, FTS

## 10. Unresolved Questions

1. Domain name + hosting VPS provider chốt sau (không block dev).
2. Logo/branding visual chốt ở phase UI (sẽ trigger `ui-ux-pro-max` skill).
3. Cần backup/restore strategy cho Postgres không? (đề xuất pg_dump cron, phase 2).
4. Có cần admin audit log (ai sửa cái gì) ở MVP không? (đề xuất phase 2).
