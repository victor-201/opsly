<div align="center">

# OPSLY

**AI-powered Infrastructure & Site Operations Platform**

Monitor, manage, and analyze applications deployed across multiple cloud providers —
from a single unified interface.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Monorepo](https://img.shields.io/badge/monorepo-pnpm%20%2B%20Turborepo-orange)
![Stack](https://img.shields.io/badge/stack-NestJS%20%7C%20React%20%7C%20PostgreSQL-important)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Run Development](#run-development)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Chat / AI Tools](#chat--ai-tools)
- [Supported Providers](#supported-providers)
- [Security](#security)
- [Documentation](#documentation)
- [Scripts](#scripts)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

OPSLY is a **Modular Monolith** platform that unifies infrastructure intelligence across
multiple cloud providers. It discovers and tracks resources (Render, Cloudflare Pages,
Neon, Upstash, MongoDB Atlas), models application graphs and their dependencies, monitors
health and performance, detects stale resources, raises alerts and incidents, and exposes
a natural-language chat interface for querying your infrastructure.

The project follows a strict 30-phase specification-driven workflow
(discovery → requirements → design → implementation → deployment), with every requirement
traced to evidence. See [Documentation](#documentation).

---

## Features

- **Multi-provider integrations** — Render, Cloudflare Pages, Neon, Upstash, MongoDB Atlas
  via a pluggable adapter architecture.
- **Application graph** — model applications, resources, mappings, relationships, and
  dependency confidence scoring.
- **Monitoring & alerting** — health checks, synthetic checks, provider metrics,
  stale-resource detection, alerts, and incident management.
- **Deterministic chat assistant** — 10 built-in tools (application, health, metrics,
  deployments, incidents, logs, provider status, etc.) with an optional LLM layer.
- **RBAC & tenancy** — roles (Owner, Admin, Operator, Viewer), 17 permissions, and strict
  organization-level tenant isolation.
- **Credential security** — provider credentials encrypted at rest with **AES-256-GCM**.
- **Audit logging** — every meaningful action recorded for compliance and traceability.
- **Observability** — liveness/readiness health endpoints, structured logging, and
  scheduled background jobs.
- **Swagger/OpenAPI** — auto-generated, interactive API documentation.
- **React dashboard** — overview, applications, topology, resources, deployments,
  monitoring, alerts, incidents, providers, chat, and audit views.

---

## Architecture

OPSLY is a **Modular Monolith** — a single NestJS API and a single React app, decomposed
into cohesive domain modules. This gives the simplicity of a monolith with the
organizational clarity of microservices, and keeps the option to extract modules into
services later.

```
┌─────────────────────────────────────────────────────────────┐
│                        React Web App                        │
│                  (Dashboard, Topology, Chat)                │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / JSON (REST + OpenAPI)
┌───────────────────────────▼─────────────────────────────────┐
│                     NestJS API (Modular Monolith)           │
│                                                             │
│ Auth │ Users │ Orgs │ RBAC │ Providers │ Provider-Connections│
│ Resources │ Applications │ Relations │ Domains │ Deployments│
│ Monitoring │ Metrics │ Logs │ Alerts │ Incidents │ Chat     │
│ Audit │ Notifications │ Settings │ Sync │ Health             │
└───────────┬─────────────────────────────────────┬────────────┘
            │                                     │
     ┌──────▼──────┐                   ┌──────────▼──────────┐
     │ PostgreSQL  │                   │ Provider Adapters   │
     │ (Prisma)    │                   │ (provider-core)     │
     └─────────────┘                   └─────────────────────┘
```

**Key principles**

- **Modular** — 24 NestJS modules, each with a clear domain boundary.
- **Adapter-based providers** — new providers are added by implementing a single interface
  and registering in the registry.
- **Tenant isolation** — all business data is scoped by `organizationId`.
- **Schemaless-first credentials** — per-provider encrypted credential store.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript 5.x (strict) |
| **API** | NestJS 10 (Express) |
| **Frontend** | React + Vite |
| **ORM** | Prisma 5 + PostgreSQL 16 |
| **Auth** | JWT + Passport (JWT strategy) |
| **Validation** | class-validator + class-transformer (whitelist + forbidNonWhitelisted) |
| **Security** | Helmet, AES-256-GCM credential encryption, rate limiting |
| **Docs** | Swagger / OpenAPI |
| **Scheduling** | @nestjs/schedule (cron) |
| **Build** | Turborepo + pnpm 9 workspaces |
| **Tests** | Vitest |
| **Docker** | Multi-stage build, Docker Compose |

---

## Project Structure

```
opsly/
├── apps/
│   ├── api/                  # NestJS API (Modular Monolith)
│   │   ├── src/
│   │   │   ├── auth/         # Authentication, JWT, RBAC guards
│   │   │   ├── users/        # User management
│   │   │   ├── organizations/# Organization + membership
│   │   │   ├── providers/    # Provider registry, connections, credentials
│   │   │   ├── resources/    # Resource discovery & lifecycle
│   │   │   ├── applications/ # Application graph & resource mapping
│   │   │   ├── monitoring/   # Scheduler, health checks, alerts
│   │   │   ├── incidents/    # Incident management
│   │   │   ├── chat/         # 10 deterministic chat tools
│   │   │   ├── audit/        # Audit log
│   │   │   └── ...           # 24 modules total
│   │   └── test/unit/        # Unit tests
│   └── web/                  # React dashboard (Vite)
├── packages/
│   ├── shared/               # @opsly/shared — types, PROVIDER_TYPES, enums
│   ├── provider-core/        # @opsly/provider-core — adapter interface + 5 adapters
│   └── database/             # @opsly/database — Prisma schema, migrations
├── docs/                     # 30-phase specification + audit documentation
├── docker-compose.yml        # Production compose (api + web + db)
├── Dockerfile                # Multi-stage production image
├── turbo.json                # Turborepo config
└── pnpm-workspace.yaml       # Monorepo workspace definitions
```

---

## Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9 (`corepack enable`)
- **Docker** + Docker Compose (for PostgreSQL / production)
- **PostgreSQL** 16 (local dev alternative to Docker)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone git@github.com:victor-201/opsly.git
cd opsly

# Install dependencies (workspace-aware)
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
```

Then edit `.env` — at minimum set a strong `JWT_SECRET` and `ENCRYPTION_KEY`
(64-char hex strings):

```bash
JWT_SECRET=replace-with-a-random-64-char-hex-string
ENCRYPTION_KEY=replace-with-a-random-64-char-hex-string
```

### Database Setup

Start PostgreSQL (option A — Docker):

```bash
docker compose up -d db          # publishes host port 5434 -> container 5432
```

Then set `DATABASE_URL` in `.env` to `postgresql://postgres:postgres@127.0.0.1:5434/opsly`
(5432 on the host is avoided because common local Postgres installs own it).

Or use an existing local PostgreSQL and point `DATABASE_URL` in `.env`.

Then prepare the schema:

```bash
pnpm db:generate   # Generate Prisma Client
pnpm db:migrate    # Apply migrations (or `pnpm db:push` for dev sync)
```

### Run Development

```bash
# Start the API (NestJS) and web (React) with hot-reload
pnpm dev
```

- **API** → http://localhost:3000
- **Swagger** → http://localhost:3000/api/docs
- **Web** → http://localhost:5173

---

## Production Deployment

```bash
# Build the multi-stage production images (API + web)
docker compose build

# Start the full stack (API, web, database)
docker compose up -d --build

# Verify health
curl http://localhost:3000/api/v1/health/live
# => {"status":"ok"}
curl http://localhost:5173/api/v1/health/ready
# => {"status":"ok","checks":{"database":"ok"}}
```

Services exposed by `docker compose`:

| Service | Container | Host URL | Purpose |
|---------|-----------|----------|---------|
| `db` | `opsly-db-1` | `localhost:5434` | PostgreSQL 16 (volume-backed) |
| `api` | `opsly-api-1` | `http://localhost:3000` | NestJS API; applies `prisma db push` at boot |
| `web` | `opsly-web-1` | `http://localhost:5173` | Built React SPA + proxy `/api` → `api:3000` |

The `web` service is a small static server (`apps/web/server/serve.mjs`) that serves the
production build of the dashboard and reverse-proxies `/api/*` requests to the `api`
container, so the SPA needs no separate CORS configuration.

API endpoints worth knowing:

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/health/live` | Liveness probe |
| `/api/v1/health/ready` | Readiness probe (checks DB) |
| `/api/docs` | Swagger UI (API container) |

See [docs/22-deployment/DEPLOYMENT.md](docs/22-deployment/DEPLOYMENT.md) for the full
deployment record and rollback path.

---

## API Documentation

Interactive OpenAPI/Swagger docs are served at `/api/docs` when the API is running:

- http://localhost:3000/api/docs

The API uses the prefix `/api/v1` and covers these groups (see
[docs/04-api/API_SPECIFICATION.md](docs/04-api/API_SPECIFICATION.md) for the full contract):

`auth` · `users` · `organizations` · `memberships` · `provider-connections` · `resources`
· `applications` · `relations` · `domains` · `deployments` · `health` · `metrics` · `logs`
· `alerts` · `incidents` · `sync` · `chat` · `audit` · `notifications` · `monitoring`

---

## Testing

```bash
pnpm test              # Run all tests via Turborepo
pnpm --filter @opsly/api test:unit      # API unit tests
pnpm --filter @opsly/api test:integration  # API integration tests
# or directly
cd apps/api && npx vitest run
```

- **32 unit tests** across auth, providers, chat, monitoring, and middleware.
- Runtime probes included in the repo for repeatable production verification.

---

## Chat / AI Tools

The chat endpoint exposes 10 deterministic, org-scoped tools:

| Tool | Description |
|------|-------------|
| `getApplication` | Fetch an application by ID |
| `getBackend` / `getFrontend` | List backend / frontend resources of an application |
| `getDependencies` | Get resource dependency graph |
| `getHealth` | Get resource health status |
| `getMetrics` | Get resource performance metrics |
| `getDeployments` | List recent deployments |
| `getIncidents` | List incidents |
| `getLogs` | Fetch resource logs |
| `getProviderStatus` | Provider connection status |

An optional LLM layer can be added on top by providing an OpenAI-compatible client.

---

## Supported Providers

OPSLY ships with 5 provider adapters via the pluggable `@opsly/provider-core` package.
Each adapter implements `getCapabilities()`, `validateConnection()`, `discoverResources()`,
and `getResource()`.

| Provider | Type key | Capabilities |
|----------|----------|--------------|
| Render | `render` | health, metrics, deployments, logs, domains |
| Cloudflare Pages | `cloudflare` | health, metrics, deployments, logs, domains |
| Neon | `neon` | health, metrics |
| Upstash | `upstash` | health, metrics |
| MongoDB Atlas | `mongodb-atlas` | health, metrics, logs |

To add a new provider, implement `ProviderAdapter` in
`packages/provider-core/src/adapters/` and register it in
`apps/api/src/providers/provider-registry.service.ts`.

---

## Security

- **Credential encryption** — provider credentials encrypted at rest with AES-256-GCM
  (64-char hex key, random 12-byte IV + auth tag).
- **Validation** — global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.
- **HTTP hardening** — Helmet + explicit security headers
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, ...).
- **Rate limiting** — 100 requests/min per IP+path, returns `429` when exceeded.
- **RBAC** — 4 roles and 17 permissions enforced by guards; strict tenant isolation.
- **Secrets** — `.env` is gitignored; only `.env.example` is committed.
- See [docs/13-security/SECURITY_RBAC.md](docs/13-security/SECURITY_RBAC.md).

---

## Documentation

The repository follows a 30-phase specification-driven lifecycle. Key documents live in
`docs/`:

| Phase | Document |
|-------|----------|
| Discovery | [docs/01-discovery/DISCOVERY.md](docs/01-discovery/DISCOVERY.md) |
| Requirements | [docs/02-requirements/REQUIREMENTS_NORMALIZED.md](docs/02-requirements/REQUIREMENTS_NORMALIZED.md) |
| API Spec | [docs/04-api/API_SPECIFICATION.md](docs/04-api/API_SPECIFICATION.md) |
| System Architecture | [docs/10-architecture/SYSTEM_ARCHITECTURE_IMPLEMENTATION.md](docs/10-architecture/SYSTEM_ARCHITECTURE_IMPLEMENTATION.md) |
| Database Design | [docs/11-database/DATABASE_DESIGN.md](docs/11-database/DATABASE_DESIGN.md) |
| Security/RBAC | [docs/13-security/SECURITY_RBAC.md](docs/13-security/SECURITY_RBAC.md) |
| Infrastructure | [docs/14-infrastructure/INFRASTRUCTURE.md](docs/14-infrastructure/INFRASTRUCTURE.md) |
| Evidence Matrix | [docs/16-audits/REQUIREMENT_EVIDENCE_MATRIX.md](docs/16-audits/REQUIREMENT_EVIDENCE_MATRIX.md) |
| Deployment | [docs/22-deployment/DEPLOYMENT.md](docs/22-deployment/DEPLOYMENT.md) |
| Smoke Test | [docs/23-smoke-test/SMOKE_TEST.md](docs/23-smoke-test/SMOKE_TEST.md) |
| Provider E2E | [docs/24-e2e/PROVIDER_E2E.md](docs/24-e2e/PROVIDER_E2E.md) |
| Monitoring | [docs/25-monitoring/MONITORING.md](docs/25-monitoring/MONITORING.md) |
| RCA / Rollback | [docs/26-rollback/RCA.md](docs/26-rollback/RCA.md) |
| Final Audit | [docs/27-final-audit/FINAL_AUDIT.md](docs/27-final-audit/FINAL_AUDIT.md) |
| Release Approval | [docs/28-release-approval/RELEASE_APPROVAL.md](docs/28-release-approval/RELEASE_APPROVAL.md) |

---

## Scripts

From the monorepo root (`package.json`):

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start API + web with hot-reload |
| `pnpm build` | Build all workspaces (Turborepo) |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm test` | Test all workspaces |
| `pnpm db:migrate` | Run Prisma dev migration |
| `pnpm db:deploy` | Apply migrations (production) |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |

---

## Roadmap

- [x] Modular Monolith foundation (T-019–T-031)
- [x] Provider adapters for 5 cloud providers (T-022–T-026)
- [x] Monitoring, alerts, incidents, audit (T-028)
- [x] Deterministic chat assistant (T-030)
- [x] Production deployment v0.1.0 (T-038–T-046)
- [ ] Authorized live provider credential validation
- [ ] Horizontal scaling (multi-instance rate limiting)
- [ ] CI/CD pipeline (currently manual via Docker Compose)

---

## License

© 2026 OPSLY. This project is private and not yet licensed for public distribution.
Contact the maintainers for usage terms.

---

<div align="center">
  <sub>Built with NestJS · React · Prisma · PostgreSQL · Turborepo</sub>
</div>
