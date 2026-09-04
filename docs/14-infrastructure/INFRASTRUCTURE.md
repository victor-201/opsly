# OPSLY — INFRASTRUCTURE DESIGN

**Document ID:** OPSLY-INFRASTRUCTURE  
**Version:** 1.0.0  
**Phase:** 14 — INFRASTRUCTURE DESIGN  
**Status:** DESIGNED

---

## 1. Runtime Stack

```text
React (Vite) → Static files
NestJS → Node.js 22
PostgreSQL 15+
Redis (optional)
Docker
```

## 2. Local Development

### 2.1 Prerequisites

```text
- Node.js >= 22
- pnpm >= 9
- PostgreSQL 15+ (or Docker)
- Redis (optional, or Docker)
```

### 2.2 Development Commands

```bash
# Install dependencies
pnpm install

# Start database (Docker)
docker compose up -d postgres redis

# Run migrations
pnpm --filter database exec prisma migrate dev

# Start development servers
pnpm dev  # Starts both web and api concurrently

# Run tests
pnpm test

# Lint
pnpm lint

# Typecheck
pnpm typecheck
```

### 2.3 Environment Variables (Development)

```bash
# Database
DATABASE_URL=postgresql://opsly:opsly@localhost:5432/opsly

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=dev-jwt-secret-minimum-32-characters
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Provider API Keys (optional for development)
# RENDER_API_KEY=
# CLOUDFLARE_API_TOKEN=
# NEON_API_KEY=
# UPSTASH_API_KEY=
# MONGODB_ATLAS_API_KEY=
```

## 3. Production Environment

### 3.1 Required Services

```text
1. NestJS API (Docker container)
2. PostgreSQL 15+ (managed or self-hosted)
3. Redis (optional, managed or self-hosted)
4. React static files (served by CDN or NestJS)
```

### 3.2 Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/opsly?sslmode=require

# Redis (optional)
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=<random-64-char-hex>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<random-64-char-hex>

# CORS
CORS_ORIGINS=https://app.opsly.io

# Logging
LOG_LEVEL=info

# Node
NODE_ENV=production
PORT=3000

# Provider API Keys
RENDER_API_KEY=<key>
CLOUDFLARE_API_TOKEN=<token>
NEON_API_KEY=<key>
UPSTASH_API_KEY=<key>
MONGODB_ATLAS_API_KEY=<key>
MONGODB_ATLAS_PROJECT_ID=<id>
```

### 3.3 Secret Management

```text
Production secrets:
  ├── Injected via environment variables
  ├── Never stored in Docker image
  ├── Never committed to Git
  ├── Never logged
  ├── Never returned in API responses
  └── Never included in LLM prompts
```

## 4. Docker

### 4.1 Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build React
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile
COPY apps/web/ ./apps/web/
COPY packages/ui/ ./packages/ui/
RUN pnpm --filter web build

# Stage 2: Build NestJS
FROM node:22-alpine AS api-build
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile
COPY apps/api/ ./apps/api/
RUN pnpm --filter api build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=api-build /app/apps/api/dist ./dist
COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/apps/api/package.json ./
COPY --from=frontend-build /app/apps/web/dist ./public
COPY --from=api-build /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
```

### 4.2 Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: opsly
      POSTGRES_PASSWORD: opsly
      POSTGRES_DB: opsly
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## 5. Database Migrations

```text
Prisma Migrate
  ├── Versioned migrations in prisma/migrations/
  ├── Development: prisma migrate dev
  ├── Production: prisma migrate deploy
  ├── Rollback: Manual SQL rollback per migration
  └── Testing: prisma migrate dev --create-only (review before apply)
```

### 5.1 Migration Strategy

```text
On deployment:
  1. Run prisma migrate deploy
  2. Verify migration success
  3. Start application
  4. If migration fails, abort deployment

On rollback:
  1. Stop application
  2. Run rollback SQL
  3. Deploy previous application version
  4. Verify health endpoints
```

