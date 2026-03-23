FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build --filter=@logistics-crm/api

FROM base AS development
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3001

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

EXPOSE 3001

CMD ["pnpm", "--filter", "@logistics-crm/api", "dev"]
