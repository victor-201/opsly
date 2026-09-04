# OPSLY — REQUIREMENTS

**Document ID:** OPSLY-REQUIREMENTS  
**Version:** 1.0.0  
**Phase:** 02 — REQUIREMENT COLLECTION  
**Status:** COLLECTED

---

## 1. Authentication

### 1.1 Functional

- User can register with email and password
- User can log in with email and password
- System issues JWT access token and refresh token
- System validates JWT on every protected request
- System supports token refresh without re-authentication
- System invalidates tokens on logout
- System locks account after configurable failed attempts
- System supports password reset via email

### 1.2 Non-Functional

- Passwords hashed with bcrypt (cost factor >= 12)
- JWT access token expiry <= 15 minutes
- Refresh token expiry <= 7 days
- Tokens stored httpOnly cookie or secure storage
- No secrets in frontend code

---

## 2. Organizations

### 2.1 Functional

- User can create an organization
- User who creates organization becomes Owner
- Organization has name, slug, settings
- User can belong to multiple organizations
- User selects active organization context
- Organization owner can update settings
- Organization owner can delete organization

### 2.2 Non-Functional

- Organization name unique within tenant scope
- Slug auto-generated, URL-safe
- Soft delete with retention period

---

## 3. RBAC

### 3.1 Roles

| Role | Description |
|------|-------------|
| Owner | Full control over organization |
| Admin | Manage members, providers, resources |
| Operator | Manage resources, monitoring, deployments |
| Viewer | Read-only access |

### 3.2 Permissions

- `provider:connect` — connect new provider
- `provider:read` — view provider connections
- `provider:manage` — update/disconnect providers
- `resource:read` — view resources
- `resource:manage` — manage resource settings
- `deployment:read` — view deployments
- `deployment:trigger` — trigger deployments
- `deployment:rollback` — rollback deployments
- `metrics:read` — view metrics
- `logs:read` — view logs
- `alerts:read` — view alerts
- `alerts:manage` — create/update/delete alerts
- `incidents:read` — view incidents
- `incidents:manage` — manage incidents
- `chat:use` — use chat analyst
- `audit:read` — view audit logs
- `settings:manage` — manage organization settings

### 3.3 Non-Functional

- Every protected operation verifies identity → tenant → role → permission → resource ownership
- Role assignments stored per organization membership
- No permission escalation possible through API manipulation

---

## 4. Provider Connections

### 4.1 Functional

- User can connect provider account using API token/key
- System validates credentials against provider API
- System stores credentials encrypted at rest
- System supports multiple connections per provider type
- User can name connections
- User can disconnect provider
- System rotates/revokes credentials on disconnect
- System shows connection health status

### 4.2 Supported Providers

| Provider | Auth Method | Base API |
|----------|-------------|----------|
| Render | API Key | api.render.com |
| Cloudflare Pages | API Token | api.cloudflare.com |
| Neon | API Key | console.neon.tech/api |
| Upstash | API Key | api.upstash.com |
| MongoDB Atlas | API Key + Project ID | cloud.mongodb.com/api |

### 4.3 Non-Functional

- Credentials encrypted at rest (AES-256-GCM)
- Credentials never returned in API responses
- Credentials never logged
- Credentials never sent to frontend
- Credentials never included in LLM prompts
- Connection validation timeout <= 10 seconds
- Rate limit handling per provider

---

## 5. Resource Discovery

### 5.1 Functional

- System discovers resources from connected provider accounts
- Discovery uses official provider APIs only
- Discovery is idempotent
- Resource deletion/disappearance handled safely (no immediate historical data destruction)
- Resource metadata persisted: provider, provider account, provider resource ID, type, name, region, environment, repository, branch, domain, status, provider URL, timestamps, capabilities, last sync, provenance

### 5.2 Resource Types

| Provider | Resource Types |
|----------|---------------|
| Render | Service (Web Service, Background Worker, Static Site, Cron Job), Database, Pipeline |
| Cloudflare Pages | Project, Deployment |
| Neon | Project, Branch, Database |
| Upstash | Redis Database, Kafka Topic, QStash |
| MongoDB Atlas | Cluster, Database, Collection |

### 5.3 Non-Functional

- Sync bounded concurrency per provider
- Sync idempotent — running twice produces same result
- Sync failure isolated per provider
- Stale data detection with configurable thresholds
- Sync job tracked with status, timestamps, errors

---

## 6. Normalization

### 6.1 Functional

- Provider-specific responses normalized to unified resource model
- Normalized model includes: id, provider, providerAccountId, providerResourceId, type, name, region, environment, repository, branch, domain, status, providerUrl, capabilities, timestamps

### 6.2 Non-Functional

