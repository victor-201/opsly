# OPSLY — REQUIREMENTS FINAL

**Document ID:** OPSLY-REQUIREMENTS-FINAL  
**Version:** 1.0.0  
**Phase:** 08 — REQUIREMENT FINALIZATION  
**Status:** AUTHORIZABLE

---

## 1. Terminology

| Term | Definition |
|------|-----------|
| Provider | External cloud service (Render, Cloudflare, Neon, Upstash, MongoDB Atlas) |
| Provider Adapter | Library implementing provider-specific API interaction |
| Provider Connection | Stored credentials linking OPSLY to a provider account |
| Provider Resource | Individual resource within a provider |
| Normalized Resource | Provider resource mapped to unified OPSLY model |
| Logical Application | User-defined grouping of related provider resources |
| Application Resource | Mapping between logical application and provider resource |
| Resource Relation | Dependency link between provider resources |
| Health State | Deterministic evaluation of resource/application health |
| Monitoring | Scheduled collection of health and metric evidence |
| Sync | Process of discovering/updating provider resources |
| Chat Analyst | Natural language interface over deterministic application services |
| Organization | Tenant boundary for users, providers, resources |
| RBAC | Role-based access control within organization |

## 2. Scope

### In Scope

- Authentication (email/password, JWT)
- Organization management
- RBAC (Owner, Admin, Operator, Viewer)
- Provider connections (5 providers)
- Resource discovery and normalization
- Application correlation
- Resource management
- Monitoring and health
- Metrics collection
- Log retrieval
- Deployment tracking
- Alert management
- Incident management
- Chat analyst (deterministic + optional LLM)
- Audit logging
- Security controls
- React frontend dashboard
- NestJS backend API (Modular Monolith)
- PostgreSQL database
- Docker deployment

### Non-Scope

- OAuth/social login
- Multi-factor authentication
- Provider resource provisioning/creation
- Cost optimization recommendations
- Custom plugin system
- White-label deployment
- Mobile application
- Webhook receiver system
- Multi-region deployment
- Custom dashboard builder
- Email notifications (v1 in-app only)
- Email/webhook notification channels

## 3. Actors

| Actor | Description | Max Role |
|-------|-------------|----------|
| Owner | Organization creator, full control | Owner |
| Admin | Manages members, providers, resources | Admin |
| Operator | Manages resources, monitoring, deployments | Operator |
| Viewer | Read-only access | Viewer |
| System | Background sync, monitoring scheduler | N/A |

## 4. Business Rules

| ID | Rule | Priority |
|----|------|----------|
| BR-001 | Only one NestJS backend application allowed | Critical |
| BR-002 | No microservices or internal service-to-service communication | Critical |
| BR-003 | Provider adapters are libraries, not services | Critical |
| BR-004 | Provider credentials encrypted at rest (AES-256-GCM) | Critical |
| BR-005 | Credentials never exposed to frontend, chat, or LLM | Critical |
| BR-006 | Every protected operation verifies identity → tenant → role → permission | Critical |
| BR-007 | Health evaluation is deterministic, no LLM dependency | Critical |
| BR-008 | Monitoring works without AI | Critical |
| BR-009 | Chat uses authorized internal tools only | High |
| BR-010 | LLM cannot bypass RBAC or access secrets | Critical |
| BR-011 | Resource discovery is idempotent | High |
| BR-012 | Provider failure isolated per provider | High |
| BR-013 | No unsupported metric fabrication | Critical |
| BR-014 | Audit log all sensitive operations | High |
| BR-015 | Low-confidence correlation not presented as certain | Medium |
| BR-016 | Core product works with zero paid LLM usage | High |
| BR-017 | Sync jobs tracked with status and timestamps | Medium |
| BR-018 | Stale monitoring data detected and flagged | Medium |
| BR-019 | Metrics/logs retention configurable | Medium |
| BR-020 | Rate limiting applied to all API endpoints | High |
| BR-021 | Passwords hashed with bcrypt (cost >= 12) | Critical |
| BR-022 | JWT access token expiry <= 15 minutes | High |
| BR-023 | Refresh token expiry <= 7 days | High |
| BR-024 | Account lockout after configurable failed attempts | Medium |
| BR-025 | Circuit breaker pattern for provider API calls | Medium |

## 5. Default Configuration Values

