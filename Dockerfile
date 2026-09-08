# Build stage
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl libc6-compat libstdc++ && corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/provider-core/package.json ./packages/provider-core/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY . .

RUN node node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma
RUN cd packages/shared && node ../../node_modules/.bin/tsc
RUN cd packages/provider-core && node ../../node_modules/.bin/tsc
RUN cd apps/api && node ../../node_modules/.bin/nest build
RUN cd apps/web && node ../../node_modules/.bin/vite build

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache openssl libc6-compat libstdc++ && corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/provider-core ./packages/provider-core
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/server ./apps/web/server

RUN node node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "node node_modules/.bin/prisma db push --schema=packages/database/prisma/schema.prisma && cd apps/api && node dist/apps/api/src/main.js"]
