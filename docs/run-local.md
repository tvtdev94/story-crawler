# Run Local

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`corepack enable`)
- Docker Desktop (for Postgres + Redis)

## Setup

```bash
git clone https://github.com/tvtdev94/story-crawler.git
cd story-crawler

cp .env.example .env
# (Optional) generate fresh secrets:
node -e "console.log('AUTH_SECRET='+require('crypto').randomBytes(32).toString('base64'))" >> .env
node -e "console.log('INTERNAL_TOKEN='+require('crypto').randomBytes(32).toString('hex'))" >> .env

pnpm install
pnpm compose:up           # postgres + redis
pnpm db:migrate           # init schema (first time only)
pnpm db:seed              # admin/editor users + 1 sample story
pnpm dev                  # web (3000) + worker — HMR
```

## Default credentials

From `.env`:
- Admin: `admin@tramtuyen.local` / `changeme123`
- Editor: `editor@tramtuyen.local` / `changeme123`

## URLs

- Public site: <http://localhost:3000>
- Admin login: <http://localhost:3000/admin/login>

## Common Commands

```bash
pnpm typecheck            # workspace-wide TS check
pnpm test                 # vitest (core unit tests)
pnpm db:studio            # Prisma Studio
pnpm compose:logs         # tail postgres + redis
pnpm compose:down         # stop containers (data preserved)
```

## Troubleshooting

- **Prisma migration timeout / advisory lock**: kill stale node processes (`taskkill //F //IM node.exe`), wait 2s, retry.
- **CSS not loading after `next start`**: ensure `next build` ran (creates `.next/static/css/`); check no stale dev server on port 3000.
- **Worker can't reach Redis**: verify `pnpm compose:up` shows `redis (healthy)`.
- **Login redirects loop**: verify `.env` has `AUTH_SECRET` (not just `NEXTAUTH_SECRET`).
