# Logistics CRM

Enterprise logistics management system with Next.js frontend and NestJS backend.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, Radix UI
- **Backend**: NestJS 10, Prisma ORM, PostgreSQL 16
- **Cache/Queue**: Redis 7, BullMQ
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Project Structure

```
.
├── apps/
│   ├── api/          # NestJS backend
│   │   └── src/
│   │       ├── modules/     # Feature modules
│   │       ├── config/     # Configuration
│   │       └── database/    # Prisma schema
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/         # App router pages
│           ├── components/  # React components
│           └── lib/        # Utilities
├── packages/
│   ├── shared/      # Shared types and constants
│   └── config/      # ESLint, Prettier, TSConfig
├── docker/          # Docker compose files
├── docs/            # Documentation
└── .github/         # CI/CD workflows
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for local development)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

4. Start infrastructure (PostgreSQL, Redis):

```bash
docker compose -f docker/compose.infra.yml up -d
```

5. Generate Prisma client and push schema:

```bash
pnpm --filter @logistics-crm/api db:generate
pnpm --filter @logistics-crm/api db:push
```

6. Start development servers:

```bash
pnpm dev
```

### Using Docker

Start all services:

```bash
docker compose -f docker/compose.yml up -d
```

## Scripts

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Start all apps in development mode |
| `pnpm build`     | Build all apps                     |
| `pnpm lint`      | Run ESLint                         |
| `pnpm typecheck` | Run TypeScript type checking       |
| `pnpm test`      | Run tests                          |

### API Scripts

| Command                                        | Description             |
| ---------------------------------------------- | ----------------------- |
| `pnpm --filter @logistics-crm/api db:generate` | Generate Prisma client  |
| `pnpm --filter @logistics-crm/api db:push`     | Push schema to database |
| `pnpm --filter @logistics-crm/api db:migrate`  | Run migrations          |
| `pnpm --filter @logistics-crm/api db:studio`   | Open Prisma Studio      |

## Environment Variables

### API (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logistics_crm
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
STRUCTURED_LOGS=true
REQUEST_LOGGING=true
METRICS_ENABLED=true
AUDIT_HTTP_REQUESTS=false
ENABLE_SWAGGER=false
ERROR_TRACKING_ENABLED=false
ERROR_TRACKING_WEBHOOK_URL=
```

### Web (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## API Documentation

API documentation is available at `http://localhost:3001/api/v1/docs` when `ENABLE_SWAGGER=true` (enabled by default outside production).

## Operations

- Health: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready`
- Liveness: `GET /api/v1/health/live`
- Metrics: `GET /api/v1/health/metrics`
- Ops guide: `docs/operations.md`

## Release Docs

- Deployment: `docs/deployment.md`
- Release checklist: `docs/release-checklist.md`
- Rollback checklist: `docs/rollback-checklist.md`
- Developer guide: `docs/developer-guide.md`
- Local setup: `docs/local-setup.md`
- Migrations: `docs/migrations.md`
- Changelog: `docs/changelog.md`

## Features

- [ ] User authentication with JWT
- [ ] Role-based access control (RBAC)
- [ ] Client management
- [ ] Request management
- [ ] Trip planning and tracking
- [ ] Vehicle management
- [ ] Driver management
- [ ] Order processing
- [ ] Payment tracking
- [ ] Real-time notifications
- [ ] Reporting and analytics

## License

Private - All rights reserved