- Provider DTOs never leak into domain
- Normalization deterministic
- No unsupported capability approximation

---

## 7. Application Correlation

### 7.1 Functional

- System distinguishes Provider Resource from Logical Application
- Correlation uses: names, domains, repository, deployment metadata, project/environment, branch, provider relationships, explicit user mapping
- Correlation persists: relationship type, confidence, source, timestamp, explicit confirmation status
- User can confirm or reject inferred correlations
- Low-confidence inference not presented as certain

### 7.2 Non-Functional

- Correlation confidence scored 0-1
- User-confirmed correlations override inference
- Correlation re-evaluated on sync

---

## 8. Resource Management

### 8.1 Functional

- User can view all resources in organization
- User can view resource details
- User can filter resources by provider, type, status, environment
- User can search resources by name
- User can see resource health status
- User can see resource capabilities
- User can view resource sync history

### 8.2 Non-Functional

- Resource listing paginated
- Resource access tenant-scoped
- Resource access RBAC-enforced

---

## 9. Monitoring

### 9.1 Functional

- System monitors resources at configurable intervals
- System performs provider health checks
- System performs synthetic HTTP checks for web-facing resources
- System tracks DNS status
- System tracks TLS/SSL certificate expiry
- System detects stale monitoring data
- System supports adaptive polling intervals
- Monitoring works without AI/LLM

### 9.2 Evidence Sources

- HTTP status code
- Response latency
- Availability percentage
- DNS resolution
- TLS certificate expiry
- Provider health status
- Deployment state

### 9.3 Non-Functional

- Polling intervals configurable per resource type
- Timeout handling per check
- Retry with exponential backoff
- Rate-limit awareness
- Stale data detection with configurable thresholds
- Monitoring scheduler runs inside NestJS

---

## 10. Health

### 10.1 Health States

| State | Meaning |
|-------|---------|
| HEALTHY | Operating normally |
| DEGRADED | Partial issues detected |
| DOWN | Not responding or confirmed failure |
| UNKNOWN | Insufficient data |
| NOT_SUPPORTED | Provider does not expose health data |
| PROVIDER_ERROR | Cannot determine health due to provider API error |
| AUTHENTICATION_ERROR | Cannot determine health due to auth failure |

### 10.2 Health Levels

- Provider Health
- Resource Health
- Dependency Health
- Application Health
- User-Facing Site Health

### 10.3 Functional

- System evaluates health from multiple evidence sources
- Resource existence does not equal health
- Provider API error does not mean customer resource is down
- Health evaluation deterministic
- Health state changes tracked with timestamps

---

## 11. Metrics

### 11.1 Functional

- System collects metrics where provider supports it
- System normalizes metrics to unified model
- System stores metric points with timestamps
- System supports metric range queries
- System retains metrics with configurable retention

### 11.2 Supported Metrics (per provider capability)

| Metric | Render | Cloudflare | Neon | Upstash | MongoDB Atlas |
|--------|--------|------------|------|---------|---------------|
| CPU | Yes | No | No | No | Yes |
| Memory | Yes | No | No | No | Yes |
| Disk | Yes | No | Yes | No | Yes |
| Network | Yes | Yes | No | No | Yes |
| Request Count | Yes | Yes | No | No | No |
| Latency | Yes | Yes | No | No | No |
| Error Rate | Yes | Yes | No | No | No |

### 11.3 Non-Functional

- Metric retention configurable (default 30 days)
- Metrics never fabricated for unsupported providers
- Metric collection bounded by rate limits

---

## 12. Logs

### 12.1 Functional

- System retrieves logs from provider where supported
- System supports log queries with time range and filters
- System normalizes log entries
- System stores logs with retention

### 12.2 Non-Functional

- Log queries bounded (max entries, time range)
- Log retention configurable (default 7 days)
- Sensitive data in logs redacted

---

## 13. Deployments

### 13.1 Functional

- System tracks deployment history per resource
- System shows deployment status (building, deploying, live, failed)
- System shows deployment metadata (commit, branch, timestamp)
- User can trigger deployment (where provider supports)
- User can rollback deployment (where provider supports)

### 13.2 Non-Functional

- Deployment actions audit-logged
- Deployment trigger requires `deployment:trigger` permission
- Deployment rollback requires `deployment:rollback` permission

---

## 14. Alerts

### 14.1 Functional

- User can create alert rules
- Alert rules define: condition, threshold, resource/application scope
- System evaluates alert rules against monitoring evidence
- System triggers alerts when conditions met
- User can acknowledge alerts
- User can resolve alerts
- System sends notifications on alert state changes

### 14.2 Alert Conditions

- Health state change
- Metric threshold breach
- Deployment failure
- TLS certificate expiry warning
- Sync failure

