# Migrations Guide

## Standard workflow

1. Update `apps/api/src/database/prisma/schema.prisma`.
2. Create a migration locally.
3. Review SQL output.
4. Regenerate the Prisma client.
5. Run tests.

```bash
pnpm --filter @logistics-crm/api db:migrate
pnpm --filter @logistics-crm/api db:generate
pnpm --filter @logistics-crm/api test
```

## Production workflow

- Use `prisma migrate deploy` in production.
- Never use `migrate dev` against production data.
- Back up the database before schema changes.

```bash
pnpm --filter @logistics-crm/api exec prisma migrate deploy --schema=./src/database/prisma/schema.prisma
```

## Safe migration rules

- Add columns as nullable first when possible.
- Backfill data before making columns required.
- Avoid destructive drops in the first release.
- Use forward-only fixes for incidents when feasible.