| Setting | Default | Notes |
|---------|---------|-------|
| Sync interval | 1 hour | Per provider connection |
| Monitoring interval | 5 minutes | Per resource |
| Metric retention | 30 days | Configurable |
| Log retention | 7 days | Configurable |
| Audit retention | 90 days | Minimum |
| Provider API timeout | 10 seconds | Per request |
| Max concurrent provider calls | 5 | Per provider |
| Chat max tools per turn | 10 | Deterministic tools |
| Rate limit (standard) | 100/min | Per organization |
| Rate limit (auth) | 10/min login, 5/min register | Per IP |

## 6. Requirements with Traceability

### REQ-AUTH-001: User Registration

- **Description:** User can register with email and password
- **Acceptance:** Account created, password hashed with bcrypt, welcome notification sent
- **Priority:** P0
- **API:** POST /auth/register
- **Entity:** users
- **Security:** Password hashed, email unique per tenant
- **Test:** Unit (hash), API (register flow), E2E (registration)

### REQ-AUTH-002: User Login

- **Description:** User can log in with email and password
- **Acceptance:** JWT access + refresh tokens issued, 401 for invalid credentials
- **Priority:** P0
- **API:** POST /auth/login
- **Entity:** users, refresh_tokens
- **Security:** Bcrypt verify, rate limiting, lockout
- **Test:** Unit (verify), API (login flow), Security (brute force)

### REQ-AUTH-003: JWT Validation

- **Description:** System validates JWT on every protected request
- **Acceptance:** 401 returned for invalid/expired tokens
- **Priority:** P0
- **API:** All protected endpoints
- **Security:** Token signature verification, expiry check
- **Test:** Unit (verify), API (401 scenarios)

### REQ-AUTH-004: Token Refresh

- **Description:** System supports token refresh without re-authentication
- **Acceptance:** New access token issued, old refresh token invalidated (rotation)
- **Priority:** P0
- **API:** POST /auth/refresh
- **Security:** Refresh token rotation, single-use
- **Test:** API (refresh flow), Security (replay attack)

### REQ-AUTH-005: Logout

- **Description:** System invalidates tokens on logout
- **Acceptance:** Refresh token invalidated, subsequent refresh attempts fail
- **Priority:** P0
- **API:** POST /auth/logout
- **Audit:** Yes
- **Test:** API (logout flow)

### REQ-AUTH-006: Account Lockout

- **Description:** System locks account after configurable failed attempts
- **Acceptance:** Account locked after N failures, unlockable by admin or time-based
- **Priority:** P1
- **API:** POST /auth/login (triggers lockout)
- **Test:** Unit (counter), API (lockout flow)

### REQ-AUTH-007: Password Reset

- **Description:** System supports password reset via email
- **Acceptance:** Reset token issued, email sent, password updated on valid token
- **Priority:** P1
- **API:** POST /auth/password-reset-request, POST /auth/password-reset
- **Security:** Token expiry, single-use, rate limited
- **Audit:** Yes
- **Test:** API (reset flow), Security (token replay)

### REQ-ORG-001: Create Organization

- **Description:** User can create an organization
- **Acceptance:** Organization created, creator becomes Owner
- **Priority:** P0
- **API:** POST /organizations
- **Entity:** organizations, memberships
- **Audit:** Yes
- **Test:** API (create flow)

### REQ-ORG-002: Organization Settings

- **Description:** Owner/Admin can update organization settings
- **Acceptance:** Settings updated, change audit-logged
- **Priority:** P1
- **API:** PATCH /organizations/:id, PATCH /organizations/:orgId/settings
- **Security:** settings:manage permission
- **Audit:** Yes
- **Test:** API (update flow), RBAC (permission check)

### REQ-ORG-003: Multi-Organization Membership

- **Description:** User can belong to multiple organizations, select active context
- **Acceptance:** User sees all orgs, can switch context
- **Priority:** P1
- **API:** GET /organizations, X-Organization-Id header
- **Test:** API (multi-org flow)

### REQ-ORG-004: Delete Organization

- **Description:** Owner can delete organization
- **Acceptance:** Organization soft-deleted, resources preserved per retention policy
- **Priority:** P1
- **API:** DELETE /organizations/:id
- **Security:** Owner only
- **Audit:** Yes
- **Test:** API (delete flow), RBAC (owner check)

### REQ-RBAC-001: Role Assignment