### 14.3 Non-Functional

- Alert evaluation deterministic
- Alert deduplication
- Alert escalation configurable
- Alert history retained

---

## 15. Incidents

### 15.1 Functional

- System creates incidents from alert escalation
- Incident lifecycle: Detected → Investigating → Acknowledged → Resolved → Closed
- User can update incident status
- User can add incident notes
- System correlates incidents with affected resources
- System tracks incident timeline

### 15.2 Non-Functional

- Incident data retained per policy
- Incident access tenant-scoped

---

## 16. Chat

### 16.1 Functional

- User can ask questions about infrastructure in natural language
- System extracts intent from question
- System resolves entities (application, resource, metric)
- System authorizes request against user permissions
- System selects appropriate tool
- System executes tool against application service
- System collects evidence
- System optionally uses LLM to explain evidence
- System returns structured answer with: what was found, current state, source, freshness, uncertainty, dependencies, recommended action

### 16.2 Chat Tools

- `getApplication` — get application details
- `getBackend` — get backend resource of application
- `getFrontend` — get frontend resource of application
- `getDependencies` — get dependencies of application
- `getHealth` — get health of resource/application
- `getMetrics` — get metrics of resource/application
- `getDeployments` — get deployments of resource
- `getIncidents` — get incidents of application/resource
- `getLogs` — get logs of resource
- `getProviderStatus` — get provider connection status

### 16.3 Non-Functional

- LLM cannot access credentials
- LLM cannot access database directly
- LLM cannot bypass RBAC
- LLM cannot call arbitrary URLs
- LLM cannot invent provider data
- LLM cannot execute privileged operations without approved tool
- LLM cannot expose hidden internal data
- Chat functional without LLM (deterministic fallback)
- Chat sessions tracked for audit

---

## 17. Audit

### 17.1 Functional

- System records audit logs for sensitive operations
- Audit log includes: actor, action, resource, timestamp, IP, user agent, result
- User can view audit logs with filtering
- Audit logs immutable

### 17.2 Audited Events

- Login/logout
- Provider connection changes
- Credential rotation
- Deployment actions
- Rollback
- Alert changes
- Membership changes
- Settings changes
- Chat sessions

### 17.3 Non-Functional

- Audit log retention configurable (minimum 90 days)
- Audit logs tenant-scoped
- Audit logs append-only

---

## 18. Security

### 18.1 Functional

- All API requests authenticated
- All API requests tenant-scoped
- All API requests RBAC-enforced
- Sensitive operations audit-logged
- Credentials encrypted at rest
- Rate limiting applied
- Secure headers set
- CORS configured
- Input validation on all endpoints

### 18.2 Non-Functional

- No secrets in logs
- No secrets in frontend
- No secrets in chat
- No secrets in AI prompts
- No secrets in Git
- Secrets encrypted with AES-256-GCM
- bcrypt for password hashing (cost >= 12)
- CSRF protection where applicable
- SQL injection prevention (ORM parameterized queries)
- XSS prevention (output encoding)
- Dependency vulnerability scanning

---

## 19. Cost

### 19.1 Functional

- Core product useful with zero paid LLM usage
- AI is optional enhancement, not requirement

### 19.2 Non-Functional

- Provider API cost reduced through: caching, incremental sync, adaptive polling, bounded concurrency, bounded log queries, metric retention, rate-limit awareness
- No speculative complexity
- Horizontal scaling through identical replicas

---

## 20. Observability

### 20.1 Functional

- Structured logging throughout
- Request ID propagation
- Correlation ID support
- Error tracking
- Application metrics (request count, latency, error rate)
- Provider sync metrics
- Job metrics
- Database metrics
- Health/readiness endpoints
- Audit events

### 20.2 Health Endpoints

- `/health/live` — liveness check
- `/health/ready` — readiness check (database, Redis if enabled)

### 20.3 Non-Functional

- No secrets exposed through diagnostics
- Log level configurable
- Structured JSON logging in production

---

## 21. Deployment

### 21.1 Functional

- Application deployable via Docker
- Database migrations run on startup or as separate step
- React build served as static files
- Environment variables for configuration
- Graceful shutdown supported

### 21.2 Non-Functional

- Single NestJS artifact horizontally scalable
- No microservice deployment topology
- Docker multi-stage build for small image
- Health checks for container orchestration
- Rollback documented and tested

---

## 22. Recovery

### 22.1 Functional

- Database backup and restore documented
- Rollback procedure documented and tested
- Incident detection and response procedure defined

### 22.2 Non-Functional

- Recovery time objective (RTO) documented
- Recovery point objective (RPO) documented
- No single point of failure in critical path
