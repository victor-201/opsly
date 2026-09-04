# OPSLY — SYSTEM ARCHITECTURE IMPLEMENTATION

**Document ID:** OPSLY-SYSTEM-ARCHITECTURE-IMPLEMENTATION  
**Version:** 1.0.0  
**Phase:** 10 — SYSTEM ARCHITECTURE  
**Status:** DESIGNED

---

## 1. Runtime Topology

```text
┌──────────────────────────────────────────────────────┐
│                      OPSLY                           │
│                                                      │
│  ┌────────────────┐        ┌──────────────────────┐  │
│  │ React Web      │───────▶│ NestJS API           │  │
│  │ apps/web       │ HTTP   │ apps/api             │  │
│  │ Vite + React   │        │ ONE APPLICATION       │  │
│  └────────────────┘        └──────────┬───────────┘  │
│                                       │              │
│                          ┌────────────┴───────────┐  │
│                          │                        │  │
│                     PostgreSQL              Redis* │  │
│                     (primary)            (optional) │  │
└──────────────────────────────────────────────────────┘
```

## 2. Module Map

```text
NestJS Modular Monolith (apps/api/src/)
│
├── common/              Shared utilities, decorators, interceptors, filters
├── config/              Configuration module (env, validation)
│
├── auth/                Authentication (login, register, JWT, refresh, password reset)
├── users/               User management
├── organizations/       Organization management
├── memberships/         Organization membership management
│
├── providers/           Provider registry, capability detection
├── provider-connections/ Provider connection CRUD, validation
│
├── resources/           Resource CRUD, normalization, search
├── applications/        Application CRUD, correlation
├── relations/           Resource relation management
├── deployments/         Deployment tracking
├── domains/             Domain management
│
├── monitoring/          Monitoring scheduler, health checks, synthetic checks
├── health/              Health evaluation, health aggregation
├── metrics/             Metric collection, storage, queries
├── logs/                Log retrieval, storage
├── alerts/              Alert rules, evaluation, lifecycle
├── incidents/           Incident management, lifecycle
│
├── sync/                Sync orchestration, job management
├── chat/                Chat analyst, intent extraction, entity resolution, tools
├── audit/               Audit logging
├── notifications/       In-app notifications
├── settings/            Organization settings management
│
└── main.ts              Application bootstrap
```

## 3. Dependency Direction

```text
Controller
  ↓
Application Service
  ↓
Domain Layer
  ↓
Port (Interface)
  ↓
Infrastructure Adapter
```

### Rules

- Controllers depend on Application Services only
- Application Services depend on Domain + Ports
- Domain has zero external dependencies
- Ports define interfaces, Adapters implement them
- No circular module dependencies
- No provider-specific types in domain layer

## 4. Provider Adapter Architecture

### 4.1 Package Structure

```text
packages/
├── provider-core/           Shared types, interfaces, base adapter
│   ├── src/
│   │   ├── interfaces/      ProviderAdapter, capabilities, health
│   │   ├── types/           NormalizedResource, ConnectionResult, etc.
│   │   ├── errors/          ProviderError, AuthError, RateLimitError
│   │   └── utils/           Retry, backoff, timeout
│   └── package.json
│
├── provider-render/         Render adapter
│   ├── src/
│   │   ├── render.adapter.ts
│   │   ├── render.mapper.ts
│   │   └── render.client.ts
│   └── package.json
│
├── provider-cloudflare/     Cloudflare Pages adapter
├── provider-neon/           Neon adapter
├── provider-upstash/        Upstash adapter
└── provider-mongodb-atlas/  MongoDB Atlas adapter
```

### 4.2 Adapter Interface

```typescript
interface ProviderAdapter {
  validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult>;
  getCapabilities(): ProviderCapabilities;
  discoverResources(): Promise<NormalizedResource[]>;
  getResource(id: string): Promise<NormalizedResource>;
  
  // Optional
  getHealth?(id: string): Promise<ResourceHealth>;
  getMetrics?(id: string, range: MetricRange): Promise<MetricPoint[]>;
  getDeployments?(id: string): Promise<Deployment[]>;
  getLogs?(id: string, query: LogQuery): Promise<LogEntry[]>;
}
```

### 4.3 Provider Registry

```typescript
// Inside apps/api/src/providers/
@Injectable()
class ProviderRegistry {
  private adapters: Map<ProviderType, ProviderAdapter>;
  
  getAdapter(type: ProviderType): ProviderAdapter;
  getCapabilities(type: ProviderType): ProviderCapabilities;
  getAllCapabilities(): Map<ProviderType, ProviderCapabilities>;
}
```

## 5. Application Graph

### 5.1 Entities

