# Crawler Demo

## Adapters Shipped

| Key | License Mode | Behavior |
|---|---|---|
| `mock-fixture` | MOCK | 5 stories × 3 chapters từ JSON local. Content lưu DB. |
| `gutenberg-vi` | FULL | 1 truyện public-domain (trích Truyện Kiều). Content lưu DB. |
| `metadata-only-demo` | METADATA_ONLY | 1 truyện + 3 chương. **Content luôn bị strip → null.** |

## Run Crawl from Admin

1. Login `/admin` (admin role).
2. Vào `/admin/sources`. Seed đã tạo sẵn 3 nguồn.
3. Bấm **Run** trên hàng `mock-fixture` → enqueue BullMQ job.
4. Worker xử lý ngay (tail `pnpm dev` log).
5. Vào `/admin/crawl-jobs` → status `SUCCESS`, items found/new đúng.
6. Vào `/admin/review` → 15 chương `PENDING_REVIEW`.

## License Enforcement (Critical)

Single chokepoint: `apps/worker/src/services/save-crawled.ts` → `applyLicensePolicy()` from `@story-crawler/core`.

| Source `licenseMode` | Chapter `content` | `licenseStatus` set |
|---|---|---|
| `FULL` | kept | `PUBLIC_DOMAIN` (or preferred) |
| `MOCK` | kept | `PUBLIC_DOMAIN` |
| `METADATA_ONLY` | **null** (forced) | `METADATA_ONLY` |

Verify after running both `mock-fixture` and `metadata-only-demo`:

```sql
SELECT s."adapterKey", st."licenseStatus", (c.content IS NULL) AS content_null
FROM "Chapter" c
JOIN "Story" st ON st.id = c."storyId"
JOIN "Source" s ON s.id = st."sourceId";
```

`metadata-only-demo` rows MUST have `content_null = t`. Unit-tested in `packages/core/__tests__/license-guard.test.ts` (5 cases).

## Idempotency

Re-running same source: `itemsNew = 0`. Dedupe checks:
1. `(storyId, number)` unique → skip same chapter number.
2. `(storyId, contentHash)` unique → skip identical content even if number differs.

Content hash uses `sha256Normalized` (trim + collapse whitespace + lowercase) so cosmetic re-formats don't bypass dedupe.
