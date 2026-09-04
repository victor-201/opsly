# Build stage
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/provider-core/package.json ./packages/provider-core/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @opsly/database generate
RUN pnpm --filter @opsly/api build
RUN pnpm --filter @opsly/web build

# Production stage
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/provider-core/package.json ./packages/provider-core/
COPY --from=builder /app/packages/provider-core/dist ./packages/provider-core/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/dist ./apps/web/dist

RUN pnpm --filter @opsly/database generate

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "pnpm --filter @opsly/database db:push && pnpm --filter @opsly/api start:prod"]
