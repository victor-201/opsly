# OPSLY — API CONTRACT

**Document ID:** OPSLY-API-CONTRACT  
**Version:** 1.0.0  
**Phase:** 12 — API CONTRACT  
**Status:** AUTHORED

---

## 1. OpenAPI Specification

The authoritative API contract is defined in OpenAPI 3.1 format.

**File:** `apps/api/src/common/openapi.ts` (generated at build time)

## 2. Schema Definitions

### 2.1 User

```yaml
User:
  type: object
  properties:
    id:
      type: string
      format: uuid
    email:
      type: string
      format: email
    name:
      type: string
    createdAt:
      type: string
      format: date-time
```

### 2.2 Organization

```yaml
Organization:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    slug:
      type: string
    settings:
      type: object
    memberCount:
      type: integer
    createdAt:
      type: string
      format: date-time
```

### 2.3 Membership

```yaml
Membership:
  type: object
  properties:
    id:
      type: string
      format: uuid
    user:
      $ref: '#/components/schemas/User'
    role:
      type: string
      enum: [owner, admin, operator, viewer]
    joinedAt:
      type: string
      format: date-time
```

### 2.4 ProviderConnection

```yaml
ProviderConnection:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    providerType:
      type: string
      enum: [render, cloudflare, neon, upstash, mongodb-atlas]
    status:
      type: string
      enum: [pending, validating, valid, invalid, error]
    lastSyncAt:
      type: string
      format: date-time
      nullable: true
    resourceCount:
      type: integer
    createdAt:
      type: string
      format: date-time
```

### 2.5 Resource

```yaml
Resource:
  type: object
  properties:
    id:
      type: string
      format: uuid
    provider:
      type: string
    providerResourceId:
      type: string
    type:
      type: string
    name:
      type: string
    region:
      type: string
      nullable: true
    environment:
      type: string
      nullable: true
    repository:
      type: string
      nullable: true
    branch:
      type: string
      nullable: true
    domain:
      type: string
      nullable: true
    status:
      type: string
    providerUrl:
      type: string
      nullable: true
    capabilities:
      type: object
    lastSyncAt:
      type: string
      format: date-time
      nullable: true
    createdAt:
      type: string
      format: date-time
```

### 2.6 Application

```yaml
Application:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    description:
      type: string
      nullable: true
    resourceCount:
      type: integer
    healthStatus:
      type: string
      enum: [healthy, degraded, down, unknown]
    createdAt:
      type: string
      format: date-time
```

### 2.7 Deployment

```yaml
Deployment:
  type: object
  properties:
    id:
      type: string
      format: uuid
    resourceId:
      type: string
      format: uuid
    status:
      type: string
      enum: [building, deploying, live, failed, rolling_back]
    commitSha:
      type: string
      nullable: true
    branch:
      type: string
      nullable: true
    metadata:
      type: object
    startedAt:
      type: string
      format: date-time
    finishedAt:
      type: string
      format: date-time
      nullable: true
```

### 2.8 HealthCheck

```yaml
HealthCheck:
  type: object
  properties:
    entityId:
      type: string
      format: uuid
    entityType:
      type: string
      enum: [resource, application, provider]
    health:
      type: string
      enum: [healthy, degraded, down, unknown, not_supported, provider_error, authentication_error]
    evidence:
      type: array
      items:
        type: object
        properties:
          source:
            type: string
          value:
            type: string
          collectedAt:
            type: string
            format: date-time
          freshness:
            type: string
    checkedAt:
      type: string
      format: date-time
```

### 2.9 MetricPoint

```yaml
MetricPoint:
  type: object
  properties:
    timestamp:
      type: string
      format: date-time
    metric:
      type: string
    value:
      type: number
    unit:
      type: string
      nullable: true
    source:
      type: string
```

### 2.10 LogEntry

```yaml
LogEntry:
  type: object
  properties:
    id:
      type: string
      format: uuid
    timestamp:
      type: string
      format: date-time
    level:
      type: string
      enum: [debug, info, warn, error]
    message:
      type: string
    metadata:
      type: object
    source:
      type: string
```

### 2.11 Alert

```yaml
Alert:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    condition:
      type: string
    threshold:
      type: number
      nullable: true
    scope:
      type: object
    enabled:
      type: boolean
    status:
      type: string
      enum: [inactive, triggered, acknowledged, resolved]
    lastTriggeredAt:
      type: string
      format: date-time
      nullable: true
    createdAt:
      type: string
      format: date-time
```

### 2.12 Incident

```yaml
Incident:
  type: object
  properties:
    id:
      type: string
      format: uuid
    title:
      type: string
    description:
      type: string
      nullable: true
    status:
      type: string
      enum: [detected, investigating, acknowledged, resolved, closed]
    severity:
      type: string
      enum: [low, medium, high, critical]
    affectedResources:
      type: array
      items:
        type: string
        format: uuid
    createdAt:
      type: string
      format: date-time
```

### 2.13 AuditLog