- **Description:** Owner/Admin can assign roles within organization
- **Acceptance:** Role assigned, permissions immediately effective
- **Priority:** P0
- **API:** POST /organizations/:orgId/memberships, PATCH /organizations/:orgId/memberships/:id
- **Security:** Admin+ permission
- **Audit:** Yes
- **Test:** API (assignment flow), RBAC (permission propagation)

### REQ-RBAC-002: Permission Enforcement

- **Description:** 403 returned for unauthorized operations
- **Acceptance:** 403 for missing permission, no data leakage
- **Priority:** P0
- **API:** All protected endpoints
- **Security:** RBAC guard on every request
- **Test:** API (403 scenarios), Security (permission matrix)

### REQ-RBAC-003: Tenant Isolation

- **Description:** User cannot access resources outside their organization
- **Acceptance:** Cross-org queries return 404/403
- **Priority:** P0
- **API:** All endpoints
- **Security:** Organization scoping on all queries
- **Test:** Security (tenant isolation), API (cross-org rejection)

### REQ-RBAC-004: Role Hierarchy

- **Description:** Owner > Admin > Operator > Viewer
- **Acceptance:** Higher roles include lower role permissions
- **Priority:** P0
- **Security:** Permission matrix defined
- **Test:** Unit (permission check), RBAC (hierarchy)

### REQ-PC-001: Connect Provider

- **Description:** User can connect provider account using API token/key
- **Acceptance:** Credentials validated against provider API, stored encrypted
- **Priority:** P0
- **API:** POST /provider-connections
- **Entity:** provider_connections, credentials
- **Security:** AES-256-GCM encryption, no credential exposure
- **Audit:** Yes
- **Test:** API (connect flow), Security (encryption), Provider (validation)

### REQ-PC-002: Validate Credentials

- **Description:** System validates credentials against provider API
- **Acceptance:** Connection status shows valid/invalid
- **Priority:** P0
- **API:** POST /provider-connections (triggers validation)
- **Provider:** Adapter.validateConnection()
- **Test:** Provider (validation), API (error handling)

### REQ-PC-003: Multiple Connections Per Provider

- **Description:** System supports multiple connections per provider type
- **Acceptance:** Multiple Render connections listed separately
- **Priority:** P1
- **API:** GET /provider-connections
- **Test:** API (list flow)

### REQ-PC-004: Disconnect Provider

- **Description:** User can disconnect provider
- **Acceptance:** Credentials revoked (where possible), connection removed
- **Priority:** P1
- **API:** DELETE /provider-connections/:id
- **Security:** provider:manage permission
- **Audit:** Yes
- **Test:** API (disconnect flow)

### REQ-PC-005: Connection Health Status

- **Description:** System shows connection health status
- **Acceptance:** Status reflects provider API accessibility
- **Priority:** P1
- **API:** GET /provider-connections/:id
- **Test:** API (status flow)

### REQ-DIS-001: Resource Discovery

- **Description:** System discovers resources from connected provider accounts
- **Acceptance:** Resources listed after sync
- **Priority:** P0
- **API:** POST /sync/provider-connections/:id, GET /resources
- **Entity:** resources, sync_jobs
- **Provider:** Adapter.discoverResources()
- **Test:** Provider (discovery), API (resource list)

### REQ-DIS-002: Idempotent Discovery

- **Description:** Resource discovery is idempotent
- **Acceptance:** Running sync twice produces same result
- **Priority:** P0
- **Provider:** Adapter.discoverResources()
- **Test:** Provider (idempotency), Integration (double sync)

### REQ-DIS-003: Safe Resource Deletion

- **Description:** Resource deletion/disappearance handled safely
- **Acceptance:** Disappeared resources marked as inactive, historical data preserved
- **Priority:** P1
- **Entity:** resources (status field)
- **Test:** Provider (disappearance), Integration (data preservation)

### REQ-DIS-004: Sync Job Tracking

- **Description:** Sync jobs tracked with status, timestamps, errors
- **Acceptance:** Job status visible, errors logged
- **Priority:** P1
- **API:** GET /sync/jobs, GET /sync/jobs/:id
- **Entity:** sync_jobs
- **Test:** API (job tracking)

### REQ-DIS-005: Bounded Concurrency

- **Description:** Bounded concurrency per provider
- **Acceptance:** Max N concurrent API calls per provider
- **Priority:** P1
- **Provider:** Adapter reliability layer
- **Test:** Provider (concurrency limit)

