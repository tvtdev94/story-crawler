# System Architecture

## Overview

```
┌──────────────┐    HTTPS     ┌────────────────────────────┐
│   Reader     │ ───────────▶ │  apps/web (Next.js 15)     │
└──────────────┘              │  - public site /(public)/  │
                              │  - admin CMS /admin/*      │
                              │  - REST /api/*             │
                              │  - middleware: auth gate   │
                              └─────────┬───────┬──────────┘
                                        │       │
                                  Prisma│       │BullMQ (Redis)
                                        ▼       ▼
                              ┌──────────┐  ┌─────────────┐
                              │ Postgres │  │   Redis     │
                              │   (16)   │  │     (7)     │
                              └────┬─────┘  └──────┬──────┘
                                   │               │
                                   │  Prisma       │ BullMQ
                                   ▼               ▼
                              ┌────────────────────────────┐
                              │  apps/worker               │
                              │  - crawl queue handler     │
                              │  - publish tick (60s)      │
                              │  - 3 adapters              │
                              └────────────────────────────┘
```

## Module Boundaries

| Package | Purpose | Imports |
|---|---|---|
| `packages/core` | Domain types, Zod schemas, slugify, hash, **license-guard** | zod (only) |
| `packages/db` | Prisma client + schema + seed | core, prisma |
| `apps/web` | Next.js (public + admin + API routes) | core, db |
| `apps/worker` | BullMQ workers (crawl + publish) | core, db, bullmq |

Adapters in `apps/worker/src/crawlers/*` MUST NOT import `@story-crawler/db` directly. All DB writes from crawl pass through `services/save-crawled.ts` (the **license chokepoint**).

## Data Flow: Crawl → Publish

```
Admin "Run" ──▶ enqueueCrawl(sourceId)        [apps/web/lib/queues]
                ──▶ Redis "crawl" queue
                ──▶ apps/worker crawlJob handler
                ──▶ adapterRegistry.get(adapterKey)
                ──▶ adapter.discoverStories() → fetchChapters() → fetchChapterContent?
                ──▶ saveCrawled(source, adapter)        ★ chokepoint
                    ├─ applyLicensePolicy(licenseMode, payload)
                    ├─ dedupe (storyId,number) + (storyId,contentHash)
                    └─ INSERT Chapter publishStatus=PENDING_REVIEW
                ──▶ CrawlJob row updated (SUCCESS/FAILED + counts)

Editor approve (bulk) ──▶ Chapter publishStatus=DRAFT
Editor schedule       ──▶ Chapter publishStatus=SCHEDULED + scheduledAt
Publisher tick (60s)  ──▶ pick SCHEDULED && scheduledAt<=now()
                      ──▶ Chapter publishStatus=PUBLISHED + publishedAt
                      ──▶ PublishLog SUCCESS
                      ──▶ POST /api/internal/revalidate (token-gated)
                      ──▶ revalidateTag(story:slug) → public ISR refresh
```

## Auth & RBAC

- NextAuth v5 credentials provider, JWT session.
- `middleware.ts` gates `/admin/*` (skip `/admin/login`) using `getToken` from `next-auth/jwt`.
- `requireSession()` / `requireRole("ADMIN")` server helpers in route handlers + actions.
- ADMIN: full access. EDITOR: no Sources or User mgmt.

## Deploy Topology (production)

`docker compose -f docker/docker-compose.prod.yml` (TODO) runs 4 services: web, worker, postgres, redis. Secrets via env. Reverse proxy (Caddy/Nginx) handles TLS.
