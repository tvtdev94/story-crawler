# Schedule + Publisher Test

## Flow

1. Crawl mock-fixture → 15 chapters `PENDING_REVIEW`.
2. `/admin/review` → bulk approve → `DRAFT`.
3. Open chapter edit → `Schedule` link → set `+90s` → `SCHEDULED`.
4. Publisher worker tick (60s) picks due chapter → `PUBLISHED` + `PublishLog SUCCESS`.
5. Public site shows the chapter (after `revalidateTag('story:<slug>')` fires).

## Fast Test (5s tick)

```bash
PUBLISH_TICK_MS=5000 pnpm --filter @story-crawler/worker dev
```

Run `scripts/test-publish-flow.ts` to schedule 3 chapters +5s, then watch worker log.

Expected within 10s:

```
[INFO] publish tick { picked: 3, succeeded: 3, failed: 0 }
```

## Verify

```sql
-- chapters by state
SELECT count(*), "publishStatus" FROM "Chapter" GROUP BY "publishStatus";

-- publish log
SELECT status, count(*) FROM "PublishLog" GROUP BY status;
```

## Idempotency / Failure Handling

- **Concurrency = 1** (`apps/worker/src/jobs/publish-job.ts`) — no double publish.
- Per-tick `updateMany` filters `publishStatus=SCHEDULED` to avoid race.
- On exception: PublishLog FAILED row added; chapter stays SCHEDULED until 3 fails → flips to FAILED state.

## Troubleshooting

- **Stuck SCHEDULED**: worker not running. `pnpm --filter @story-crawler/worker dev`.
- **No revalidate in public site**: `INTERNAL_REVALIDATE_TOKEN` missing in `.env`. Web won't 403, just won't update ISR.
- **Publish tick spam**: stop worker → run `BullMQ` cleanup or `pnpm compose:down -v`.