### REQ-NORM-001: Unified Resource Model

- **Description:** Provider-specific responses normalized to unified model
- **Acceptance:** All providers map to same schema
- **Priority:** P0
- **Entity:** resources
- **Test:** Provider (normalization), Unit (schema validation)

### REQ-NORM-002: No Provider DTO Leakage

- **Description:** Provider-specific DTOs never leak into domain
- **Acceptance:** Domain layer has no provider-specific types
- **Priority:** P0
- **Architecture:** Adapter pattern
- **Test:** Unit (import check), Architecture (boundary)

### REQ-NORM-003: Deterministic Normalization

- **Description:** Normalization deterministic
- **Acceptance:** Same input produces same output
- **Priority:** P0
- **Test:** Unit (determinism), Provider (snapshot)

### REQ-APP-001: Application/Resource Distinction

- **Description:** System distinguishes Provider Resource from Logical Application
- **Acceptance:** Both types queryable
- **Priority:** P1
- **API:** GET /resources, GET /applications
- **Entity:** resources, applications
- **Test:** API (both types)

### REQ-APP-002: Correlation Signals

- **Description:** Correlation uses names, domains, repository, metadata
- **Acceptance:** Correlation created from multiple signals
- **Priority:** P1
- **Entity:** application_resources
- **Test:** Unit (correlation logic)

### REQ-APP-003: Confidence Scoring

- **Description:** Correlation confidence scored 0-1
- **Acceptance:** Confidence persisted with correlation
- **Priority:** P1
- **Entity:** application_resources (confidence field)
- **Test:** Unit (scoring)

### REQ-APP-004: User Confirmation

- **Description:** User can confirm or reject inferred correlations
- **Acceptance:** Confirmation persisted, overrides inference
- **Priority:** P1
- **API:** PATCH /relations/:id
- **Test:** API (confirmation flow)

### REQ-APP-005: Low Confidence Handling

- **Description:** Low-confidence correlation not presented as certain
- **Acceptance:** UI/chat shows confidence level
- **Priority:** P2
- **Test:** UI (confidence display), Chat (confidence mention)

### REQ-RES-001: Resource Listing

- **Description:** User can view all resources in organization
- **Acceptance:** Paginated list with filters
- **Priority:** P1
- **API:** GET /resources
- **Test:** API (list, pagination, filtering)

### REQ-RES-002: Resource Details

- **Description:** User can view resource details
- **Acceptance:** Full metadata displayed
- **Priority:** P1
- **API:** GET /resources/:id
- **Test:** API (detail view)

### REQ-RES-003: Resource Filtering

- **Description:** User can filter resources by provider, type, status, environment
- **Acceptance:** Filters applied correctly
- **Priority:** P1
- **API:** GET /resources?provider=...
- **Test:** API (filter combinations)

### REQ-RES-004: Resource Search

- **Description:** User can search resources by name
- **Acceptance:** Search returns matching resources
- **Priority:** P2
- **API:** GET /resources?search=...
- **Test:** API (search)

### REQ-MON-001: Scheduled Health Checks

- **Description:** System monitors resources at configurable intervals
- **Acceptance:** Checks run at configured intervals
- **Priority:** P1
- **Component:** Monitoring scheduler (NestJS)
- **Test:** Integration (scheduler), Unit (interval logic)

### REQ-MON-002: Synthetic HTTP Checks

- **Description:** System performs synthetic HTTP checks for web-facing resources
- **Acceptance:** HTTP status and latency recorded
- **Priority:** P1
- **Component:** Synthetic checker
- **Test:** Integration (HTTP check)

### REQ-MON-003: DNS Status Tracking

- **Description:** System tracks DNS status
- **Acceptance:** DNS resolution monitored
- **Priority:** P2
- **Component:** DNS checker
- **Test:** Unit (DNS check)

### REQ-MON-004: TLS/SSL Expiry Tracking

- **Description:** System tracks TLS/SSL certificate expiry
- **Acceptance:** Certificate expiry dates tracked, warnings before expiry
- **Priority:** P2
- **Component:** TLS checker
- **Test:** Unit (TLS check)

### REQ-MON-005: Stale Data Detection

- **Description:** System detects stale monitoring data
- **Acceptance:** Stale data flagged in UI
- **Priority:** P2
- **Component:** Staleness detector
- **Test:** Unit (staleness logic)

