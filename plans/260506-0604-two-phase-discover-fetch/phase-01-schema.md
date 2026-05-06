---
phase: 01
title: Schema migration + types
status: completed
priority: P0
effort: S
depends: []
---

# Phase 01 — Schema migration + types

## Context Links

- [plan.md](plan.md)
- [Brainstorm §5.1 Schema](../reports/brainstorm-260506-0604-two-phase-discover-fetch.md)

## Overview

Thêm `DiscoveredItem` table + enum `DiscoveredStatus` + cột `Source.refreshIntervalHours`. Generate Prisma client. Update `packages/core/types.ts` với enum mới. Migrate DB.

## Key Insights

- Idempotent discovery dựa trên UNIQUE `(sourceId, externalId)`.
- `storyId` FK bắt buộc — Story đã upsert lúc discover, DiscoveredItem chỉ tracking chapter stubs.
- `chapterId` nullable — populate sau khi fetch thành công.
- Backward-compat: không động vào Chapter/Source/Story đã có.

## Requirements

**Functional:** Prisma schema mới compile, migration apply sạch trên DB hiện hữu (đã có data MVP).
**Non-functional:** typecheck pass, không break existing query.

## Architecture

Schema diff trong `packages/db/prisma/schema.prisma`:

```prisma
enum DiscoveredStatus {
  DISCOVERED
  QUEUED
  FETCHED
  SKIPPED
  FAILED
}

model DiscoveredItem {
  id            String           @id @default(cuid())
  sourceId      String
  storyId       String
  externalId    String
  number        Int
  title         String
  sourceUrl     String?
  status        DiscoveredStatus @default(DISCOVERED)
  errorMessage  String?
  attempts      Int              @default(0)
  discoveredAt  DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  fetchedAt     DateTime?
  chapterId     String?

  source        Source           @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  story         Story            @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([sourceId, externalId])
  @@index([status, discoveredAt])
  @@index([sourceId, status])
  @@index([storyId])
}

model Source {
  // ... existing fields
  refreshIntervalHours  Int?
  discoveredItems       DiscoveredItem[]
}

model Story {
  // ... existing fields
  discoveredItems       DiscoveredItem[]
}
```

Mirror enum `DiscoveredStatus` trong `packages/core/src/types.ts` (giữ pattern các enum khác).

## Related Code Files

**Modify:**
- `packages/db/prisma/schema.prisma` (thêm enum + model + 2 relation)
- `packages/core/src/types.ts` (export `DiscoveredStatus` const + type)

**Generate:**
- `packages/db/prisma/migrations/<timestamp>_two_phase_discover_fetch/migration.sql`

## Implementation Steps

1. Edit `schema.prisma`: thêm enum `DiscoveredStatus`, model `DiscoveredItem`, field `refreshIntervalHours`, relations vào Source + Story.
2. Run `pnpm db:migrate -- --name two_phase_discover_fetch`.
3. Edit `packages/core/src/types.ts`: thêm `DiscoveredStatus` const + type theo pattern hiện có.
4. Run `pnpm db:generate`.
5. Run `pnpm typecheck` — pass.
6. Verify trong psql: `\d "DiscoveredItem"` show schema, `\d "Source"` có cột mới.

## Todo List

- [ ] Schema diff trong schema.prisma
- [ ] Migration run + commit migration.sql
- [ ] Types mirror trong packages/core
- [ ] Prisma generate
- [ ] Typecheck pass
- [ ] psql verify

## Success Criteria

- `pnpm db:migrate` pass không lỗi.
- `pnpm typecheck` pass.
- `SELECT * FROM "DiscoveredItem" LIMIT 1;` không lỗi.
- `SELECT "refreshIntervalHours" FROM "Source" LIMIT 1;` không lỗi.

## Risk Assessment

- **Risk:** migration chạy trên DB có data → cột mới nullable nên safe. DiscoveredItem table mới hoàn toàn → safe.
- **Risk:** prisma client gen lệch → run `pnpm db:generate` rõ ràng sau migrate.

## Security Considerations

Không có (schema-only).

## Next Steps

→ Phase 02 (Worker split).
