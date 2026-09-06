# OPSLY — Production Deployment (T-038)

## Deployment Record

| Field | Value |
|-------|-------|
| Application | OPSLY — Infrastructure/Provider Management Platform |
| Version | 0.1.0 |
| Commit SHA | `ec67760b93ca7f0e10f2c935b3189d886f96fde8` |
| Commit Subject | `fix(docker): resolve production startup issues found in pre-production validation` |
| Environment | Production (Docker Compose, target host) |
| Deployed At | 2026-09-06 |
| Deployment Method | `docker compose up -d --build` |
| Image | `opsly-api:latest` |
| Orchestration | docker-compose (API + PostgreSQL 16) |

## Deployment Components

| Container | Service | Image | Ports | Status |
|-----------|---------|-------|-------|--------|
| `opsly-api-1` | API (NestJS) | node:22-alpine (multi-stage Dockerfile) | 3000 → 3000 | Up |
| `opsly-db-1` | Database (PostgreSQL 16) | postgres:16-alpine | 5432 → 5432 | Up (healthy) |

## Migration

- Migration name: `20260904000000_init`
- File: `packages/database/prisma/migrations/20260904000000_init/migration.sql` (671 lines, 25 tables)
- Applied via: `prisma db push` at container startup (idempotent — "database is already in sync")
- Migration deploy command: `prisma migrate deploy` supported for seamless upgrades

## Environment Configuration

| Variable | Source | Notes |
|----------|--------|-------|
| `NODE_ENV` | compose | `production` |
| `DATABASE_URL` | compose | `postgresql://postgres:postgres@db:5432/opsly` (internal network) |
| `JWT_SECRET` | env | Externalized via `${JWT_SECRET}` |
| `ENCRYPTION_KEY` | env | Externalized via `${ENCRYPTION_KEY}` |
| `CORS_ORIGINS` | env | Externalized via `${CORS_ORIGINS}` |

## Health Verification (post-deploy)

- Liveness: `GET /api/v1/health/live` → `{"status":"ok"}`
- Readiness: `GET /api/v1/health/ready` → `{"status":"ok","checks":{"database":"ok"}}`
- NestJS application started successfully, all 22 modules loaded, Swagger at `/api/docs`

## Deployment Evidence

- Image builds cleanly (multi-stage: builder → production, OpenSSL installed for Prisma engines)
- Application boots and serves requests on port 3000
- Database schema in sync (25 tables confirmed via `pg_tables`)
- Graceful rollback available: previous image tag + `prisma migrate deploy` path

## Rollback Path

1. Revert image to previous tag: `docker compose up -d --no-deps --force-recreate api`
2. Database rollback: `prisma migrate resolve --rolled-back 20260904000000_init` (or restore pg_dump backup)
3. Health re-verify via `/api/v1/health/ready`