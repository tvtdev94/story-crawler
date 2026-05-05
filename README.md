# Trạm Truyện

> "Trạm Truyện — nơi mỗi câu chuyện dừng chân."

MVP đọc truyện: public site mobile-first + admin CMS + crawler hợp pháp + workflow duyệt/hẹn giờ.

## Stack

Next.js 15 · TypeScript · Tailwind · shadcn/ui · Prisma · PostgreSQL 16 · BullMQ · Redis 7 · NextAuth v5 · pnpm monorepo · Docker Compose.

## Quick Start

```bash
pnpm install
docker compose -f docker/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000` (public) / `http://localhost:3000/admin` (CMS).

See `docs/run-local.md` for full setup.

## Layout

```
apps/web         Next.js public + /admin
apps/worker      BullMQ worker (crawl + publish)
packages/db      Prisma schema + client + seed
packages/core    domain types, slugify, hash, license guard
docker           compose, Dockerfiles
```

## Status

MVP — implementation in progress. Plan: `plans/260505-2111-story-crawler-mvp/`.