```text
Application
  ├── name
  ├── description
  └── metadata

ApplicationResource
  ├── applicationId (FK → Application)
  ├── resourceId (FK → Resource)
  ├── role (frontend, backend, database, cache, etc.)
  └── confirmed (boolean)

ResourceRelation
  ├── sourceResourceId (FK → Resource)
  ├── targetResourceId (FK → Resource)
  ├── type (depends_on, connects_to, deployed_with)
  ├── confidence (0-1)
  ├── source (inferred, user_confirmed)
  └── confirmed (boolean)
```

### 5.2 Correlation Algorithm

```text
On sync completion:
  1. Collect new/updated resources
  2. For each resource, check existing applications
  3. Score correlation based on:
     - Name similarity (0.3)
     - Domain match (0.25)
     - Repository match (0.25)
     - Environment match (0.1)
     - Provider relationship (0.1)
  4. If confidence > 0.7: auto-suggest correlation
  5. If confidence 0.4-0.7: suggest with low confidence flag
  6. If confidence < 0.4: do not suggest
  7. User confirmation overrides all inference
```

## 6. Monitoring Architecture

### 6.1 Scheduler (Inside NestJS)

```text
MonitoringScheduler (NestJS @nestjs/schedule)
  │
  ├── HealthCheckJob (every 5m)
  │     ├── ProviderHealthCheck
  │     ├── SyntheticHttpCheck
  │     └── DnsCheck
  │
  ├── MetricCollectionJob (every 1h)
  │     └── ProviderMetricCollection
  │
  ├── SyncJob (every 1h, per connection)
  │     └── ProviderResourceDiscovery
  │
  └── RetentionJob (daily)
        └── DataRetentionPruning
```

### 6.2 Health Evaluation

```text
EvidenceCollector
  │
  ├── ProviderEvidence (from adapter)
  ├── ResourceEvidence (from resource state)
  ├── SyntheticEvidence (from HTTP checks)
  ├── DependencyEvidence (from dependency health)
  └── DeploymentEvidence (from deployment state)
  │
  ▼
HealthEvaluator
  │
  ├── ResourceHealth = evaluate(resource, evidence[])
  ├── ApplicationHealth = aggregate(resourceHealth[])
  └── SiteHealth = combine(http, dns, tls)
  │
  ▼
HealthStore (PostgreSQL)
  │
  └── AlertEvaluator → Alert → Incident
```

### 6.3 Monitoring Without AI

```text
Deterministic Pipeline:
  Scheduler → Evidence → Evaluation → Health → Alert → Incident

AI Optional Layer:
  Health → LLM Explanation → User (read-only, no truth generation)
```

## 7. Chat Architecture

### 7.1 Flow

```text
User Question
  │
  ▼
ChatController
  │
  ▼
ChatOrchestrator
  │
  ├── IntentExtractor (deterministic)
  │     └── classify(question) → Intent
  │
  ├── EntityResolver (deterministic)
  │     └── resolve(text, orgContext) → Entity[]
  │
  ├── AuthorizationGuard
  │     └── verify(user, intent, entities) → boolean
  │
  ├── ToolSelector
  │     └── select(intent, entities) → Tool[]
  │
  ├── ToolExecutor
  │     └── execute(tool, args) → Evidence
  │
  ├── ResponseBuilder
  │     └── build(evidence, intent) → StructuredAnswer
  │
  └── Optional LLM Layer (downstream)
        └── explain(evidence) → EnhancedAnswer
```

### 7.2 Chat Tools

```text
1. getApplication(name/id) → Application details
2. getBackend(applicationId) → Backend resource
3. getFrontend(applicationId) → Frontend resource
4. getDependencies(applicationId) → Resource dependencies
5. getHealth(entityType, entityId) → Health status
6. getMetrics(entityType, entityId, range) → Metrics
7. getDeployments(resourceId) → Deployment history
8. getIncidents(applicationId) → Active incidents
9. getLogs(resourceId, query) → Log entries
10. getProviderStatus(connectionId) → Provider status
```

## 8. Security Architecture

### 8.1 Request Pipeline

```text
Request
  │
  ▼
RateLimitGuard (global)
  │
  ▼
AuthGuard (JWT validation)
  │
  ▼
TenantGuard (X-Organization-Id validation)
  │
  ▼
RBACGuard (permission check)
  │
  ▼
Controller
  │
  ▼
ApplicationService
  │
  ├── Domain logic
  └── Port calls
        │
        ├── Database (tenant-scoped queries)
        └── Provider Adapter (encrypted credentials)
```

### 8.2 Credential Security

```text
User Input
  │
  ▼
Validation (DTO)
  │
  ▼
Encryption (AES-256-GCM)
  │
  ▼
PostgreSQL (encrypted column)
  │
  ▼
Decryption (on-demand, adapter only)
  │
  ▼
Provider API Call
  │
  ▼
Response (no credentials in response)
```

### 8.3 RBAC Matrix

