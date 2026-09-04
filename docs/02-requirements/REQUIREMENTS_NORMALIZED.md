# OPSLY — REQUIREMENTS NORMALIZED

**Document ID:** OPSLY-REQUIREMENTS-NORMALIZED  
**Version:** 1.0.0  
**Phase:** 03 — REQUIREMENT NORMALIZATION  
**Status:** NORMALIZED

---

## 1. Terminology

| Term | Definition |
|------|-----------|
| Provider | External cloud service (Render, Cloudflare, Neon, Upstash, MongoDB Atlas) |
| Provider Adapter | Library implementing provider-specific API interaction |
| Provider Connection | Stored credentials linking OPSLY to a provider account |
| Provider Resource | Individual resource within a provider (service, database, project) |
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

### 2.1 In Scope

- Authentication (email/password)
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
- NestJS backend API
- PostgreSQL database
- Docker deployment

### 2.2 Non-Scope

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
| BR-004 | Provider credentials encrypted at rest | Critical |
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

## 5. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| PostgreSQL | Required | Primary persistent store |
| Redis | Optional | Cache, queue, rate limiting |
| Provider APIs | External | 5 providers, each with own API |
| Email service | Required | Password reset |
| LLM provider | Optional | Chat explanation layer |
| Docker | Required | Deployment |

## 6. Priority

| Priority | Domains |
|----------|---------|
| P0 — Critical | Auth, Organizations, RBAC, Provider Connections, Discovery, Normalization, Security |
| P1 — High | Application Correlation, Resource Management, Monitoring, Health, Dashboard, API |
| P2 — Medium | Metrics, Logs, Deployments, Alerts, Incidents, Chat, Audit |
| P3 — Low | Advanced monitoring, Performance optimization, Cost analytics |

## 7. Requirements with Traceability

### Authentication

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-AUTH-001 | User registration with email/password | Account created, password hashed, welcome email sent | P0 |
| REQ-AUTH-002 | User login with email/password | JWT access + refresh tokens issued | P0 |
| REQ-AUTH-003 | JWT validation on protected requests | 401 returned for invalid/expired tokens | P0 |
| REQ-AUTH-004 | Token refresh | New access token issued without re-authentication | P0 |
| REQ-AUTH-005 | Logout invalidation | Refresh token invalidated | P0 |
| REQ-AUTH-006 | Account lockout after failed attempts | Account locked after N configurable failures | P1 |
| REQ-AUTH-007 | Password reset via email | Reset token issued, email sent, password updated | P1 |

### Organizations

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-ORG-001 | Create organization | Organization created, creator becomes Owner | P0 |
| REQ-ORG-002 | Organization settings | Owner can update name, settings | P1 |
| REQ-ORG-003 | Multi-organization membership | User can belong to multiple orgs, select active context | P1 |
| REQ-ORG-004 | Delete organization | Owner can delete, cascade to resources | P1 |

### RBAC

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-RBAC-001 | Role assignment | Owner/Admin can assign roles within org | P0 |
| REQ-RBAC-002 | Permission enforcement | 403 returned for unauthorized operations | P0 |
| REQ-RBAC-003 | Tenant isolation | User cannot access resources outside their org | P0 |
| REQ-RBAC-004 | Role hierarchy | Owner > Admin > Operator > Viewer | P0 |

### Provider Connections

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-PC-001 | Connect provider with API token | Credentials validated, stored encrypted | P0 |
| REQ-PC-002 | Validate credentials against provider API | Connection status shows valid/invalid | P0 |
| REQ-PC-003 | Multiple connections per provider type | Multiple Render connections supported | P1 |
| REQ-PC-004 | Disconnect provider | Credentials revoked, connection removed | P1 |
| REQ-PC-005 | Connection health status | Status reflects provider API accessibility | P1 |

### Discovery

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-DIS-001 | Discover resources from connected providers | Resources listed after sync | P0 |
| REQ-DIS-002 | Idempotent discovery | Running sync twice produces same result | P0 |
| REQ-DIS-003 | Safe resource deletion | Disappeared resources marked, not destroyed | P1 |
| REQ-DIS-004 | Sync job tracking | Status, timestamps, errors recorded | P1 |
| REQ-DIS-005 | Bounded concurrency per provider | Max N concurrent API calls per provider | P1 |

