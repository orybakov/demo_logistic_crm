# Deployment Guide

## Target setup

- PostgreSQL 16
- Redis 7
- API: NestJS app behind a reverse proxy
- Web: Next.js app behind the same proxy or separate host

## Pre-deploy inputs

- `apps/api/.env.production`
- `apps/web/.env.production`
- Database credentials and backups enabled
- TLS certificates and DNS records ready

## Build and release flow

1. Pull the target release tag or commit.
2. Install dependencies with `pnpm install`.
3. Build all packages with `pnpm build`.
4. Run database migrations in production mode.
5. Deploy API and web artifacts.
6. Run smoke checks against `/api/v1/health`, `/api/v1/health/ready`, and `/api/v1/health/metrics`.

## Recommended runtime steps

```bash
pnpm install
pnpm build
pnpm --filter @logistics-crm/api exec prisma migrate deploy --schema=./src/database/prisma/schema.prisma
pnpm --filter @logistics-crm/api start:prod
pnpm --filter @logistics-crm/web start
```

## Container option

- Use `docker compose -f docker/compose.yml` for local staging-like runs.
- For production, build dedicated images and run them behind a reverse proxy.
- Keep infrastructure services separate from app containers when possible.

## Post-deploy validation

- Login with a seeded admin account.
- Open KPI and admin pages.
- Upload and download a test document.
- Check metrics and readiness endpoints.