| Permission | Owner | Admin | Operator | Viewer |
|-----------|-------|-------|----------|--------|
| provider:connect | Y | Y | N | N |
| provider:read | Y | Y | Y | Y |
| provider:manage | Y | Y | N | N |
| resource:read | Y | Y | Y | Y |
| resource:manage | Y | Y | Y | N |
| deployment:read | Y | Y | Y | Y |
| deployment:trigger | Y | Y | Y | N |
| deployment:rollback | Y | Y | N | N |
| metrics:read | Y | Y | Y | Y |
| logs:read | Y | Y | Y | Y |
| alerts:read | Y | Y | Y | Y |
| alerts:manage | Y | Y | Y | N |
| incidents:read | Y | Y | Y | Y |
| incidents:manage | Y | Y | Y | N |
| chat:use | Y | Y | Y | Y |
| audit:read | Y | Y | N | N |
| settings:manage | Y | Y | N | N |

## 9. Database Architecture

### 9.1 Connection

```text
Prisma ORM
  │
  ├── Connection pool (configurable)
  ├── Migrations (versioned)
  └── Transactions (consistency boundaries)
```

### 9.2 Tenant Isolation

```text
All queries include:
  WHERE organization_id = :orgId

Enforced by:
  - TenantGuard (middleware)
  - Repository pattern (scoped queries)
  - Prisma middleware (automatic scoping)
```

## 10. Background Processing

### 10.1 Inside NestJS

```text
NestJS Application
  │
  ├── HTTP API (port 3000)
  │
  ├── @nestjs/schedule (CronJobs)
  │     ├── HealthCheckJob
  │     ├── MetricCollectionJob
  │     ├── SyncJob
  │     └── RetentionJob
  │
  └── @nestjs/bull (Queue processors) [optional]
        ├── sync-queue
        ├── monitoring-queue
        └── notification-queue
```

### 10.2 Queue Configuration

```text
Redis (optional):
  - Connection: REDIS_URL env var
  - Fallback: In-memory queue if Redis unavailable
  - No separate worker deployment
```

## 11. Observability

### 11.1 Logging

```text
Structured JSON logging:
  {
    "timestamp": "...",
    "level": "info",
    "context": "SyncService",
    "requestId": "...",
    "correlationId": "...",
    "message": "...",
    "metadata": {}
  }
```

### 11.2 Metrics

```text
Application metrics (collected internally):
  - http_request_duration_seconds
  - http_requests_total
  - provider_sync_duration_seconds
  - provider_sync_total
  - health_check_duration_seconds
  - chat_tool_execution_duration_seconds
```

### 11.3 Health Endpoints

```text
GET /health/live → { status: "ok" }
GET /health/ready → { status: "ok", checks: { database: "ok", redis: "ok" } }
```

## 12. Scaling Strategy

```text
1. Correct architecture (Modular Monolith)
2. Database indexes (query optimization)
3. Caching (Redis, in-memory)
4. Provider request batching
5. Adaptive polling (reduce unnecessary API calls)
6. Bounded concurrency (per provider)
7. Horizontal replicas (identical NestJS instances)
```

## 13. Deployment Architecture

```text
Docker
  │
  ├── Multi-stage build
  │     ├── Stage 1: Build React
  │     ├── Stage 2: Build NestJS
  │     └── Stage 3: Production image
  │
  ├── Environment variables
  │     ├── DATABASE_URL
  │     ├── REDIS_URL (optional)
  │     ├── JWT_SECRET
  │     ├── ENCRYPTION_KEY
  │     └── PROVIDER_*_API_KEY (optional)
  │
  └── Health checks
        ├── /health/live (liveness)
        └── /health/ready (readiness)
```

## 14. Failure Isolation

```text
Provider Failure:
  Adapter catches error
    → Provider-specific error type
    → Sync marked failed for that connection
    → Existing data retained
    → Other providers unaffected
    → UI shows stale/failure state

Database Failure:
  NestJS lifecycle hooks
    → Graceful shutdown
    → Health endpoint returns degraded

Redis Failure (optional):
  Fallback to in-memory
    → Reduced functionality
    → Core features preserved
```

## 15. Architecture Acceptance Criteria

| Check | Status |
|-------|--------|
| One React application | PASS (apps/web) |
| One NestJS backend | PASS (apps/api) |
| Module boundaries clear | PASS (22 modules) |
| Provider logic isolated | PASS (packages/provider-*) |
| Domain logic provider-neutral | PASS (adapter pattern) |
| PostgreSQL authoritative | PASS |
| Redis optional | PASS |
| Background jobs inside NestJS | PASS |
| No microservices | PASS |
| No service-to-service network | PASS |
| Security boundaries explicit | PASS |
| Monitoring deterministic | PASS |
| Chat uses authorized tools | PASS |
| Horizontal scaling possible | PASS |
