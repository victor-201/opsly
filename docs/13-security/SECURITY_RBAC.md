# OPSLY — SECURITY / RBAC DESIGN

**Document ID:** OPSLY-SECURITY-RBAC  
**Version:** 1.0.0  
**Phase:** 13 — SECURITY / RBAC DESIGN  
**Status:** DESIGNED

---

## 1. Roles

### 1.1 Role Hierarchy

```text
Owner (highest)
  └── Admin
       └── Operator
            └── Viewer (lowest)
```

### 1.2 Role Definitions

| Role | Description | Typical User |
|------|-------------|--------------|
| Owner | Full control over organization, billing, deletion | Organization creator |
| Admin | Manage members, providers, resources, settings | Team leads |
| Operator | Manage resources, monitoring, deployments, alerts | DevOps engineers |
| Viewer | Read-only access to all data | Stakeholders, auditors |

## 2. Permission Matrix

| Permission | Owner | Admin | Operator | Viewer |
|-----------|-------|-------|----------|--------|
| `provider:connect` | Y | Y | N | N |
| `provider:read` | Y | Y | Y | Y |
| `provider:manage` | Y | Y | N | N |
| `resource:read` | Y | Y | Y | Y |
| `resource:manage` | Y | Y | Y | N |
| `deployment:read` | Y | Y | Y | Y |
| `deployment:trigger` | Y | Y | Y | N |
| `deployment:rollback` | Y | Y | N | N |
| `metrics:read` | Y | Y | Y | Y |
| `logs:read` | Y | Y | Y | Y |
| `alerts:read` | Y | Y | Y | Y |
| `alerts:manage` | Y | Y | Y | N |
| `incidents:read` | Y | Y | Y | Y |
| `incidents:manage` | Y | Y | Y | N |
| `chat:use` | Y | Y | Y | Y |
| `audit:read` | Y | Y | N | N |
| `settings:manage` | Y | Y | N | N |

## 3. Authentication

### 3.1 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "org": "org-uuid",
  "role": "admin",
  "iat": 1693000000,
  "exp": 1693000900
}
```

### 3.2 Token Configuration

| Property | Value |
|----------|-------|
| Algorithm | HS256 (symmetric) |
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Refresh token rotation | Yes (single-use) |
| Issuer | OPSLY |
| Audience | OPSLY API |

### 3.3 Password Hashing

```text
Algorithm: bcrypt
Cost factor: 12
```

### 3.4 Account Lockout

| Property | Value |
|----------|-------|
| Threshold | 5 failed attempts (configurable) |
| Duration | 30 minutes (configurable) |
| Reset on | Successful login or admin unlock |

## 4. Credential Encryption

### 4.1 Algorithm

```text
AES-256-GCM
  ├── Key: 256-bit from ENCRYPTION_KEY env var
  ├── IV: Random 12 bytes per encryption
  ├── Auth tag: 16 bytes
  └── Ciphertext: Variable length
```

### 4.2 Storage Format

```text
credentials table:
  encrypted_data: BYTEA (ciphertext + auth tag)
  iv: BYTEA (12 bytes)
  auth_tag: BYTEA (16 bytes)
```

### 4.3 Key Management

```text
ENCRYPTION_KEY environment variable
  ├── 64-character hex string (256 bits)
  ├── Rotated via key versioning (future)
  └── Never logged, never returned in API
```

## 5. Tenant Isolation

### 5.1 Mechanism

```text
Every request:
  1. X-Organization-Id header validated
  2. User membership in organization verified
  3. All database queries scoped to organization_id
  4. Provider connections scoped to organization
  5. Resources scoped to organization
  6. Cross-org access returns 404 (not 403, prevents enumeration)
```

### 5.2 Implementation

```text
TenantGuard (middleware)
  ├── Validates X-Organization-Id header
  ├── Verifies user membership via RBAC service
  ├── Sets organization context for downstream
  └── Rejects with 401/403 if invalid

Repository Pattern:
  ├── All queries include: WHERE organization_id = :orgId
  ├── Prisma middleware enforces scoping
  └── No raw SQL bypasses scoping
```

## 6. Authorization Flow

```text
Request
  │
  ▼
RateLimitGuard
  │  Check rate limit per org/IP
  │  Return 429 if exceeded
  │
  ▼
AuthGuard
  │  Validate JWT signature
  │  Check expiry
  │  Extract user, org, role
  │  Return 401 if invalid
  │
  ▼
