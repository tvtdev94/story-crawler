---
phase: 02
title: NextAuth + admin layout + RBAC
status: pending
priority: P0
effort: S
depends: [01]
---

# Phase 02 — Auth + Admin Layout + RBAC

## Context Links
- [plan.md](plan.md)
- [Phase 01](phase-01-bootstrap-monorepo.md)
- [Brainstorm](../reports/brainstorm-260505-2111-tram-tuyen-mvp.md)

## Overview
Cấu hình NextAuth v5 credentials provider, role-based middleware, admin layout (sidebar + topbar), trang login.

## Key Insights
- NextAuth v5 chuẩn hóa qua `auth.ts` config, dùng JWT session (không cần adapter DB cho session).
- Middleware Next.js bảo vệ `/admin/*` (trừ `/admin/login`).
- Password hash bcrypt, validate bằng Zod.
- RBAC qua role claim trong JWT, server-side check helper `requireRole()`.

## Requirements
**Functional:** login form, logout, session persistence, role guard server + client.
**Non-functional:** session secure (httpOnly cookie), password min 8 chars, brute-force tolerance basic (rate limit phase 2).

## Architecture
```
apps/web/
├── auth.ts                             # NextAuth config
├── middleware.ts                       # protect /admin
├── lib/auth/
│   ├── require-role.ts                 # server helper
│   └── session.ts                      # client hook
├── app/admin/
│   ├── layout.tsx                      # sidebar + topbar + role guard
│   ├── login/page.tsx                  # login form
│   └── (dashboard)/page.tsx            # placeholder dashboard
```

## Related Code Files
**Create:**
- `apps/web/auth.ts`, `apps/web/middleware.ts`
- `apps/web/lib/auth/{require-role,session,password}.ts`
- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/app/admin/(dashboard)/page.tsx`
- `apps/web/components/admin/{sidebar-nav,topbar,user-menu}.tsx`
- `apps/web/app/api/auth/[...nextauth]/route.ts`

**Modify:**
- `packages/db/src/seed.ts` (seed admin user)
- `apps/web/app/layout.tsx` (SessionProvider)

## Implementation Steps
1. Install `next-auth@beta`, `bcryptjs`, `zod`.
2. `auth.ts`: Credentials provider, lookup user by email, bcrypt compare, return `{id, email, role}`.
3. JWT callback: copy `role` vào token. Session callback: copy `role` vào session.user.
4. `middleware.ts`: redirect `/admin/*` → `/admin/login` nếu không có session; redirect `/admin/login` → `/admin` nếu đã có session.
5. `requireRole(role)`: server helper throws/redirects nếu không match.
6. `apps/web/app/admin/layout.tsx`: kiểm session + render sidebar (Stories, Chapters, Authors, Genres, Sources, Crawl Jobs, Publish Logs) + topbar UserMenu.
7. Login page: shadcn Form + Input + Button, server action calling NextAuth.
8. Seed admin user: bcrypt hash từ `ADMIN_PASSWORD` env, role=ADMIN.
9. Test flow: visit `/admin` chưa login → redirect login → submit → vào dashboard.

## Todo List
- [ ] Install next-auth v5 + bcryptjs + zod
- [ ] auth.ts với Credentials provider
- [ ] middleware.ts protect /admin
- [ ] lib/auth/require-role + session helpers
- [ ] Admin layout (sidebar + topbar) shadcn
- [ ] Login page (form + server action)
- [ ] Seed admin user (bcrypt)
- [ ] RBAC test: ADMIN vs EDITOR access
- [ ] Logout flow

## Success Criteria
- Visit `/admin` chưa login → redirect `/admin/login`.
- Submit đúng credentials → vào `/admin` thấy sidebar + email user.
- Submit sai → error message inline.
- Session persistent qua reload.
- EDITOR không thấy menu User Mgmt + Sources edit.

## Risk Assessment
- **Risk:** NextAuth v5 API beta thay đổi → pin version, đọc release notes.
- **Risk:** Middleware edge runtime không support bcrypt → check session JWT only ở middleware, password compare ở route handler (Node runtime).

## Security Considerations
- bcrypt cost ≥ 10.
- Cookie `httpOnly`, `secure` ở production, `sameSite=lax`.
- KHÔNG log password hoặc full token.
- Zod validate email + password format trước khi gọi auth.

## Next Steps
→ Phase 03 (Domain CRUD).
