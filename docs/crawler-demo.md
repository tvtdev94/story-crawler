# Crawler Demo

## Two-phase Flow (since 2026-05-06)

```
Refresh nguồn ──▶ discover-job  ──▶ DiscoveredItem stubs (DISCOVERED)
                                         │
                                         ▼
                              Editor approves @ /admin/discovered
                                         │
                                         ▼
                  enqueueFetch (DISCOVERED → QUEUED)
                                         │
                                         ▼
                              fetch-job (license chokepoint)
                                         │
                                         ▼
                       Chapter PENDING_REVIEW + DiscoveredItem FETCHED
                                         │
                                         ▼
                              /admin/review → schedule → publish
```

## Adapters Shipped

| Key | License Mode | Behavior |
|---|---|---|
| `mock-fixture` | MOCK | 5 stories × 3 chapters từ JSON local. Content lưu DB. |
| `gutenberg-vi` | FULL | 1 truyện public-domain (trích Truyện Kiều). Content lưu DB. |
| `metadata-only-demo` | METADATA_ONLY | 1 truyện + 3 chương. **Content luôn bị strip → null.** |

## Run Crawl from Admin

1. Login `/admin` (admin role).
2. Vào `/admin/sources`. Seed đã tạo sẵn 3 nguồn.
3. Bấm **Refresh** trên hàng `mock-fixture` → enqueue discover-job.
4. Worker xử lý → tạo `DiscoveredItem` stubs (KHÔNG có Chapter mới).
5. Vào `/admin/discovered?status=DISCOVERED` → 15 dòng stub.
6. Tick 3 dòng → **Fetch nội dung** → enqueue fetch-job per item.
7. Worker fetch xong → `/admin/discovered?status=FETCHED` + `/admin/review` có 3 chương `PENDING_REVIEW`.
8. Bỏ qua/Khôi phục dòng tại tab SKIPPED. Retry tại tab FAILED.

## Auto-refresh per Source

- Trong form nguồn, set "Tự động làm mới" = `1h | 3h | 6h | 12h | 24h | 168h | Tắt`.
- Worker poll `Source` mỗi 5 phút (`syncRepeatables()`) → đăng ký BullMQ repeatable `discover:{sourceId}` với `every = hours * 3600 * 1000`.
- Tắt → worker remove repeatable.

## License Enforcement (Critical)

Chokepoint duy nhất: `apps/worker/src/services/fetch-item.ts` → `applyLicensePolicy()` từ `@story-crawler/core`. Discover-job KHÔNG chạm content.

| Source `licenseMode` | Adapter call | Chapter `content` | `licenseStatus` |
|---|---|---|---|
| `FULL` | yes | kept | `PUBLIC_DOMAIN` (or preferred) |
| `MOCK` | yes | kept | `PUBLIC_DOMAIN` |
| `METADATA_ONLY` | **skipped** | **null** (forced) | `METADATA_ONLY` |

Verify after fetching:

```sql
SELECT s."adapterKey", st."licenseStatus", (c.content IS NULL) AS content_null
FROM "Chapter" c
JOIN "Story" st ON st.id = c."storyId"
JOIN "Source" s ON s.id = st."sourceId";
```

`metadata-only-demo` rows MUST have `content_null = t`. Tests:
- `packages/core/__tests__/license-guard.test.ts` (5 cases — pure)
- `apps/worker/__tests__/fetch-item.test.ts` (FULL/MOCK/METADATA_ONLY/idempotency guard)

## Idempotency

- Re-running discover: `DiscoveredItem.createMany({skipDuplicates:true})` qua UNIQUE `(sourceId, externalId)` → `itemsNew = 0`.
- Re-running fetch on same item: state guard checks `status = QUEUED` → return early.
- Chapter dedupe by `(storyId, contentHash)` (sha256 normalized).

Tested:
- `apps/worker/__tests__/save-discovered.test.ts` (insert + idempotent re-run).