### REQ-MON-006: AI-Free Monitoring

- **Description:** Monitoring works without AI/LLM
- **Acceptance:** All monitoring operational with LLM disabled
- **Priority:** P0
- **Architecture:** Deterministic monitoring
- **Test:** Integration (no-LLM mode)

### REQ-HLT-001: Health States

- **Description:** 7 health states defined and implemented
- **Acceptance:** All states reachable and displayable
- **Priority:** P1
- **Entity:** health_checks
- **Test:** Unit (state transitions)

### REQ-HLT-002: Multi-Level Health

- **Description:** Provider, resource, dependency, application, site health
- **Acceptance:** Each level evaluated independently
- **Priority:** P1
- **Component:** Health evaluator
- **Test:** Unit (evaluation), Integration (aggregation)

### REQ-HLT-003: Deterministic Health

- **Description:** Health evaluation deterministic, no LLM dependency
- **Acceptance:** Same inputs produce same health state
- **Priority:** P0
- **Test:** Unit (determinism)

### REQ-HLT-004: Health State Change Tracking

- **Description:** Health state changes tracked with timestamps
- **Acceptance:** State transition history available
- **Priority:** P2
- **Entity:** health_checks (history)
- **Test:** Unit (transition tracking)

### REQ-MET-001: Metric Collection

- **Description:** System collects metrics where provider supports it
- **Acceptance:** Metrics stored for supported providers
- **Priority:** P2
- **Entity:** metric_points
- **Provider:** Adapter.getMetrics()
- **Test:** Provider (metric collection)

### REQ-MET-002: Unified Metric Model

- **Description:** All metrics normalized to unified model
- **Acceptance:** Same schema across providers
- **Priority:** P2
- **Test:** Unit (normalization)

### REQ-MET-003: Metric Range Queries

- **Description:** System supports metric range queries
- **Acceptance:** Time-range queries return correct data
- **Priority:** P2
- **API:** GET /metrics?from=...&to=...
- **Test:** API (range query)

### REQ-MET-004: No Metric Fabrication

- **Description:** Unsupported metrics marked NOT_SUPPORTED
- **Acceptance:** No fabricated data for unsupported providers
- **Priority:** P0
- **Test:** Provider (capability check), Security (no fabrication)

### REQ-MET-005: Configurable Retention

- **Description:** Metric retention configurable (default 30 days)
- **Acceptance:** Old data pruned per policy
- **Priority:** P2
- **Component:** Retention worker
- **Test:** Integration (retention)

### REQ-LOG-001: Log Retrieval

- **Description:** System retrieves logs from provider where supported
- **Acceptance:** Logs fetched and normalized
- **Priority:** P2
- **Provider:** Adapter.getLogs()
- **Test:** Provider (log retrieval)

### REQ-LOG-002: Log Queries

- **Description:** System supports log queries with time range and filters
- **Acceptance:** Filters applied correctly
- **Priority:** P2
- **API:** GET /logs?from=...&level=...
- **Test:** API (log query)

### REQ-LOG-003: Bounded Log Queries

- **Description:** Log queries bounded (max 1000 entries)
- **Acceptance:** Limit enforced
- **Priority:** P2
- **Test:** API (limit enforcement)

### REQ-LOG-004: Log Retention

- **Description:** Log retention configurable (default 7 days)
- **Acceptance:** Old logs pruned per policy
- **Priority:** P2
- **Test:** Integration (retention)

### REQ-DEP-001: Deployment History

- **Description:** System tracks deployment history per resource
- **Acceptance:** Deployments listed chronologically
- **Priority:** P2
- **API:** GET /resources/:id/deployments, GET /deployments
- **Entity:** deployments
- **Test:** API (deployment list)

### REQ-DEP-002: Deployment Status

- **Description:** System shows deployment status
- **Acceptance:** Status displayed (building, deploying, live, failed)
- **Priority:** P2
- **Entity:** deployments (status field)
- **Test:** Unit (status mapping)

### REQ-DEP-003: Trigger Deployment

- **Description:** User can trigger deployment where provider supports
- **Acceptance:** Deployment triggered, status tracked
- **Priority:** P3
- **API:** POST /deployments/trigger
- **Security:** deployment:trigger permission
- **Audit:** Yes
- **Test:** Provider (trigger), API (trigger flow)

### REQ-DEP-004: Rollback Deployment

