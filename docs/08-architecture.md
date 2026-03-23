# Architecture Decision Document
## Логистическая CRM — Enterprise Web Application

**Версия:** 1.0  
**Статус:** Draft  
**Дата:** 20.03.2026  
**Документ:** ADD-001

---

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Approach](#4-database-approach)
5. [Auth и RBAC Implementation](#5-auth-и-rbac-implementation)
6. [Notifications and Background Jobs](#6-notifications-and-background-jobs)
7. [Audit Log](#7-audit-log)
8. [File Storage](#8-file-storage)
9. [Observability](#9-observability)
10. [Deployment Model](#10-deployment-model)
11. [Testing Strategy](#11-testing-strategy)
12. [MVP vs Target Architecture](#12-mvp-vs-target-architecture)
13. [Risk Assessment](#13-risk-assessment)

---

## 1. Обзор архитектуры

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOGISTICS CRM — HIGH-LEVEL ARCHITECTURE               │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                              CLIENTS                                      │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
    │  │ Web App   │  │Mobile App│  │ Partner  │  │ External │              │
    │  │ (Next.js) │  │ (React)  │  │ Portal   │  │   API    │              │
    │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
    └────────┼────────────┼────────────┼────────────┼────────────────────────┘
             │            │            │            │
             └────────────┴─────┬──────┴────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          EDGE / CDN LAYER                                │
    │  ┌─────────────────────────────────────────────────────────────────┐     │
    │  │ Cloudflare / CloudFront / Cloud DNS                            │     │
    │  │ • DDoS Protection    • SSL Termination   • Edge Caching       │     │
    │  └─────────────────────────────────────────────────────────────────┘     │
    └─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          API GATEWAY                                    │
    │  ┌─────────────────────────────────────────────────────────────────┐     │
    │  │ • Authentication    • Rate Limiting      • Request Routing     │     │
    │  │ • Logging          • Load Balancing      • Circuit Breaker    │     │
    │  └─────────────────────────────────────────────────────────────────┘     │
    └─────────────────────────────────────────────────────────────────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                         │
            ▼                                         ▼
┌───────────────────────┐                 ┌───────────────────────┐
│     BACKEND API       │                 │     BACKEND API       │
│     (NestJS #1)       │                 │     (NestJS #2)       │
│     Primary Region    │                 │     DR Region         │
└───────────┬───────────┘                 └───────────┬───────────┘
            │                                         │
            └────────────────────┬────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           DATA LAYER                                    │
    │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
    │  │ PostgreSQL │  │   Redis    │  │Meilisearch │  │    S3      │      │
    │  │  Primary + │  │   Cache +  │  │Full-text   │  │   Files    │      │
    │  │  Replica   │  │   Queue    │  │   Search    │  │            │      │
    │  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
    └─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        BACKGROUND PROCESSING                             │
    │  ┌─────────────────────────────────────────────────────────────────┐     │
    │  │ • BullMQ (Redis-based)   • Scheduler Jobs   • Email Queue    │     │
    │  └─────────────────────────────────────────────────────────────────┘     │
    └─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

| Принцип | Описание | Применение |
|---------|----------|------------|
| **Domain-Driven Design** | Бизнес-логика изолирована в доменах | Все backend модули |
| **Microservices-ready** | Готовность к разделению сервисов | API design, database |
| **Event Sourcing** | Для критичных операций | Audit, notifications |
| **CQRS** | Разделение чтения и записи | Analytics, reporting |
| **Cloud-Native** | Использование облачных сервисов | All components |

### 1.3 Non-Functional Requirements

| Требование | Целевое значение | Метрика |
|------------|-------------------|----------|
| **Availability** | 99.9% | ~8.7 часов downtime/год |
| **Response Time (p95)** | < 500ms | API endpoints |
| **Response Time (p99)** | < 1s | API endpoints |
| **Throughput** | 1000 req/sec | Peak load |
| **Scalability** | Horizontal + Vertical | Auto-scaling |
| **Recovery Time** | < 15 min | RTO |
| **Recovery Point** | < 1 hour | RPO |

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Layer | Technology | Version | Обоснование |
|-------|------------|---------|-------------|
| **Framework** | Next.js | 14+ | SSR/SSG, App Router, TypeScript |
| **UI Library** | Radix UI + Tailwind | Latest | Headless, accessible, customizable |
| **State Management** | Zustand | 4+ | Lightweight, performant |
| **Server State** | TanStack Query | 5+ | Caching, invalidation |
| **Forms** | React Hook Form + Zod | Latest | Schema validation |
| **Routing** | Next.js App Router | 14+ | File-based, layouts |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, JIT |
| **Charts** | Recharts | Latest | Enterprise charts |
| **Tables** | TanStack Table | 8+ | Full control |

### 2.2 Application Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND ARCHITECTURE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

apps/web/
├── src/
│   ├── app/                          # App Router (Next.js 14+)
│   │   ├── (auth)/                   # Auth group routes
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/              # Dashboard group routes
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── requests/
│   │   │   ├── trips/
│   │   │   └── settings/
│   │   ├── api/                      # API routes (if needed)
│   │   └── layout.tsx               # Root layout
│   │
│   ├── components/                   # Shared components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── forms/                    # Form components
│   │   ├── tables/                   # Table components
│   │   └── layout/                   # Layout components
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── use-requests.ts
│   │   ├── use-permissions.ts
│   │   └── ...
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # API client (axios/fetch wrapper)
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── utils.ts                  # Helper functions
│   │   └── validators.ts             # Zod schemas
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── filters-store.ts
│   │
│   ├── types/                        # Shared types
│   │   └── api.ts                    # API types (generated)
│   │
│   └── styles/                       # Global styles
│       └── globals.css
│
├── public/                            # Static assets
├── next.config.js                     # Next.js config
├── tailwind.config.ts                 # Tailwind config
├── tsconfig.json                      # TypeScript config
└── package.json
```

### 2.3 State Management Architecture

| Store | Управляет | Persistence | Синхронизация |
|-------|-----------|--------------|---------------|
| AuthStore | User session, token | localStorage | On mount |
| UIStore | Sidebar state, modals | memory | — |
| FiltersStore | Table filters, pagination | URL params | On change |
| RequestsStore | Requests list (cache) | TanStack Query | Server sync |

### 2.4 Key Architectural Decisions

| Решение | Альтернативы | Обоснование |
|---------|-------------|-------------|
| Next.js App Router | Pages Router, CRA | SSR/SSG, layouts, better DX |
| TanStack Query | SWR, Redux RTK | Better caching, devtools |
| Zod + React Hook Form | Pure React Hook Form | Schema validation, inference |
| Radix UI + Tailwind | MUI, Ant Design | Full customization, smaller bundle |

### 2.5 Performance Optimizations

| Техника | Применение | Ожидаемый эффект |
|---------|-----------|------------------|
| SSR/SSG | Dashboard, public pages | FCP < 1.5s |
| Image optimization | Next.js Image | LCP optimization |
| Code splitting | Dynamic imports | Bundle size reduction |
| Route prefetching | Next.js Link | Faster navigation |
| SWR strategy | TanStack Query | Reduced server load |

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Layer | Technology | Version | Обоснование |
|-------|------------|---------|-------------|
| **Runtime** | Node.js | 20 LTS | Stable, async/await, npm ecosystem |
| **Framework** | NestJS | 10+ | DI, modules, enterprise patterns |
| **API** | REST + tRPC | Latest | REST for external, tRPC for internal |
| **ORM** | Prisma | 5+ | Type-safe, migrations, studio |
| **Validation** | class-validator + Zod | Latest | DTO validation |
| **Logging** | Pino | Latest | Structured JSON logs |
| **Queue** | BullMQ | Latest | Redis-based, reliable |

### 3.2 Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND MODULE ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

apps/api/src/
├── main.ts                          # Application bootstrap
├── app.module.ts                    # Root module
│
├── common/                          # Shared functionality
│   ├── decorators/                  # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   ├── permissions.decorator.ts
│   │   └── ...
│   ├── filters/                    # Exception filters
│   │   ├── http-exception.filter.ts
│   │   └── ...
│   ├── guards/                     # Guards
│   │   ├── auth.guard.ts
│   │   ├── permissions.guard.ts
│   │   └── ...
│   ├── interceptors/               # Interceptors
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── ...
│   ├── pipes/                      # Validation pipes
│   │   └── validation.pipe.ts
│   └── interfaces/                 # Shared interfaces
│
├── config/                          # Configuration
│   ├── configuration.ts            # Config loader
│   ├── env.validation.ts           # Zod schemas
│   └── database.config.ts
│
├── modules/                         # Feature modules
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/             # Passport strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   └── dto/
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │
│   ├── requests/
│   │   ├── requests.module.ts
│   │   ├── requests.controller.ts
│   │   ├── requests.service.ts
│   │   ├── requests.repository.ts  # Data access
│   │   └── dto/
│   │
│   ├── orders/
│   ├── trips/
│   ├── clients/
│   ├── vehicles/
│   ├── drivers/
│   ├── notifications/
│   ├── reports/
│   └── admin/
│
└── database/
    ├── prisma/
    │   ├── schema.prisma           # Database schema
    │   └── migrations/             # Prisma migrations
    └── seeders/                    # Database seeders
```

### 3.3 Service Layer Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER PATTERN                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Controller   │───▶│   Service    │───▶│ Repository   │
│               │    │              │    │              │
│ • Validation  │    │ • Business   │    │ • Data access│
│ • Auth check │    │   Logic      │    │ • Queries    │
│ • Response    │    │ • Orchestr.  │    │ • Prisma     │
│ • Mapping     │    │ • Events     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Domain     │
                    │   Events     │
                    └──────────────┘
```

### 3.4 Key Architectural Decisions

| Решение | Альтернативы | Обоснование |
|---------|-------------|-------------|
| NestJS | Express, Fastify, plain Node | Enterprise patterns, DI, modules |
| Prisma | TypeORM, Drizzle, raw SQL | Type-safe, migrations, DX |
| BullMQ | RabbitMQ, Kafka | Redis-based, simpler ops |
| Pino | Winston | Faster, structured logs |
| Passport.js | CASL, custom | Mature, many strategies |

### 3.5 API Design Principles

| Принцип | Применение |
|---------|-----------|
| REST compliance | Proper HTTP methods, status codes |
| Versioning | URL-based (`/api/v1/`) |
| Idempotency | PUT/PATCH are idempotent |
| Pagination | Offset-based by default, cursor optional |
| Error format | RFC 7807 Problem Details |
| Content negotiation | JSON only (MVP) |

---

## 4. Database Approach

### 4.1 Technology Selection

| Component | Technology | Обоснование |
|-----------|------------|-------------|
| **Primary DB** | PostgreSQL 16 | ACID, JSONB, PostGIS-ready |
| **ORM** | Prisma | Type-safe, migrations, studio |
| **Cache** | Redis 7 | Sessions, rate limiting, cache |
| **Search** | Meilisearch | Fast full-text search |
| **Backup** | pg_dump + S3 | Point-in-time recovery |

### 4.2 Database Schema Organization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA ORGANIZATION                             │
└─────────────────────────────────────────────────────────────────────────────────┘

public schema
│
├── Core entities
│   ├── requests
│   ├── orders
│   ├── trips
│   ├── clients
│   ├── vehicles
│   └── drivers
│
├── Reference tables
│   ├── users
│   ├── roles
│   ├── permissions
│   ├── locations
│   ├── cargo_types
│   └── regions
│
├── Audit tables
│   ├── audit_log
│   ├── request_status_history
│   ├── trip_status_history
│   └── ...
│
├── Notification tables
│   ├── notifications
│   └── notification_settings
│
├── Configuration tables
│   ├── system_settings
│   └── feature_flags
│
└── Extensions
    ├── pgcrypto (for UUID generation)
    └── btree_gin (for JSONB indexing)
```

### 4.3 Indexing Strategy

| Table | Index Type | Columns | Purpose |
|-------|------------|---------|---------|
| requests | B-tree | `status` | Filter by status |
| requests | B-tree | `client_id` | Filter by client |
| requests | B-tree | `assigned_to` | Filter by user |
| requests | B-tree | `created_at` | Sorting |
| requests | GIN | `flags` (JSONB) | Flag filtering |
| requests | Composite | `status, created_at` | Common query |
| trips | B-tree | `driver_id, status` | Active trips |
| trips | B-tree | `vehicle_id, status` | Vehicle assignment |
| audit_log | B-tree | `entity_type, entity_id` | Audit queries |
| audit_log | B-tree | `user_id, created_at` | User activity |

### 4.4 Key Decisions

| Решение | Альтернативы | Обоснование |
|---------|-------------|-------------|
| PostgreSQL | MySQL, MongoDB | JSONB flexibility, PostGIS |
| Prisma ORM | TypeORM, raw SQL | Type safety, migrations |
| UUID PKs | Auto-increment | Distributed generation |
| JSONB for flags | Separate table | Flexibility, queries |
| Soft delete | Hard delete | Data recovery, audit |

### 4.5 Data Migration Strategy

| Phase | Approach | Tool |
|-------|----------|------|
| Development | Prisma Migrate | `prisma migrate dev` |
| Staging | Prisma Migrate | `prisma migrate deploy` |
| Production | Prisma Migrate + Shadow DB | Zero-downtime migrations |

---

## 5. Auth и RBAC Implementation

### 5.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐                           ┌──────────┐
│  Client   │                           │   Auth   │
└─────┬────┘                           └────┬─────┘
      │                                      │
      │  1. POST /auth/login                 │
      │     {email, password}                │
      │ ──────────────────────────────────▶│
      │                                      │
      │                                      │  2. Validate credentials
      │                                      │  3. Generate JWT + Refresh Token
      │                                      │  4. Store session in Redis
      │                                      │
      │  5. {access_token, refresh_token}   │
      │ ◀───────────────────────────────────│
      │                                      │
      │  6. GET /requests                    │
      │     Authorization: Bearer <token>    │
      │ ──────────────────────────────────▶│
      │                                      │
      │                                      │  7. Validate JWT
      │                                      │  8. Check Redis session
      │                                      │  9. Load permissions
      │                                      │
      │  10. Response                        │
      │ ◀───────────────────────────────────│
```

### 5.2 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@company.ru",
  "iat": 1679318400,
  "exp": 1679322000,
  "iss": "https://crm.logistics",
  "aud": "crm-api",
  "roles": ["DISPATCHER"],
  "filial_id": "filial-uuid",
  "scope": "FILIAL"
}
```

### 5.3 RBAC Implementation

| Component | Implementation | Storage |
|-----------|---------------|---------|
| Roles | Predefined enums | DB + JWT claims |
| Permissions | Permission codes | DB + JWT claims |
| Scope | FILIAL/REGION/SYSTEM | JWT claim |
| Enforcement | Guard + Decorators | NestJS |
| Caching | JWT claims + Redis | 15 min TTL |

### 5.4 Permission Enforcement

```typescript
// Decorator-based approach
@RequirePermission('requests.create')
async create(@Body() dto: CreateRequestDto) {}

// Guard-based approach
@UseGuards(PermissionsGuard)
@RequirePermissions(['requests.read', 'requests.update'])
async update() {}

// Service-level
const canDelete = await this.rbacService.canDelete(user, request);
```

---

## 6. Notifications and Background Jobs

### 6.1 Notification Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐                           ┌──────────────┐
│   Domain     │                           │Notification  │
│   Service    │                           │   Service    │
└──────┬───────┘                           └──────┬───────┘
       │                                        │
       │  emit Event                           │
       ▼                                        ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Event Emitter │───▶│Event Handler│───▶│Notification  │
│  (NestJS)   │    │             │    │  Repository  │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌──────────────┐
                     │ Notification │      │Email Service │
                     │   Producer  │───▶│  (BullMQ)   │
                     └──────────────┘      └──────┬───────┘
                                                  │
                     ┌──────────────┐            │
                     │   Email      │            │
                     │   Worker     │◀───────────┘
                     └──────────────┘
```

### 6.2 Notification Channels

| Channel | Implementation | Use Case |
|---------|---------------|----------|
| In-App | Database + SSE/WebSocket | Real-time notifications |
| Email | BullMQ + Nodemailer/SendGrid | Important events |
| SMS | BullMQ + Twilio (future) | Critical alerts |
| Push | Web Push API (future) | Mobile |

### 6.3 Background Jobs

| Job Type | Implementation | Queue | SLA |
|----------|---------------|-------|-----|
| Email sending | BullMQ | `notifications` | 5 min |
| Report generation | BullMQ | `reports` | 30 min |
| Data export | BullMQ | `exports` | 15 min |
| Scheduled reports | NestJS Scheduler | `scheduler` | On time |
| Cleanup jobs | NestJS Scheduler | `maintenance` | Off-peak |
| Cache warmup | NestJS Scheduler | `maintenance` | Off-peak |

### 6.4 Event Types

| Domain Event | Trigger | Notification Types |
|--------------|---------|-------------------|
| RequestStatusChanged | Status transition | system, email, push |
| TripCreated | Trip created | system, push |
| TripStatusChanged | Trip status change | system, push |
| TripDelayed | ETA exceeded | system, email, push |
| OrderCreated | Order created | system |
| PaymentReceived | Payment registered | system, email |

---

## 7. Audit Log

### 7.1 Audit Log Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AUDIT LOG ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐                           ┌──────────────┐
│   Domain     │                           │Audit Service │
│   Service    │                           │              │
└──────┬───────┘                           └──────┬───────┘
       │                                        │
       │  @AuditLog decorator                   │
       ▼                                        ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Interceptor/ │───▶│Audit Aspect │───▶│  Audit Log  │
│   Guard     │    │             │    │  Repository  │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌──────────────┐
                     │   Event      │      │ PostgreSQL   │
                     │   Emitter    │      │ audit_log   │
                     └──────────────┘      └──────────────┘
```

### 7.2 Audit Log Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Who performed action |
| action | ENUM | create, read, update, delete, login, logout |
| entity_type | VARCHAR | Table/entity name |
| entity_id | UUID | ID of affected entity |
| old_values | JSONB | Previous state (for updates) |
| new_values | JSONB | New state |
| ip_address | VARCHAR | Client IP |
| user_agent | VARCHAR | Browser/client info |
| request_id | UUID | Correlation ID |
| created_at | TIMESTAMP | When action occurred |

### 7.3 Audited Operations

| Category | Operations | Data Captured |
|----------|------------|---------------|
| Auth | login, logout, failed_login | User, IP, user_agent |
| CRUD | create, read, update, delete | Old/new values |
| Status changes | status transitions | From/to status, reason |
| Data export | export actions | What was exported |
| Admin | user management, role changes | Admin action details |

### 7.4 Retention Policy

| Data | Retention | Storage |
|------|----------|---------|
| Audit logs | 3 years | PostgreSQL + Archive |
| Status history | 3 years | PostgreSQL |
| Old data | 7 years | Archive (S3) |

---

## 8. File Storage

### 8.1 File Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FILE STORAGE ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐                           ┌──────────────┐
│   Client     │                           │  S3-Compatible│
│   Upload     │                           │   Storage    │
└──────┬───────┘                           └──────┬───────┘
       │                                        │
       │  1. POST /files/upload                 │
       │     multipart/form-data                │
       ▼                                        │
┌──────────────┐                                │
│   API        │                                │
│   Server     │                                │
└──────┬───────┘                                │
       │                                        │
       │  2. Stream to S3                      │
       │     (direct upload or proxy)           │
       ▼                                        │
┌──────────────┐                                │
│    S3        │                                │
│   Bucket     │                                │
└──────────────┘                               

Storage Structure:
s3://crm-files/
├── uploads/                    # User uploads
│   ├── {year}/{month}/{uuid}.{ext}
├── avatars/                    # User avatars
├── documents/                  # Generated documents
├── reports/                    # Generated reports
└── backups/                    # Database backups
```

### 8.2 Storage Configuration

| Setting | Value | Rationale |
|---------|-------|----------|
| Provider | AWS S3 / MinIO (dev) | S3-compatible |
| Bucket | `crm-files-{env}` | Environment isolation |
| Region | Primary region | Low latency |
| Encryption | AES-256 | At-rest encryption |
| Access | Private + signed URLs | Security |
| Versioning | Enabled | Data recovery |

### 8.3 File Processing Pipeline

| Stage | Processing | Tools |
|-------|-----------|-------|
| Upload | Validation, virus scan | class-validator, ClamAV (future) |
| Storage | Direct to S3 | Pre-signed URLs |
| Thumbnails | Image processing | Sharp |
| Archiving | After 90 days | S3 Lifecycle |
| Cleanup | Orphaned files | Scheduled job |

### 8.4 File Type Support

| Category | Types | Max Size | Storage |
|----------|-------|----------|---------|
| Images | jpg, png, gif, webp | 5 MB | S3 + CDN |
| Documents | pdf, doc, docx, xls, xlsx | 10 MB | S3 |
| Archives | zip | 20 MB | S3 |
| Other | Any | 50 MB | S3 (approval) |

---

## 9. Observability

### 9.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         OBSERVABILITY ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Logs       │    │   Metrics    │    │   Traces     │
│   (Pino)    │    │ (Prometheus) │    │   (OTLP)    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COLLECTION LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Promtail (logs) │ Node Exporter (metrics) │ OTel Collector (traces) │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE & QUERY                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │     Loki        │  │   Prometheus    │  │   Tempo        │             │
│  │   (logs)        │  │   (metrics)     │  │   (traces)     │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼───────────────────┼───────────────────┼─────────────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VISUALIZATION                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Grafana Dashboards                           │    │
│  │  • Logs Explorer   • Metrics Dashboard   • Distributed Tracing      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Metrics Categories

| Category | Metrics | Examples |
|----------|---------|----------|
| **Infrastructure** | CPU, Memory, Disk, Network | cpu_usage, memory_percent |
| **Application** | Request rate, latency, errors | http_requests_total, http_request_duration_seconds |
| **Business** | Orders, Requests, Trips | requests_created_total, trips_completed_total |
| **Database** | Query time, connections, slow queries | db_query_duration_seconds |
| **Queue** | Job throughput, latency, failures | queue_jobs_processed_total |

### 9.3 Logging Strategy

| Level | Usage | Examples |
|-------|-------|----------|
| ERROR | Failures requiring attention | Unhandled exceptions, DB errors |
| WARN | Potential issues | Validation failures, retries |
| INFO | Business events | Status changes, user actions |
| DEBUG | Detailed debugging | Request/response bodies |

### 9.4 Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | error_rate > 5% | Critical | PagerDuty |
| High Latency | p99 > 2s | Warning | Slack |
| Low Availability | uptime < 99.5% | Critical | PagerDuty |
| Disk Space | disk > 80% | Warning | Slack |
| Queue Backlog | jobs > 1000 | Warning | Slack |

---

## 10. Deployment Model

### 10.1 Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS / Cloud Provider                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         NETWORK LAYER                                     │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │ │
│  │  │ VPC: 10.0.0.0/16                                                  │   │ │
│  │  │ ├── Public Subnets (ALB, NAT Gateway)                            │   │ │
│  │  │ ├── Private Subnets (ECS Tasks, RDS)                             │   │ │
│  │  │ └── Data Subnets (ElastiCache, S3 via VPCE)                     │   │ │
│  │  └───────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         COMPUTE LAYER (ECS)                              │ │
│  │                                                                         │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │ │
│  │  │   API Service     │  │   Web Service    │  │   Worker         │      │ │
│  │  │   (ECS Task)     │  │   (ECS Task)      │  │   (ECS Task)     │      │ │
│  │  │   2-10 instances │  │   2-10 instances  │  │   1-5 instances │      │ │
│  │  │   CPU: 512-2048  │  │   CPU: 512-1024  │  │   CPU: 512-2048 │      │ │
│  │  │   RAM: 1-4GB     │  │   RAM: 1-2GB     │  │   RAM: 1-4GB    │      │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘      │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA LAYER                                       │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ PostgreSQL │  │   Redis    │  │Meilisearch │  │    S3      │       │ │
│  │  │  (RDS)    │  │ (ElastiCache│  │ (EC2/Docker│  │  (Native)  │       │ │
│  │  │ Multi-AZ  │  │  Cluster)  │  │             │  │            │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Environment Configuration

| Environment | Purpose | Deployment | Configuration |
|------------|---------|------------|--------------|
| Development | Local dev | Docker Compose | `.env.local` |
| Test | QA testing | Docker Compose | CI/CD vars |
| Staging | Pre-production | ECS | Terraform |
| Production | Live system | ECS | Terraform + Vault |

### 10.3 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Push      │───▶│    Build     │───▶│    Test      │───▶│   Deploy     │
│   (Git)      │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                          │
Stage Details:                                                             ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  BUILD:                                                                   │
│  • pnpm install --frozen-lockfile                                          │
│  • pnpm turbo build                                                        │
│  • Docker build (multi-stage)                                              │
│  • Push to ECR                                                             │
│                                                                               │
│  TEST:                                                                     │
│  • Unit tests (Vitest)                                                     │
│  • Integration tests (Supertest)                                           │
│  • E2E tests (Playwright) — optional                                       │
│  • Security scan (Trivy)                                                   │
│  • Dependency audit                                                        │
│                                                                               │
│  DEPLOY:                                                                  │
│  • Deploy to Staging (auto)                                                │
│  • Deploy to Production (manual approval)                                  │
│  • ECS rolling deployment                                                  │
│  • Health check verification                                               │
│  • Rollback on failure                                                    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 10.4 Deployment Strategy

| Strategy | Implementation | Use Case |
|----------|---------------|----------|
| Blue-Green | ECS Blue-Green Deployment | Production releases |
| Rolling | ECS Rolling Update | Hotfixes |
| Canary | Manual canary | Major features |
| Feature Flags | Unleash | Gradual rollouts |

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TEST PYRAMID                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ▲
                                   / \
                                  /   \
                                 /     \
                                / UNIT  \
                               /─────────\
                              /           \
                             / INTEGRATION\
                            /─────────────\
                           /               \
                          /    E2E (10%)   \
                         /─────────────────\
                        /                   \
                       ──────────────────────

    ┌─────────────────────────────────────────────────────────────┐
    │ Layer          │ Coverage │ Speed     │ Examples            │
    ├─────────────────────────────────────────────────────────────┤
    │ UNIT (60%)     │ 70-80%   │ < 100ms  │ Service methods     │
    │ INTEGRATION(30%)│ 20-30%   │ < 1s      │ API endpoints       │
    │ E2E (10%)      │ 5-10%    │ < 30s     │ Critical flows      │
    └─────────────────────────────────────────────────────────────┘
```

### 11.2 Test Types

| Type | Tool | Coverage Target | When |
|------|------|----------------|------|
| Unit | Vitest, Jest | 70-80% | Every PR |
| Integration | Supertest, Prisma Test | 20-30% | Every PR |
| E2E | Playwright | Critical paths | Before release |
| Performance | k6 | Baseline metrics | Weekly |
| Security | SonarQube, Trivy | — | Every PR |

### 11.3 Test Coverage Requirements

| Module | Coverage Target | Critical Paths |
|--------|----------------|---------------|
| Auth | 90% | Login, logout, token refresh |
| Requests | 80% | CRUD, status change |
| Trips | 80% | CRUD, checkpoints |
| Business Logic | 85% | Status transitions, validations |

---

## 12. MVP vs Target Architecture

### 12.1 Comparison Matrix

| Component | MVP | Target | Migration |
|-----------|-----|--------|-----------|
| **Frontend** | Next.js (SSR) | Next.js + PWA | Incremental |
| **Backend** | Monolith (NestJS) | Modular monolith → Microservices | Extract when needed |
| **Database** | PostgreSQL single | PostgreSQL + read replicas | Add replicas |
| **Cache** | Redis single | Redis Cluster | Add nodes |
| **Search** | PostgreSQL LIKE | Meilisearch | Reindex job |
| **Storage** | Local S3 | S3 + CDN | Add CloudFront |
| **Queue** | BullMQ (Redis) | Separate RabbitMQ/Kafka | When load requires |
| **Monitoring** | Basic logs | Full observability | Add gradually |
| **Deployment** | Docker Compose | ECS/EKS | Terraform |

### 12.2 MVP Scope Simplifications

| Component | MVP Simplification | Target Enhancement |
|-----------|-------------------|-------------------|
| Auth | Email + password | MFA, SSO, LDAP |
| Search | PostgreSQL full-text | Dedicated Meilisearch |
| Real-time | Polling | WebSocket/SSE |
| File uploads | Direct to server | Pre-signed S3 URLs |
| Background jobs | Sync processing | BullMQ workers |
| Caching | Minimal | Redis cluster, query cache |
| CDN | None | CloudFront |
| Monitoring | Logs only | Logs + Metrics + Traces |

### 12.3 Migration Path

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MIGRATION ROADMAP                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

MVP (Month 1-4)
│
├── Basic CRUD operations
├── Single PostgreSQL instance
├── Simple auth (JWT)
├── BullMQ on Redis (same instance)
└── Basic monitoring

    │
    ▼
Phase 1 (Month 5-8)
│
├── Read replicas for PostgreSQL
├── Redis cluster (3 nodes)
├── Meilisearch integration
├── Enhanced monitoring
└── CDN for static assets

    │
    ▼
Phase 2 (Month 9-12)
│
├── Microservices extraction (if needed)
├── Dedicated message queue (Kafka)
├── Advanced caching strategy
├── Full observability stack
└── Multi-region deployment

    │
    ▼
Phase 3 (Year 2+)
│
├── Event sourcing
├── CQRS for reporting
├── GraphQL (optional)
├── Advanced ML/AI features
└── Partner API ecosystem
```

---

## 13. Risk Assessment

### 13.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Database scalability** | Medium | High | Read replicas, connection pooling, query optimization |
| **Real-time performance** | Medium | Medium | Redis caching, query optimization, indexing |
| **Security vulnerabilities** | Low | Critical | Regular audits, dependency scanning, penetration testing |
| **Vendor lock-in** | Low | Medium | Containerization, S3-compatible storage |
| **Data loss** | Low | Critical | Regular backups, PITR, multi-AZ |

### 13.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Team knowledge gap** | Medium | Medium | Documentation, training, pair programming |
| **Scope creep** | High | Medium | Clear MVP definition, change control process |
| **Integration delays** | Medium | Medium | Mock data, phased integration |
| **Performance under load** | Low | High | Load testing, autoscaling, monitoring |

### 13.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Changing requirements** | High | Medium | Agile methodology, regular reviews |
| **Time to market** | Medium | Medium | MVP approach, prioritization |
| **User adoption** | Medium | High | UX research, training, change management |

---

## Приложения

### A. Technology Stack Summary

| Layer | MVP | Target |
|-------|-----|-------|
| Frontend | Next.js 14, React 18, Zustand, TanStack Query | Same + PWA, React Native |
| Backend | NestJS 10, Node 20 | Same + gRPC, tRPC |
| Database | PostgreSQL 16, Prisma | Same + read replicas, sharding |
| Cache | Redis 7 | Redis Cluster |
| Search | PostgreSQL FTS | Meilisearch |
| Queue | BullMQ | Kafka/RabbitMQ |
| Storage | S3 | S3 + CloudFront |
| Monitoring | Pino logs | Loki + Prometheus + Tempo + Grafana |
| IaC | Docker Compose | Terraform + Ansible |

### B. Cost Estimation (Monthly)

| Resource | MVP | Target |
|----------|-----|-------|
| Compute (ECS) | $200-400 | $1000-3000 |
| Database (RDS) | $100-200 | $500-1500 |
| Cache (ElastiCache) | $50-100 | $200-500 |
| Storage (S3) | $10-50 | $100-300 |
| Monitoring | $0 (self-hosted) | $100-300 |
| **Total** | **$360-750** | **$1900-5600** |

### C. SLA Definition

| Tier | Availability | Response Time | Support |
|------|--------------|---------------|---------|
| Production | 99.9% | < 500ms (p95) | Business hours |
| Staging | 99% | < 1s (p95) | Best effort |
| Development | N/A | N/A | Self-service |

---

**Документ подготовлен для:**
- [ ] Review Solution Architect
- [ ] Review DevOps Team
- [ ] Review Security Team
- [ ] Согласование с CTO

**История версий:**

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 0.1 | 20.03.2026 | Architecture Team | Initial draft |