## 6. Health / Readiness

### 6.1 Liveness Check

```text
GET /health/live → 200 { status: "ok" }

Purpose: Verify application is running
No external dependencies checked
```

### 6.2 Readiness Check

```text
GET /health/ready → 200 { status: "ok", checks: { database: "ok", redis: "ok" } }

Purpose: Verify application can serve traffic
Checks:
  ├── PostgreSQL connection
  └── Redis connection (if configured)
```

## 7. Graceful Shutdown

```text
SIGTERM received:
  1. Stop accepting new connections
  2. Complete in-flight requests
  3. Close database connections
  4. Close Redis connections (if any)
  5. Stop schedulers
  6. Flush logs
  7. Exit with code 0

Timeout: 30 seconds (configurable)
Force kill: After timeout
```

### 7.1 Implementation

```typescript
// NestJS lifecycle hooks
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableShutdownHooks();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}
```

## 8. Scaling

### 8.1 Horizontal Scaling

```text
Multiple NestJS instances behind load balancer:

     Load Balancer
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
  API#1 API#2 API#3
    │     │     │
    └─────┼─────┘
          ▼
     PostgreSQL
          +
       Redis (optional)
```

### 8.2 Statelessness

```text
All instances are stateless:
  ├── JWT validation (no server-side session)
  ├── Database queries (PostgreSQL is source of truth)
  ├── Redis optional (cache/queue, not source of truth)
  └── Background jobs (scheduler runs in each instance, dedup via DB)
```

### 8.3 Scaling Order

```text
1. Correct architecture (Modular Monolith)
2. Database indexes
3. Query optimization
4. Caching (Redis or in-memory)
5. Provider request batching
6. Adaptive polling
7. Bounded concurrency
8. Horizontal replicas (identical NestJS instances)
```

## 9. Rollback

### 9.1 Procedure

```text
Trigger:
  ├── Health check failure
  ├── Error rate spike
  ├── Security incident
  └── Manual decision

Steps:
  1. Stop traffic to new version (load balancer)
  2. Deploy previous Docker image
  3. Run database rollback migration (if applicable)
  4. Verify /health/ready
  5. Verify /health/live
  6. Resume traffic
  7. Monitor for 15 minutes
  8. If stable, close incident
  9. If unstable, escalate

Rollback command:
  docker compose pull api:<previous-tag>
  docker compose up -d api

Database rollback:
  psql -f rollback-<version>.sql
```

### 9.2 Rollback Considerations

```text
Database migrations:
  ├── Forward-only migrations (preferred)
  ├── Rollback SQL prepared with each migration
  └── Tested before production

Data compatibility:
  ├── New version must handle old schema (grace period)
  └── Old version must handle new schema (if backward compatible)
```

## 10. Monitoring (Infrastructure)

```text
Application health:
  ├── /health/live
  ├── /health/ready
  └── External uptime check (every 5 minutes)

PostgreSQL:
  ├── Connection count
  ├── Query duration
  ├── Disk usage
  └── Replication lag (if applicable)

Redis (if used):
  ├── Memory usage
  ├── Connection count
  └── Hit rate

Docker:
  ├── Container health
  ├── CPU/Memory usage
  └── Log aggregation
```

## 11. CI/CD Pipeline

```text
On push to main:
  1. Install dependencies
  2. Lint
  3. Typecheck
  4. Unit tests
  5. Integration tests
  6. Build Docker image
  7. Push to registry
  8. Deploy to staging
  9. Run smoke tests
  10. Deploy to production (manual approval)
  11. Run production smoke tests
```

## 12. Backup

```text
PostgreSQL:
  ├── Automated daily backups
  ├── Point-in-time recovery (WAL archiving)
  ├── Backup retention: 30 days
  ├── Backup storage: Separate region (if cloud)
  └── Restore tested quarterly

Redis (if used):
  ├── RDB snapshots (if persistence needed)
  └── Ephemeral cache (acceptable data loss)
```
