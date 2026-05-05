# Code Standards

## Language

- **TypeScript strict** (`tsconfig.base.json`) — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `isolatedModules`.
- **Zod** for all input validation (request bodies, server actions, env). Schemas live in `packages/core/src/schemas/`.
- **No `any`** — use `unknown` + narrow.

## File Layout

- **kebab-case** filenames for `.ts`/`.tsx`.
- Each file ≤ 200 LOC where reasonable; split when growing.
- Co-locate server actions in `app/admin/_actions/<entity>.ts`.
- Public queries in `apps/web/lib/public/queries.ts` (single Prisma chokepoint for public site).

## Imports

- Path aliases: `@/*` (apps/web root), `@story-crawler/core`, `@story-crawler/db`.
- **Never** import `@prisma/client` from `apps/worker/src/crawlers/*` (license enforcement).
- No relative `.js` extensions in TS imports (Next.js webpack rule).

## Server Actions

```ts
"use server";
export async function createX(formData: FormData) {
  await requireSession();         // or requireRole("ADMIN")
  const parsed = XInput.parse({...});  // Zod
  await prisma.x.create({ data: ... });
  revalidatePath("/admin/x");
  redirect("/admin/x");
}
```

## DB

- Prisma migrations versioned in `packages/db/prisma/migrations/`.
- All enums defined in Prisma schema mirror `packages/core/src/types.ts`.
- Indexes on hot paths: `Chapter.publishStatus`, `Chapter.scheduledAt`, `CrawlJob.startedAt DESC`.
- Soft uniqueness: `Story.slug`, `(Chapter.storyId, number)`, `(Chapter.storyId, contentHash)`.

## Worker

- BullMQ queues: `crawl`, `publish`. Connection shared via `redis-connection.ts` singleton.
- Concurrency = 1 for `publish` (no race on PUBLISHED flip).
- Repeatable jobs use stable `jobId` (`publish-tick`) so worker restarts don't duplicate.

## Tests

- Vitest in `__tests__/` colocated per package.
- License guard (`packages/core/__tests__/license-guard.test.ts`) is **mandatory** — covers all 3 modes.
- E2E (Playwright) for critical flows in phase 08+.

## Commits

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- No AI references.
- No secrets — `.env` always in `.gitignore`.

## UI

- Tailwind v3 + CSS vars for theming (paper/ink/accent tokens).
- shadcn/ui-style components in `components/ui/*` (button, input, label).
- Mobile-first: max-width reader 680px, line-height 1.75, serif body (Lora).
- Dark mode via `<html class="dark">`, persisted in localStorage.