### Normalization

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-NORM-001 | Unified resource model | All providers map to same schema | P0 |
| REQ-NORM-002 | No provider DTO leakage | Domain layer has no provider-specific types | P0 |
| REQ-NORM-003 | Deterministic normalization | Same input produces same output | P0 |

### Application Correlation

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-APP-001 | Distinguish resource from application | Both types queryable | P1 |
| REQ-APP-002 | Correlation signals | Names, domains, repo, metadata used | P1 |
| REQ-APP-003 | Confidence scoring | Score 0-1 persisted with correlation | P1 |
| REQ-APP-004 | User confirmation | User can confirm/reject correlations | P1 |
| REQ-APP-005 | Low-confidence not presented as certain | UI/chat shows confidence level | P2 |

### Resource Management

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-RES-001 | List resources | Paginated list with filters | P1 |
| REQ-RES-002 | Resource details | Full metadata displayed | P1 |
| REQ-RES-003 | Filter by provider/type/status/environment | Filters applied correctly | P1 |
| REQ-RES-004 | Search by name | Search returns matching resources | P2 |

### Monitoring

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-MON-001 | Scheduled health checks | Checks run at configured intervals | P1 |
| REQ-MON-002 | Synthetic HTTP checks | Web resources checked for HTTP response | P1 |
| REQ-MON-003 | DNS status tracking | DNS resolution monitored | P2 |
| REQ-MON-004 | TLS/SSL expiry tracking | Certificate expiry dates tracked | P2 |
| REQ-MON-005 | Stale data detection | Stale monitoring data flagged | P2 |
| REQ-MON-006 | Works without AI | Monitoring operational with LLM disabled | P0 |

### Health

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-HLT-001 | Health states | 7 states defined and implemented | P1 |
| REQ-HLT-002 | Multi-level health | Provider, resource, dependency, application, site health | P1 |
| REQ-HLT-003 | Deterministic evaluation | No LLM in health calculation | P0 |
| REQ-HLT-004 | Health state change tracking | Timestamps on state transitions | P2 |

### Metrics

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-MET-001 | Collect provider-supported metrics | Metrics stored for supported providers | P2 |
| REQ-MET-002 | Unified metric model | All metrics normalized | P2 |
| REQ-MET-003 | Metric range queries | Time-range queries supported | P2 |
| REQ-MET-004 | No metric fabrication | Unsupported metrics marked NOT_SUPPORTED | P0 |
| REQ-MET-005 | Configurable retention | Default 30 days, configurable | P2 |

### Logs

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-LOG-001 | Retrieve provider logs | Logs fetched from supported providers | P2 |
| REQ-LOG-002 | Log queries with filters | Time range and filter support | P2 |
| REQ-LOG-003 | Bounded log queries | Max entries and time range enforced | P2 |
| REQ-LOG-004 | Configurable retention | Default 7 days, configurable | P2 |

### Deployments

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-DEP-001 | Track deployment history | Deployments listed per resource | P2 |
| REQ-DEP-002 | Deployment status | Status displayed (building, deploying, live, failed) | P2 |
| REQ-DEP-003 | Trigger deployment | Deployment triggered where provider supports | P3 |
| REQ-DEP-004 | Rollback deployment | Rollback where provider supports | P3 |

### Alerts

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-ALT-001 | Create alert rules | Rules created with conditions and thresholds | P2 |
| REQ-ALT-002 | Evaluate alert rules | Rules evaluated against monitoring evidence | P2 |
| REQ-ALT-003 | Trigger alerts | Alerts triggered when conditions met | P2 |
| REQ-ALT-004 | Acknowledge/resolve alerts | Alert lifecycle managed | P2 |
| REQ-ALT-005 | Alert notifications | Notifications sent on state changes | P3 |

### Incidents

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-INC-001 | Create incidents from alerts | Incidents created on escalation | P2 |
| REQ-INC-002 | Incident lifecycle | Detected → Investigating → Acknowledged → Resolved → Closed | P2 |
| REQ-INC-003 | Correlate incidents with resources | Affected resources linked | P2 |
| REQ-INC-004 | Incident notes and timeline | Notes and events tracked | P3 |

