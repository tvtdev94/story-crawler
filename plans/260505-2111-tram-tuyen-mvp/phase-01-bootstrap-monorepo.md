---
phase: 01
title: Bootstrap monorepo + Docker + Prisma schema
status: pending
priority: P0
effort: M
depends: []
---

# Phase 01 — Bootstrap monorepo + Docker + Prisma

## Context Links
- [plan.md](plan.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Khởi tạo pnpm monorepo, cấu hình Docker Compose (postgres + redis), Prisma schema đầy đủ, env mẫu. Chạy được `pnpm dev` và `pnpm db:migrate`.

## Key Insights
- Single Prisma schema ở `packages/db` được share giữa `apps/web` và `apps/worker`.
- TypeScript strict + path aliases qua `tsconfig.base.json`.
- Compose chạy postgres + redis cho dev; web/worker dev chạy host (HMR), production build vào image.

## Requirements
**Functional:** monorepo setup, Docker dev infra, Prisma schema, env example, scripts pnpm.
**Non-functional:** type-safe, hot reload, không secret trong code, build pass.

## Architecture
```
trạm-tuyện/
├── pnpm-workspace.yaml
├── package.json           # root scripts
├── tsconfig.base.json
├── .env.example
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile.web
│   └── Dockerfile.worker
├── apps/
│   ├── web/               # next.config.mjs, app/, package.json
│   └── worker/            # src/index.ts, package.json
└── packages/
    ├── db/                # prisma/schema.prisma, src/client.ts, src/seed.ts
    └── core/              # src/{slugify,hash,license-guard,types}.ts
```

## Related Code Files
**Create:**
- `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.env.example`, `.gitignore`, `.editorconfig`
- `docker/docker-compose.yml`, `docker/Dockerfile.web`, `docker/Dockerfile.worker`
- `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/tsconfig.json`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/src/index.ts`
- `packages/db/package.json`, `packages/db/prisma/schema.prisma`, `packages/db/src/client.ts`, `packages/db/src/index.ts`
- `packages/core/package.json`, `packages/core/src/{slugify,hash,types,license-guard}.ts`

## Implementation Steps
1. Init pnpm workspace + root scripts (`dev`, `build`, `lint`, `typecheck`, `db:migrate`, `db:seed`).
2. Setup `tsconfig.base.json` strict + path aliases `@trạmtuyện/db`, `@trạmtuyện/core`.
3. Tạo `apps/web` với Next.js 15 App Router, Tailwind, shadcn/ui CLI init.
4. Tạo `apps/worker` skeleton (BullMQ Worker + Redis connection từ env).
5. Tạo `packages/core` exports: `slugifyVi()`, `sha256Normalized()`, types/enums shared, `licenseGuard()`.
6. Tạo `packages/db` Prisma schema:
   - Models: User, Author, Genre, Story, StoryGenre, Chapter, Source, CrawlJob, PublishLog
   - Enums: Role(ADMIN,EDITOR), StoryStatus(ONGOING,COMPLETED,HIATUS), LicenseStatus(OWNED,LICENSED,PUBLIC_DOMAIN,METADATA_ONLY,UNAUTHORIZED), PublishStatus(DRAFT,PENDING_REVIEW,SCHEDULED,PUBLISHED,FAILED), LicenseMode(FULL,METADATA_ONLY,MOCK), JobStatus(QUEUED,RUNNING,SUCCESS,FAILED), PublishLogStatus(SUCCESS,FAILED)
   - Uniques: `Story.slug`, `(Chapter.storyId,number)`, `(Chapter.storyId,contentHash)`
   - Indexes: `Story.licenseStatus`, `Chapter.publishStatus`, `Chapter.scheduledAt`
7. Viết `docker-compose.yml`: postgres:16, redis:7, healthcheck, named volumes.
8. Viết `.env.example`: `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed only).
9. Run `pnpm install`, `docker compose up -d`, `pnpm db:migrate`, verify.
10. Chạy `pnpm typecheck && pnpm lint && pnpm build` — phải pass.

## Todo List
- [ ] pnpm workspace + root package.json scripts
- [ ] tsconfig.base.json strict + aliases
- [ ] apps/web Next.js 15 + Tailwind + shadcn init
- [ ] apps/worker BullMQ skeleton
- [ ] packages/core (slugify/hash/types/license-guard)
- [ ] packages/db Prisma schema + client export + enums + uniques
- [ ] docker/docker-compose.yml (postgres + redis)
- [ ] Dockerfile.web + Dockerfile.worker
- [ ] .env.example
- [ ] .gitignore + .editorconfig
- [ ] First migration `pnpm db:migrate`
- [ ] typecheck + lint + build pass

## Success Criteria
- `docker compose up -d` → postgres + redis healthy.
- `pnpm db:migrate` tạo schema.
- `pnpm dev` chạy `apps/web` (port 3000) + `apps/worker` đồng thời.
- `pnpm typecheck && pnpm lint && pnpm build` pass.

## Risk Assessment
- **Risk:** TS path aliases lệch giữa Next.js và worker → mitigate dùng `tsconfig.base.json` extend chung.
- **Risk:** Prisma client gen path conflict → output vào `packages/db/node_modules/.prisma/client` (default).
- **Risk:** Tên project có dấu tiếng Việt gây vấn đề import → dùng folder ASCII (`tram-tuyen` hoặc giữ root tên dir trống), package names ASCII.

## Security Considerations
- `.env` trong `.gitignore`. Chỉ commit `.env.example`.
- `NEXTAUTH_SECRET` random 32+ bytes generated, không hardcode.
- Postgres password trong compose dùng env var, không hardcode.

## Next Steps
→ Phase 02 (NextAuth + admin layout + RBAC).