- **Description:** User can rollback deployment where provider supports
- **Acceptance:** Rollback triggered, status tracked
- **Priority:** P3
- **API:** POST /deployments/:id/rollback
- **Security:** deployment:rollback permission
- **Audit:** Yes
- **Test:** Provider (rollback), API (rollback flow)

### REQ-ALT-001: Alert Rules

- **Description:** User can create alert rules
- **Acceptance:** Rules created with conditions and thresholds
- **Priority:** P2
- **API:** POST /alerts
- **Entity:** alerts
- **Security:** alerts:manage permission
- **Audit:** Yes
- **Test:** API (create flow)

### REQ-ALT-002: Alert Evaluation

- **Description:** System evaluates alert rules against monitoring evidence
- **Acceptance:** Rules evaluated at monitoring intervals
- **Priority:** P2
- **Component:** Alert evaluator
- **Test:** Unit (evaluation logic)

### REQ-ALT-003: Alert Triggering

- **Description:** System triggers alerts when conditions met
- **Acceptance:** Alert created, notification sent
- **Priority:** P2
- **Entity:** alerts (triggered state)
- **Test:** Unit (trigger logic), Integration (end-to-end)

### REQ-ALT-004: Alert Lifecycle

- **Description:** User can acknowledge/resolve alerts
- **Acceptance:** Status updated, audit-logged
- **Priority:** P2
- **API:** POST /alerts/:id/acknowledge, POST /alerts/:id/resolve
- **Security:** alerts:manage permission
- **Audit:** Yes
- **Test:** API (lifecycle flow)

### REQ-ALT-005: Alert Notifications

- **Description:** System sends notifications on alert state changes
- **Acceptance:** In-app notification created
- **Priority:** P3
- **Entity:** notifications
- **Test:** Integration (notification creation)

### REQ-INC-001: Incident Creation

- **Description:** System creates incidents from alert escalation
- **Acceptance:** Incident created with affected resources
- **Priority:** P2
- **Entity:** incidents
- **Test:** Integration (escalation)

### REQ-INC-002: Incident Lifecycle

- **Description:** Detected → Investigating → Acknowledged → Resolved → Closed
- **Acceptance:** Status transitions enforced
- **Priority:** P2
- **API:** PATCH /incidents/:id
- **Security:** incidents:manage permission
- **Audit:** Yes
- **Test:** API (lifecycle flow)

### REQ-INC-003: Incident Correlation

- **Description:** System correlates incidents with affected resources
- **Acceptance:** Resources linked to incident
- **Priority:** P2
- **Entity:** incidents (affectedResources)
- **Test:** Unit (correlation)

### REQ-INC-004: Incident Notes

- **Description:** User can add incident notes
- **Acceptance:** Notes persisted with author and timestamp
- **Priority:** P3
- **API:** POST /incidents/:id/notes
- **Test:** API (note creation)

### REQ-CHT-001: Natural Language Questions

- **Description:** User can ask questions about infrastructure
- **Acceptance:** System accepts free-text questions
- **Priority:** P2
- **API:** POST /chat/sessions/:id/messages
- **Test:** API (message flow)

### REQ-CHT-002: Intent Extraction

- **Description:** System identifies what user is asking
- **Acceptance:** Intent classified (health, metrics, deployment, etc.)
- **Priority:** P2
- **Component:** Intent extractor
- **Test:** Unit (intent classification)

### REQ-CHT-003: Entity Resolution

- **Description:** System resolves application/resource references
- **Acceptance:** Entities resolved from user text
- **Priority:** P2
- **Component:** Entity resolver
- **Test:** Unit (resolution logic)

### REQ-CHT-004: Chat Authorization

- **Description:** Chat respects user permissions
- **Acceptance:** Unauthorized data not returned
- **Priority:** P0
- **Security:** RBAC on tool execution
- **Test:** Security (permission check), API (403 in chat)

### REQ-CHT-005: Deterministic Tools

- **Description:** 10 deterministic tools available
- **Acceptance:** All tools return evidence-based results
- **Priority:** P2
- **Component:** Tool registry
- **Test:** Unit (each tool), Integration (tool execution)

### REQ-CHT-006: Evidence-Based Answers

- **Description:** Answers include source, freshness, confidence
- **Acceptance:** Metadata included in response
- **Priority:** P2
- **Test:** API (response structure)

