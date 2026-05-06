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
                              │  - discover-job (crawl-discover queue) │
                              │  - fetch-job (crawl-fetch queue)       │
                              │  - discover-cron (5-min poll)          │
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

Adapters in `apps/worker/src/crawlers/*` MUST NOT import `@story-crawler/db` directly. Content writes flow through `services/fetch-item.ts` (the **license chokepoint**); discovery (Story upsert + DiscoveredItem stubs) flows through `services/save-discovered.ts` (no content).

## Data Flow: Discover → Approve → Fetch → Publish

```
Admin "Refresh" ──▶ enqueueDiscover(sourceId)     [apps/web/lib/queues]
                  ──▶ Redis "crawl-discover" queue
                  ──▶ apps/worker discover-job
                  ──▶ adapter.discoverStories() + fetchChapters()
                  ──▶ saveDiscovered(source, adapter)
                      ├─ Story upsert (no content)
                      └─ DiscoveredItem.createMany(skipDuplicates) ── UNIQUE(sourceId,externalId)
                  ──▶ CrawlJob row updated

Editor @ /admin/discovered ──▶ bulk Fetch (max 200)
                          ──▶ updateMany DISCOVERED → QUEUED
                          ──▶ enqueueFetch(itemIds[])
                          ──▶ Redis "crawl-fetch" queue (concurrency 2, attempts 3 expo)
                          ──▶ apps/worker fetch-job
                          ──▶ fetchItem(id)        ★ license chokepoint
                              ├─ guard status=QUEUED (idempotent)
                              ├─ skip adapter call if METADATA_ONLY
                              ├─ applyLicensePolicy(licenseMode, payload)
                              ├─ dedupe (storyId,contentHash)
                              ├─ INSERT Chapter PENDING_REVIEW
                              └─ UPDATE DiscoveredItem FETCHED + chapterId

Cron (per Source.refreshIntervalHours) ──▶ syncRepeatables() polls every 5 min,
                                       registers BullMQ repeatable discover:{sourceId}.

Editor approve (bulk) @ /admin/review ──▶ Chapter publishStatus=DRAFT
Editor schedule                       ──▶ Chapter publishStatus=SCHEDULED + scheduledAt
Publisher tick (60s)                  ──▶ pick SCHEDULED && scheduledAt<=now()
                                      ──▶ Chapter publishStatus=PUBLISHED + publishedAt
                                      ──▶ PublishLog SUCCESS
                                      ──▶ POST /api/internal/revalidate (token-gated)
                                      ──▶ revalidateTag(story:slug) → public ISR refresh
```

## Tables Touched by Crawl

| Table | Owner | Note |
|---|---|---|
| `Source` | admin form | adds `refreshIntervalHours` for cron |
| `Story` | discover-job | upsert metadata (no content) |
| `DiscoveredItem` | discover-job + fetch-job | per-chapter stub + state machine |
| `Chapter` | fetch-job | content + license-policed |
| `CrawlJob` | discover-job | run audit |

## Auth & RBAC

- NextAuth v5 credentials provider, JWT session.
- `middleware.ts` gates `/admin/*` (skip `/admin/login`) using `getToken` from `next-auth/jwt`.
- `requireSession()` / `requireRole("ADMIN")` server helpers in route handlers + actions.
- ADMIN: full access. EDITOR: no Sources or User mgmt.

## Deploy Topology (production)

`docker compose -f docker/docker-compose.prod.yml` (TODO) runs 4 services: web, worker, postgres, redis. Secrets via env. Reverse proxy (Caddy/Nginx) handles TLS.
