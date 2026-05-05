---
phase: 04
title: Public site + reader UX + SEO
status: pending
priority: P0
effort: L
depends: [03]
---

# Phase 04 — Public Site + Reader UX + SEO

## Context Links
- [plan.md](plan.md)
- [Phase 03](phase-03-domain-crud.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Public site mobile-first cho người đọc. Trigger `ui-ux-pro-max` skill để chốt design tokens. Reader page tối ưu trải nghiệm đọc dài, SEO chuẩn.

## Key Insights
- ISR (`revalidate: 60`) cho list/detail pages; on-demand revalidate qua tag khi publish chapter.
- Reader UI = focus mode: sticky chapter nav, font-size selector, dark mode toggle, no ads/no animation phân tâm.
- SEO: server-rendered metadata, structured data (JSON-LD `Book`/`Chapter`), sitemap.xml dynamic, robots.txt.
- Chỉ render chapter có `publishStatus=PUBLISHED`.

## Requirements
**Functional:** home, story list (filter genre/status, search), story detail (chapter list + cover + meta), reader page (chapter content + nav), search results, "mới cập nhật" + "chương mới" sections.
**Non-functional:** mobile-first, Lighthouse mobile P≥90/SEO≥95/A11y≥90, no layout shift, fast TTI.

## Architecture
```
apps/web/app/(public)/
├── layout.tsx                          # public shell (top thin nav, footer)
├── page.tsx                            # home: hero, latest stories, latest chapters
├── truyen/
│   ├── page.tsx                        # story list + filters
│   ├── [slug]/page.tsx                 # story detail + chapter list
│   └── [slug]/chuong-[n]-[chapterSlug]/page.tsx  # reader
├── tim-kiem/page.tsx                   # search results
├── the-loai/[slug]/page.tsx            # filtered by genre
└── sitemap.ts                          # dynamic sitemap

apps/web/components/public/
├── reader/{reader-content,reader-controls,chapter-nav,reading-progress}.tsx
├── story-card.tsx, story-grid.tsx, chapter-list.tsx
├── filter-bar.tsx, search-input.tsx, theme-toggle.tsx
└── seo/{json-ld-book,json-ld-chapter,og-tags}.tsx
```

## Related Code Files
**Create:**
- All files under `apps/web/app/(public)/` and `apps/web/components/public/`
- `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts`
- `apps/web/app/globals.css` (typography tokens)
- `apps/web/lib/public/{queries,format-vi}.ts`
- `apps/web/styles/reader.css` (or Tailwind layer)

**Modify:**
- `apps/web/app/admin/_actions/chapter.ts` — `revalidateTag('story:'+slug)` khi publish.

## Implementation Steps
1. Trigger `ui-ux-pro-max` skill để chốt: color tokens (warm off-white `#FAF8F3`, ink `#1F1B16`, accent `#A0522D`), font pairing (Lora serif body + Inter sans heading), spacing, dark mode tokens.
2. Public shell layout: top thin nav (logo + search icon + theme toggle + menu), footer minimal.
3. **Home**: hero "Trạm Tuyện — nơi mỗi câu chuyện dừng chân" + grid 8 truyện mới cập nhật + list 10 chương mới.
4. **Story list `/truyen`**: filter genre (multi), filter storyStatus, search title, sort (latest/popular—popular phase 2). Page-based pagination.
5. **Story detail `/truyen/[slug]`**: cover, title, author link, description, genres badges, status badge, license badge if non-PUBLIC, chapter list (newest first, paginated).
6. **Reader `/truyen/[slug]/chuong-[n]-[chapterSlug]`**:
   - Server-render content (chỉ nếu `publishStatus=PUBLISHED` && `licenseStatus !== METADATA_ONLY`).
   - `<article>` max-width 680px, line-height 1.75, font-size selector S/M/L (localStorage).
   - Sticky bottom bar: prev / progress / next.
   - Reading progress bar (top), scroll-saved per chapter.
   - 404 nếu không tìm thấy hoặc chương chưa publish.
   - METADATA_ONLY page: hiển thị "Chương này chỉ có metadata, đọc tại nguồn gốc" + sourceUrl link.
7. **Genre page `/the-loai/[slug]`**: list filtered.
8. **Search `/tim-kiem?q=`**: ILIKE title MVP.
9. **SEO**: 
   - `generateMetadata()` cho mỗi page (title, description, OG, Twitter card, canonical).
   - JSON-LD `Book` cho story page, `Chapter` cho reader.
   - `sitemap.ts` query published stories + chapters.
   - `robots.ts` allow.
10. **Loading/empty/error**: skeleton cards, empty illustration, error boundary friendly.
11. Dark mode toggle persist localStorage; `prefers-color-scheme` default.
12. Verify Lighthouse trên mobile preview.

## Todo List
- [ ] Trigger ui-ux-pro-max + chốt tokens
- [ ] Public shell layout + nav + footer
- [ ] Home page (hero + latest + new chapters)
- [ ] Story list + filters + search + pagination
- [ ] Story detail + chapter list paginated
- [ ] Reader page + font-size + dark mode + nav
- [ ] METADATA_ONLY reader fallback
- [ ] Genre page
- [ ] Search page
- [ ] generateMetadata + OG + canonical
- [ ] JSON-LD Book + Chapter
- [ ] sitemap.ts + robots.ts
- [ ] revalidateTag on publish
- [ ] Loading/empty/error states
- [ ] Lighthouse audit pass

## Success Criteria
- Visit `/` thấy hero + truyện mới + chương mới.
- Click truyện → detail → click chương → reader render đẹp mobile.
- Filter genre + status hoạt động.
- Search "dế" → trả kết quả.
- Reader: tăng font size persist; toggle dark mode persist.
- View source page reader → có `<meta>` OG, JSON-LD Chapter.
- `/sitemap.xml` trả URL đầy đủ.
- Lighthouse mobile: P≥90, SEO≥95, A11y≥90.

## Risk Assessment
- **Risk:** Font web load gây CLS → preload + `font-display: swap` + reserve dimensions.
- **Risk:** Reader scroll progress conflict với mobile gestures → throttle, test iOS Safari.
- **Risk:** ISR stale sau publish → on-demand `revalidateTag` ở publish action.
- **Risk:** Slug clash giữa truyện và route → reserved words list (`tim-kiem`, `the-loai`, `admin`).

## Security Considerations
- Render chapter content như plain text (escape) hoặc markdown safe — KHÔNG inject HTML user.
- KHÔNG expose draft/scheduled chapters trong public query (filter `publishStatus=PUBLISHED`).
- KHÔNG expose `sourceUrl` của OWNED content nếu config muốn ẩn (optional, MVP default show).

## Next Steps
→ Phase 05 (Crawler) song song; Phase 06 (Publisher) hoàn thiện vòng lặp.