```yaml
AuditLog:
  type: object
  properties:
    id:
      type: string
      format: uuid
    actor:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
    action:
      type: string
    resourceType:
      type: string
      nullable: true
    resourceId:
      type: string
      format: uuid
      nullable: true
    details:
      type: object
    timestamp:
      type: string
      format: date-time
    ipAddress:
      type: string
      nullable: true
    result:
      type: string
      enum: [success, failure]
```

### 2.14 ChatMessage

```yaml
ChatMessage:
  type: object
  properties:
    id:
      type: string
      format: uuid
    role:
      type: string
      enum: [user, assistant, system]
    content:
      type: string
    tools:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          arguments:
            type: object
          result:
            type: object
    createdAt:
      type: string
      format: date-time
```

### 2.15 Notification

```yaml
Notification:
  type: object
  properties:
    id:
      type: string
      format: uuid
    type:
      type: string
    title:
      type: string
    message:
      type: string
    read:
      type: boolean
    createdAt:
      type: string
      format: date-time
```

### 2.16 Pagination

```yaml
PaginationMeta:
  type: object
  properties:
    total:
      type: integer
    page:
      type: integer
    limit:
      type: integer
    totalPages:
      type: integer

PaginatedResponse:
  type: object
  properties:
    data:
      type: array
    meta:
      $ref: '#/components/schemas/PaginationMeta'
```

### 2.17 Error

```yaml
Error:
  type: object
  properties:
    error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
```

## 3. Common Schemas

### 3.1 RegisterRequest

```yaml
RegisterRequest:
  type: object
  required: [email, password, name]
  properties:
    email:
      type: string
      format: email
    password:
      type: string
      minLength: 8
    name:
      type: string
      minLength: 1
      maxLength: 255
```

### 3.2 LoginRequest

```yaml
LoginRequest:
  type: object
  required: [email, password]
  properties:
    email:
      type: string
      format: email
    password:
      type: string
```

### 3.3 AuthResponse

```yaml
AuthResponse:
  type: object
  properties:
    user:
      $ref: '#/components/schemas/User'
    accessToken:
      type: string
    refreshToken:
      type: string
```

### 3.4 CreateProviderConnectionRequest

```yaml
CreateProviderConnectionRequest:
  type: object
  required: [providerType, name, credentials]
  properties:
    providerType:
      type: string
      enum: [render, cloudflare, neon, upstash, mongodb-atlas]
    name:
      type: string
      minLength: 1
      maxLength: 255
    credentials:
      type: object
      description: Provider-specific credentials
```

### 3.5 CreateApplicationRequest

```yaml
CreateApplicationRequest:
  type: object
  required: [name]
  properties:
    name:
      type: string
      minLength: 1
      maxLength: 255
    description:
      type: string
      maxLength: 1000
```

### 3.6 CreateAlertRequest

```yaml
CreateAlertRequest:
  type: object
  required: [name, condition]
  properties:
    name:
      type: string
      minLength: 1
      maxLength: 255
    condition:
      type: string
    threshold:
      type: number
    scope:
      type: object
      properties:
        resourceIds:
          type: array
          items:
            type: string
            format: uuid
        applicationIds:
          type: array
          items:
            type: string
            format: uuid
    enabled:
      type: boolean
      default: true
```

## 4. Security Schemes

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
  organizationHeader:
    type: apiKey
    in: header
    name: X-Organization-Id
```

## 5. Global Security

```yaml
security:
  - bearerAuth: []
    organizationHeader: []
```

## 6. Examples

### 6.1 Register

```json
// Request
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

// Response 201
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-09-04T21:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 6.2 List Resources

```json
// Request
GET /api/v1/resources?provider=render&type=service&page=1&limit=20

// Response 200
{
  "data": [
    {
      "id": "...",
      "provider": "render",
      "type": "service",
      "name": "my-api-service",
      "status": "active",
      "region": "oregon",
      "environment": "production",
      "capabilities": {
        "health": true,
        "metrics": true,
        "deployments": true,
        "logs": true
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 6.3 Chat Message

```json
// Request
POST /api/v1/chat/sessions/abc123/messages
{
  "content": "Cho tôi thông tin backend của hệ thống EV Change."
}

// Response 200
{
  "id": "...",
  "role": "assistant",
  "content": "Backend của hệ thống EV Change là Render Web Service 'ev-change-api'.\n\n**Trạng thái:** HEALTHY\n**Region:** Oregon\n**Last deployment:** 2 hours ago (commit abc123)\n**Source:** Render API\n**Freshness:** 5 minutes ago",
  "tools": [
    {
      "name": "getApplication",
      "arguments": { "name": "EV Change" },
      "result": { "id": "...", "name": "EV Change" }
    },
    {
      "name": "getBackend",
      "arguments": { "applicationId": "..." },
      "result": { "resourceId": "...", "name": "ev-change-api", "provider": "render" }
    },
    {
      "name": "getHealth",
      "arguments": { "entityType": "resource", "entityId": "..." },
      "result": { "health": "healthy", "checkedAt": "..." }
    }
  ],
  "createdAt": "2026-09-04T21:00:00Z"
}
```