### REQ-CHT-007: Optional LLM Explanation

- **Description:** LLM explains evidence, never generates truth
- **Acceptance:** LLM output downstream of evidence
- **Priority:** P2
- **Component:** LLM layer (optional)
- **Test:** Integration (LLM mode), Unit (no-LLM fallback)

### REQ-CHT-008: No-LLM Fallback

- **Description:** Chat functional without LLM
- **Acceptance:** Deterministic answers returned
- **Priority:** P0
- **Test:** Integration (no-LLM mode)

### REQ-CHT-009: LLM Safety

- **Description:** LLM cannot access secrets, bypass RBAC, invent data
- **Acceptance:** LLM receives only sanitized evidence
- **Priority:** P0
- **Security:** LLM boundary enforcement
- **Test:** Security (LLM isolation)

### REQ-AUD-001: Audit Logging

- **Description:** System records audit logs for sensitive operations
- **Acceptance:** All audited events logged
- **Priority:** P1
- **Entity:** audit_logs
- **Test:** Integration (audit creation)

### REQ-AUD-002: Audit Log Structure

- **Description:** Audit log includes actor, action, resource, timestamp, IP, result
- **Acceptance:** All fields populated
- **Priority:** P1
- **Entity:** audit_logs
- **Test:** Unit (structure validation)

### REQ-AUD-003: Audit Log Viewing

- **Description:** User can view audit logs with filtering
- **Acceptance:** Filtered query supported
- **Priority:** P2
- **API:** GET /audit
- **Security:** audit:read permission
- **Test:** API (filtering)

### REQ-AUD-004: Audit Log Immutability

- **Description:** Audit logs append-only
- **Acceptance:** No modification or deletion possible
- **Priority:** P1
- **Test:** Unit (append-only), Security (no edit/delete API)

### REQ-AUD-005: Audit Retention

- **Description:** Audit retention configurable (minimum 90 days)
- **Acceptance:** Old audit logs pruned per policy
- **Priority:** P2
- **Test:** Integration (retention)

### REQ-SEC-001: API Authentication

- **Description:** All protected endpoints require JWT
- **Acceptance:** 401 for missing/invalid token
- **Priority:** P0
- **Test:** API (401 scenarios)

### REQ-SEC-002: Tenant Scoping

- **Description:** All queries scoped to organization
- **Acceptance:** Cross-org access blocked
- **Priority:** P0
- **Test:** Security (tenant isolation)

### REQ-SEC-003: RBAC Enforcement

- **Description:** Permission checks on all operations
- **Acceptance:** 403 for missing permission
- **Priority:** P0
- **Test:** API (permission matrix)

### REQ-SEC-004: Credential Encryption

- **Description:** AES-256-GCM at rest
- **Acceptance:** Credentials encrypted in database
- **Priority:** P0
- **Test:** Security (encryption verification)

### REQ-SEC-005: No Secret Exposure

- **Description:** No secrets in logs, frontend, chat, AI
- **Acceptance:** Security review passes
- **Priority:** P0
- **Test:** Security (secret scan)

### REQ-SEC-006: Rate Limiting

- **Description:** Configurable per endpoint
- **Acceptance:** 429 returned when exceeded
- **Priority:** P1
- **Test:** API (rate limit)

### REQ-SEC-007: Secure Headers

- **Description:** CSP, HSTS, X-Frame-Options set
- **Acceptance:** Headers present on responses
- **Priority:** P1
- **Test:** Security (header check)

### REQ-SEC-008: CORS Configuration

- **Description:** Configurable allowed origins
- **Acceptance:** Only allowed origins accepted
- **Priority:** P1
- **Test:** Security (CORS check)

### REQ-SEC-009: Input Validation

- **Description:** DTO validation on all endpoints
- **Acceptance:** Invalid input rejected with 400
- **Priority:** P0
- **Test:** API (validation)

### REQ-SEC-010: SQL Injection Prevention

- **Description:** ORM parameterized queries only
- **Acceptance:** No raw SQL with user input
- **Priority:** P0
- **Test:** Security (injection test)

### REQ-SEC-011: XSS Prevention

- **Description:** Output encoding enforced
- **Acceptance:** No script injection possible
- **Priority:** P0
- **Test:** Security (XSS test)

### REQ-SEC-012: Dependency Scanning