TenantGuard
  │  Validate X-Organization-Id
  │  Verify user membership in org
  │  Return 403 if not member
  │
  ▼
RBACGuard
  │  Extract required permission from @RequirePermission decorator
  │  Check role has permission
  │  Return 403 if unauthorized
  │
  ▼
Controller
  │  Extract resource ID from params
  │  Verify resource ownership (if applicable)
  │  Return 404 if not found or not owned
  │
  ▼
Application Service
  │  Execute business logic
  │  Return result
```

## 7. Rate Limiting

### 7.1 Configuration

```text
Default:
  ├── Per organization: 100 requests/minute
  ├── Per IP (unauthenticated): 30 requests/minute
  └── Per endpoint overrides:
        ├── POST /auth/register: 5/min per IP
        ├── POST /auth/login: 10/min per IP
        ├── POST /auth/refresh: 20/min per IP
        ├── POST /chat/sessions/:id/messages: 30/min per org
        └── POST /provider-connections: 10/min per org
```

### 7.2 Headers

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693000000
```

### 7.3 Implementation

```text
In-memory sliding window (default)
  └── Redis-backed (optional, for distributed)

Store: Map<key, { count, windowStart }>
Key: orgId:endpoint or ip:endpoint
```

## 8. Secure Headers

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 9. CORS Configuration

```text
Allowed origins: Configurable via CORS_ORIGINS env var
Default: http://localhost:5173 (Vite dev server)
Methods: GET, POST, PATCH, DELETE, OPTIONS
Allowed headers: Content-Type, Authorization, X-Organization-Id
Credentials: true
Max age: 86400
```

## 10. CSRF Strategy

```text
HttpOnly cookies for refresh tokens
  ├── SameSite: Strict
  ├── Secure: true (production)
  └── Path: /api/v1/auth

Access tokens:
  ├── Sent via Authorization header (not cookie)
  └── Not vulnerable to CSRF
```

## 11. Input Validation

```text
NestJS ValidationPipe
  ├── whitelist: true (strip unknown properties)
  ├── forbidNonWhitelisted: true (reject unknown)
  ├── transform: true (auto-transform)
  └── Global pipe on all controllers

DTO Validation:
  ├── class-validator decorators
  ├── @IsString, @IsEmail, @IsUUID, @IsEnum
  ├── @MinLength, @MaxLength
  └── Custom validators where needed
```

## 12. Audit

### 12.1 Audited Events

| Category | Events |
|----------|--------|
| Authentication | login, logout, register, password_reset, password_change |
| Organization | create, update, delete |
| Membership | add, update_role, remove |
| Provider | connect, disconnect, update |
| Resource | create, update, delete |
| Application | create, update, delete, add_resource, remove_resource |
| Deployment | trigger, rollback |
| Alert | create, update, delete, acknowledge, resolve |
| Incident | create, update_status, add_note |
| Settings | update |
| Chat | session_create, message_send |

### 12.2 Audit Log Fields

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "actorId": "uuid",
  "actorEmail": "user@example.com",
  "action": "provider.connect",
  "resourceType": "provider_connection",
  "resourceId": "uuid",
  "details": { "providerType": "render" },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "result": "success",
  "createdAt": "2026-09-04T21:00:00Z"
}
```

## 13. AI / LLM Boundary

### 13.1 What LLM Can Access

```text
- Sanitized evidence (health state, metric values, deployment status)
- Application/resource names and types
- Timestamps and freshness indicators
- Confidence scores
- Public provider status information
```

### 13.2 What LLM Cannot Access

```text
- Provider credentials (encrypted, never decrypted for LLM)
- User passwords or tokens
- Database connection strings
- Internal API keys
- Raw database queries
- Internal error messages with stack traces
- Organization private settings
- Other users' data
```

### 13.3 Tool Execution Boundary

```text
LLM Request
  │
  ▼
Tool Registry (deterministic)
  │
  ├── Verify user authorization for tool
  ├── Execute tool against application service
  ├── Collect evidence
  ├── Sanitize evidence (remove secrets, internal IDs)
  │
  ▼
Sanitized Evidence
  │
  ▼
Optional LLM Explanation
  │
  ▼
Response to User
```

### 13.4 LLM Restrictions

```text
- LLM cannot initiate tool execution autonomously
- LLM cannot bypass RBAC checks
- LLM cannot access provider APIs directly
- LLM cannot modify data
- LLM cannot execute arbitrary code
- LLM responses are informational only
```
