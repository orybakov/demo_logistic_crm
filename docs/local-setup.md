# Local Setup

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

## First run

1. Copy the example env files.
2. Start local infrastructure.
3. Prepare the database.
4. Launch API and web apps.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose -f docker/compose.infra.yml up -d
pnpm install
pnpm --filter @logistics-crm/api db:generate
pnpm --filter @logistics-crm/api db:push
pnpm dev
```

## Local URLs

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/v1/docs` when enabled

## Local troubleshooting

- If Prisma fails, verify `DATABASE_URL`.
- If Redis is unavailable, check `docker compose` health.
- If auth fails, re-seed or verify seeded users.