### Chat

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-CHT-001 | Natural language questions | User can ask about infrastructure | P2 |
| REQ-CHT-002 | Intent extraction | System identifies what user is asking | P2 |
| REQ-CHT-003 | Entity resolution | System resolves application/resource references | P2 |
| REQ-CHT-004 | Authorization | Chat respects user permissions | P0 |
| REQ-CHT-005 | Tool execution | 10 deterministic tools available | P2 |
| REQ-CHT-006 | Evidence-based answers | Answers include source, freshness, confidence | P2 |
| REQ-CHT-007 | Optional LLM explanation | LLM explains evidence, never generates truth | P2 |
| REQ-CHT-008 | Functional without LLM | Deterministic fallback provides answers | P0 |
| REQ-CHT-009 | LLM safety | LLM cannot access secrets, bypass RBAC, invent data | P0 |

### Audit

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-AUD-001 | Record sensitive operations | All audited events logged | P1 |
| REQ-AUD-002 | Audit log structure | Actor, action, resource, timestamp, IP, result | P1 |
| REQ-AUD-003 | Audit log viewing | Filtered query supported | P2 |
| REQ-AUD-004 | Audit log immutability | Append-only, no modification | P1 |
| REQ-AUD-005 | Configurable retention | Minimum 90 days | P2 |

### Security

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-SEC-001 | API authentication | All protected endpoints require JWT | P0 |
| REQ-SEC-002 | Tenant scoping | All queries scoped to organization | P0 |
| REQ-SEC-003 | RBAC enforcement | Permission checks on all operations | P0 |
| REQ-SEC-004 | Credential encryption | AES-256-GCM at rest | P0 |
| REQ-SEC-005 | No secrets in logs/frontend/chat/AI | Verified by security review | P0 |
| REQ-SEC-006 | Rate limiting | Configurable per endpoint | P1 |
| REQ-SEC-007 | Secure headers | CSP, HSTS, X-Frame-Options set | P1 |
| REQ-SEC-008 | CORS configuration | Configurable allowed origins | P1 |
| REQ-SEC-009 | Input validation | DTO validation on all endpoints | P0 |
| REQ-SEC-010 | SQL injection prevention | ORM parameterized queries only | P0 |
| REQ-SEC-011 | XSS prevention | Output encoding enforced | P0 |
| REQ-SEC-012 | Dependency scanning | Automated vulnerability checks | P2 |

### Observability

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-OBS-001 | Structured logging | JSON logs in production | P1 |
| REQ-OBS-002 | Request ID propagation | Unique ID per request | P1 |
| REQ-OBS-003 | Health endpoints | /health/live and /health/ready | P0 |
| REQ-OBS-004 | Application metrics | Request count, latency, error rate | P2 |
| REQ-OBS-005 | No secrets in diagnostics | Verified | P0 |

### Deployment

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-DEP-001 | Docker deployment | Dockerfile builds and runs | P1 |
| REQ-DEP-002 | Database migrations | Migrations run on startup or separate step | P1 |
| REQ-DEP-003 | Environment configuration | All config via env vars | P1 |
| REQ-DEP-004 | Graceful shutdown | In-flight requests completed | P1 |
| REQ-DEP-005 | Horizontal scaling | Multiple API replicas behind load balancer | P3 |
| REQ-DEP-006 | Rollback documented | Procedure documented and tested | P2 |

### Cost

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-CST-001 | Zero LLM cost baseline | Product works without paid LLM | P0 |
| REQ-CST-002 | Provider API cost reduction | Caching, incremental sync, adaptive polling | P1 |

## 8. Deduplication Notes

The following requirements were deduplicated from the raw collection:

- "Credentials encrypted" and "No secrets in logs/frontend" consolidated under Security
- "Monitoring works without AI" and "Health evaluation deterministic" consolidated under Health
- "Rate limiting" consolidated under Security (not separate domain)
- "Provider failure isolated" consolidated under Discovery
- "Chat functional without LLM" consolidated under Chat

No contradictions found between requirements.