- **Description:** Automated vulnerability checks
- **Acceptance:** Known vulnerabilities flagged
- **Priority:** P2
- **Test:** CI (audit)

### REQ-OBS-001: Structured Logging

- **Description:** JSON logs in production
- **Acceptance:** Logs machine-parseable
- **Priority:** P1
- **Test:** Unit (log format)

### REQ-OBS-002: Request ID Propagation

- **Description:** Unique ID per request
- **Acceptance:** ID present in all log entries
- **Priority:** P1
- **Test:** Integration (ID propagation)

### REQ-OBS-003: Health Endpoints

- **Description:** /health/live and /health/ready
- **Acceptance:** Both endpoints return 200 when healthy
- **Priority:** P0
- **API:** GET /health/live, GET /health/ready
- **Test:** API (health check)

### REQ-OBS-004: Application Metrics

- **Description:** Request count, latency, error rate
- **Acceptance:** Metrics available via endpoint
- **Priority:** P2
- **Test:** Integration (metrics)

### REQ-OBS-005: No Secrets in Diagnostics

- **Description:** No secrets exposed through diagnostics
- **Acceptance:** Security review passes
- **Priority:** P0
- **Test:** Security (diagnostics scan)

### REQ-INF-001: Docker Deployment

- **Description:** Application deployable via Docker
- **Acceptance:** Dockerfile builds and runs
- **Priority:** P1
- **Test:** Build (docker build), Integration (docker run)

### REQ-INF-002: Database Migrations

- **Description:** Migrations run on startup or as separate step
- **Acceptance:** Schema up to date
- **Priority:** P1
- **Test:** Integration (migration)

### REQ-INF-003: Environment Configuration

- **Description:** All config via environment variables
- **Acceptance:** No hardcoded config
- **Priority:** P1
- **Test:** Unit (env reading)

### REQ-INF-004: Graceful Shutdown

- **Description:** In-flight requests completed before shutdown
- **Acceptance:** No dropped connections on SIGTERM
- **Priority:** P1
- **Test:** Integration (shutdown)

### REQ-INF-005: Horizontal Scaling

- **Description:** Multiple API replicas behind load balancer
- **Acceptance:** No shared state between instances
- **Priority:** P3
- **Test:** Architecture (stateless verification)

### REQ-INF-006: Rollback Documentation

- **Description:** Rollback procedure documented and tested
- **Acceptance:** Rollback possible within documented time
- **Priority:** P2
- **Test:** Documentation (rollback procedure)

### REQ-CST-001: Zero LLM Cost Baseline

- **Description:** Product works without paid LLM
- **Acceptance:** All features functional with LLM disabled
- **Priority:** P0
- **Test:** Integration (no-LLM mode)

### REQ-CST-002: Provider API Cost Reduction

- **Description:** Caching, incremental sync, adaptive polling
- **Acceptance:** API calls minimized
- **Priority:** P1
- **Test:** Integration (sync efficiency)

## 7. Business Rules Acceptance Criteria

| BR | Acceptance Test |
|----|-----------------|
| BR-001 | Architecture review: one NestJS app, no microservices |
| BR-002 | Architecture review: no internal service-to-service |
| BR-003 | Import check: no provider SDK in domain layer |
| BR-004 | Security review: credentials encrypted in DB |
| BR-005 | Security review: no credential in response/log/prompt |
| BR-006 | Integration test: 403 for unauthorized |
| BR-007 | Unit test: health deterministic |
| BR-008 | Integration test: monitoring without LLM |
| BR-009 | Security test: chat tool authorization |
| BR-010 | Security test: LLM isolation |
| BR-011 | Integration test: double sync same result |
| BR-012 | Integration test: one provider failure doesn't affect others |
| BR-013 | Provider test: NOT_SUPPORTED for unsupported |
| BR-014 | Integration test: audit log created |
| BR-015 | Unit test: confidence < 0.5 flagged |
| BR-016 | Integration test: all features without LLM |
| BR-017 | API test: sync job status visible |
| BR-018 | Unit test: stale detection |
| BR-019 | Integration test: retention pruning |
| BR-020 | API test: rate limit headers present |
| BR-021 | Unit test: bcrypt cost >= 12 |
| BR-022 | Unit test: token expiry <= 15min |
| BR-023 | Unit test: refresh expiry <= 7d |
| BR-024 | API test: lockout after N failures |
| BR-025 | Integration test: circuit breaker on provider failure |
