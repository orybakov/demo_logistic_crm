# Developer Guide

## Repo layout

- `apps/api` - NestJS backend
- `apps/web` - Next.js frontend
- `packages/shared` - shared types and constants
- `docs` - product, architecture, and release docs

## Common workflow

1. Copy local env files from the examples.
2. Start PostgreSQL and Redis.
3. Generate Prisma client if schema changed.
4. Run the app in dev mode.
5. Keep tests green before merging.

## Useful commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## Backend commands

```bash
pnpm --filter @logistics-crm/api db:generate
pnpm --filter @logistics-crm/api db:push
pnpm --filter @logistics-crm/api db:migrate
pnpm --filter @logistics-crm/api test
```

## Frontend commands

```bash
pnpm --filter @logistics-crm/web dev
pnpm --filter @logistics-crm/web build
pnpm --filter @logistics-crm/web test
```

## Branching notes

- Keep changes focused and small.
- Add tests with behavior changes.
- Do not commit secrets or local env files.
- Prefer backward-compatible schema changes.
