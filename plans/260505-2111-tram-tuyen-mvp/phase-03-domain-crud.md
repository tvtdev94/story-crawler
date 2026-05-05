---
phase: 03
title: Domain CRUD admin (Stories, Chapters, Authors, Genres)
status: pending
priority: P0
effort: L
depends: [02]
---

# Phase 03 — Domain CRUD Admin

## Context Links
- [plan.md](plan.md)
- [Phase 02](phase-02-auth-rbac.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
CRUD đầy đủ cho 4 entity chính trong admin: Stories, Chapters, Authors, Genres. Có data table (filter/search/pagination), forms (create/edit), confirm delete.

## Key Insights
- Server Actions cho mutation, Route Handlers cho queries phức tạp/SSR boundary.
- Zod schema dùng chung cho validate FE + BE (defined in `packages/core/schemas`).
- Slug auto-generate từ title (Vietnamese-aware) — cho phép edit thủ công.
- Chapter editor MVP dùng textarea + plain text; rich editor để phase 2.
- Pagination cursor hoặc page-based — chọn page-based đơn giản với `?page=1&limit=20`.

## Requirements
**Functional:** list/create/edit/delete cho mỗi entity; filter Story by status/license; search Story by title; filter Chapter by story + publishStatus; manage many-to-many Story↔Genre.
**Non-functional:** form validation client + server, optimistic UI optional, loading/empty/error states.

## Architecture
```
apps/web/app/admin/
├── stories/
│   ├── page.tsx                    # list + filters + pagination
│   ├── new/page.tsx
│   ├── [id]/edit/page.tsx
│   └── [id]/chapters/page.tsx     # chapters under story
├── chapters/
│   ├── page.tsx                    # all chapters w/ filters
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx
├── authors/page.tsx + [id]/edit
├── genres/page.tsx + [id]/edit
└── _actions/                       # server actions
    ├── story.ts
    ├── chapter.ts
    ├── author.ts
    └── genre.ts

packages/core/src/schemas/
├── story.ts                        # Zod schemas
├── chapter.ts
├── author.ts
└── genre.ts
```

## Related Code Files
**Create:**
- `packages/core/src/schemas/{story,chapter,author,genre}.ts`
- `apps/web/app/admin/stories/{page,new/page,[id]/edit/page,[id]/chapters/page}.tsx`
- `apps/web/app/admin/chapters/{page,new/page,[id]/edit/page}.tsx`
- `apps/web/app/admin/authors/{page,new/page,[id]/edit/page}.tsx`
- `apps/web/app/admin/genres/{page,new/page,[id]/edit/page}.tsx`
- `apps/web/app/admin/_actions/{story,chapter,author,genre}.ts`
- `apps/web/components/admin/{data-table,status-badge,confirm-dialog,pagination,filter-bar}.tsx`
- `apps/web/components/admin/forms/{story-form,chapter-form,author-form,genre-form}.tsx`

## Implementation Steps
1. Define Zod schemas in `packages/core/src/schemas` (sync với Prisma enums).
2. Build reusable shadcn `DataTable` (Tanstack Table) wrapper với pagination + filter slots.
3. `StatusBadge` component map enum → color (PENDING_REVIEW=amber, SCHEDULED=blue, PUBLISHED=green, FAILED=red, DRAFT=slate).
4. Build `ConfirmDialog` (shadcn AlertDialog) cho destructive actions; for Story delete → type-to-confirm slug.
5. **Authors CRUD**: simple list (name, slug), create/edit/delete. Slug auto từ name nếu trống.
6. **Genres CRUD**: simple list (name, slug), create/edit/delete.
7. **Stories CRUD**:
   - List: cols [cover thumb, title, author, status, license, updatedAt], filters [status, license, search title], pagination 20/page.
   - Form fields: title, slug (auto+editable), authorId (select), description (textarea), coverUrl, storyStatus, licenseStatus, sourceUrl, genres (multi-select).
   - Delete: type-to-confirm slug, cascade chapters (Prisma).
8. **Chapters CRUD**:
   - List ALL chapters: cols [story, number, title, publishStatus, scheduledAt, publishedAt], filters [storyId, publishStatus], pagination.
   - Per-story view at `/admin/stories/[id]/chapters`.
   - Form fields: storyId (select if from /chapters), number, title, slug, content (textarea — disable nếu story.licenseStatus=METADATA_ONLY với hint), sourceUrl.
   - Auto compute `contentHash` on save.
9. Loading state: `loading.tsx` per route. Empty state: friendly empty card. Error state: `error.tsx` boundary.
10. EDITOR role: ẩn delete button cho Authors/Genres (chỉ ADMIN).

## Todo List
- [ ] Zod schemas (story/chapter/author/genre)
- [ ] DataTable shadcn wrapper + pagination + filter
- [ ] StatusBadge component
- [ ] ConfirmDialog (incl. type-to-confirm)
- [ ] Authors CRUD (list/form/actions)
- [ ] Genres CRUD (list/form/actions)
- [ ] Stories list + filters + search + pagination
- [ ] Stories form (create/edit) + multi-select genres
- [ ] Stories delete (cascade + confirm)
- [ ] Chapters list + filters + pagination
- [ ] Chapters form (incl. METADATA_ONLY guard)
- [ ] contentHash auto-compute on save
- [ ] loading.tsx + empty + error.tsx
- [ ] RBAC visibility on actions

## Success Criteria
- Tạo author "Tô Hoài" → tạo genre "Thiếu nhi" → tạo story "Dế mèn phiêu lưu ký" linked → tạo chapter 1 với content → list/edit/delete đều hoạt động.
- Filter stories by `licenseStatus=PUBLIC_DOMAIN` trả đúng.
- Search "dế mèn" tìm thấy.
- Pagination 20/page hoạt động.
- Chapter có cùng (storyId, number) → reject với error rõ.
- METADATA_ONLY story → form chapter ẩn/disable content field với hint.

## Risk Assessment
- **Risk:** Slug Vietnamese collision → unique constraint catch + error UI gợi ý slug khác.
- **Risk:** Cascade delete vô tình mất data → type-to-confirm slug + show count chapters before delete.
- **Risk:** Form state lớn (genres multi-select) → react-hook-form + Zod resolver.

## Security Considerations
- Server action validate session + role TRƯỚC mutation.
- Zod parse input — reject extra fields.
- Sanitize HTML khi render description (MVP textarea plain text, escape on render).
- Content field giới hạn size (vd 500KB) tránh abuse.

## Next Steps
→ Phase 04 (Public site) song song với Phase 05 (Crawler).
