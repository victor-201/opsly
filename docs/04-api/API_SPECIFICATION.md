# OPSLY — API SPECIFICATION

**Document ID:** OPSLY-API-SPECIFICATION  
**Version:** 1.0.0  
**Phase:** 04 — API / ENDPOINT SPECIFICATION  
**Status:** SPECIFIED

---

## 1. Base

```text
/api/v1
```

## 2. Conventions

### 2.1 Authentication

All endpoints except `/auth/login`, `/auth/register`, `/auth/refresh`, `/health/live` require:

```text
Authorization: Bearer <access_token>
```

### 2.2 Tenant Scoping

All protected endpoints are scoped to the active organization:

```text
X-Organization-Id: <org_id>
```

### 2.3 Pagination

```text
GET /api/v1/resources?page=1&limit=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 2.4 Filtering

```text
GET /api/v1/resources?provider=render&type=service&status=active
```

### 2.5 Sorting

```text
GET /api/v1/resources?sort=-createdAt,name
```

Prefix `-` for descending.

### 2.6 Standard Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Must be valid email"
      }
    ]
  }
}
```

### 2.7 Rate Limits

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693000000
```

---

## 3. Auth

### 3.1 POST /auth/register

- **Auth:** None
- **Permission:** None
- **Request:** `{ email, password, name }`
- **Response:** `{ user: { id, email, name }, accessToken, refreshToken }`
- **Errors:** 409 EMAIL_EXISTS, 400 VALIDATION_ERROR
- **Rate limit:** 5/min per IP
- **Audit:** Yes

### 3.2 POST /auth/login

- **Auth:** None
- **Permission:** None
- **Request:** `{ email, password }`
- **Response:** `{ user: { id, email, name }, accessToken, refreshToken, organizations: [] }`
- **Errors:** 401 INVALID_CREDENTIALS, 429 TOO_MANY_ATTEMPTS
- **Rate limit:** 10/min per IP
- **Audit:** Yes

### 3.3 POST /auth/refresh

- **Auth:** Refresh token
- **Permission:** None
- **Request:** `{ refreshToken }`
- **Response:** `{ accessToken, refreshToken }`
- **Errors:** 401 INVALID_TOKEN
- **Rate limit:** 20/min

### 3.4 POST /auth/logout

- **Auth:** Bearer
- **Permission:** None
- **Request:** None
- **Response:** 204
- **Errors:** None
- **Audit:** Yes

### 3.5 POST /auth/password-reset-request

- **Auth:** None
- **Permission:** None
- **Request:** `{ email }`
- **Response:** 202 (always, prevent email enumeration)
- **Errors:** None
- **Rate limit:** 3/min per IP

### 3.6 POST /auth/password-reset

- **Auth:** Reset token
- **Permission:** None
- **Request:** `{ token, newPassword }`
- **Response:** 200
- **Errors:** 401 INVALID_TOKEN, 400 VALIDATION_ERROR
- **Audit:** Yes

---

## 4. Users

### 4.1 GET /users/me

- **Auth:** Bearer
- **Permission:** None
- **Response:** `{ id, email, name, createdAt }`
- **Errors:** None

### 4.2 PATCH /users/me

- **Auth:** Bearer
- **Permission:** None
- **Request:** `{ name?, email? }`
- **Response:** `{ id, email, name, updatedAt }`
- **Errors:** 409 EMAIL_EXISTS, 400 VALIDATION_ERROR
- **Audit:** Yes

---

## 5. Organizations

### 5.1 POST /organizations

- **Auth:** Bearer
- **Permission:** Authenticated
- **Request:** `{ name }`
- **Response:** `{ id, name, slug, role: "owner", createdAt }`
- **Errors:** 400 VALIDATION_ERROR
- **Audit:** Yes

### 5.2 GET /organizations

- **Auth:** Bearer
- **Permission:** Authenticated
- **Response:** `{ data: [{ id, name, slug, role, memberCount }] }`
- **Errors:** None

### 5.3 GET /organizations/:id

- **Auth:** Bearer
- **Permission:** org:read
- **Response:** `{ id, name, slug, settings, memberCount, createdAt }`
- **Errors:** 404 NOT_FOUND

### 5.4 PATCH /organizations/:id

- **Auth:** Bearer
- **Permission:** settings:manage
- **Request:** `{ name?, settings? }`
- **Response:** `{ id, name, slug, settings, updatedAt }`
- **Errors:** 404, 403
- **Audit:** Yes

### 5.5 DELETE /organizations/:id

- **Auth:** Bearer
- **Permission:** Owner only
- **Request:** None
- **Response:** 204
- **Errors:** 404, 403, 409 HAS_ACTIVE_RESOURCES
- **Audit:** Yes

---

## 6. Memberships

### 6.1 POST /organizations/:orgId/memberships

- **Auth:** Bearer
- **Permission:** Admin+
- **Request:** `{ email, role }`
- **Response:** `{ id, user: { id, email, name }, role, createdAt }`
- **Errors:** 404 USER_NOT_FOUND, 409 ALREADY_MEMBER, 403
- **Audit:** Yes

### 6.2 GET /organizations/:orgId/memberships

- **Auth:** Bearer
- **Permission:** org:read
- **Response:** `{ data: [{ id, user: { id, email, name }, role, joinedAt }] }`
- **Errors:** 403

### 6.3 PATCH /organizations/:orgId/memberships/:id

- **Auth:** Bearer
- **Permission:** Admin+
- **Request:** `{ role }`
- **Response:** `{ id, user, role, updatedAt }`
- **Errors:** 403, 404, 409 CANNOT_DEMOTE_OWNER
- **Audit:** Yes

### 6.4 DELETE /organizations/:orgId/memberships/:id

- **Auth:** Bearer
- **Permission:** Admin+ (cannot remove Owner)
- **Request:** None
- **Response:** 204
- **Errors:** 403, 404, 409 CANNOT_REMOVE_OWNER
- **Audit:** Yes

---

## 7. Providers

### 7.1 GET /providers

- **Auth:** Bearer
- **Permission:** Authenticated
- **Response:** `{ data: [{ id, name, type, capabilities, status }] }`
- **Description:** List available provider types (Render, Cloudflare, etc.)

### 7.2 GET /providers/:type

- **Auth:** Bearer
- **Permission:** Authenticated
- **Response:** `{ id, name, type, capabilities, status }`

---

## 8. Provider Connections

### 8.1 POST /provider-connections

- **Auth:** Bearer
- **Permission:** provider:connect
- **Request:** `{ providerType, name, credentials: { ... } }`
- **Response:** `{ id, name, providerType, status: "validating", createdAt }`
- **Errors:** 400 VALIDATION_ERROR, 422 PROVIDER_AUTH_FAILED
- **Idempotency:** Yes (client-generated idempotency key)
- **Audit:** Yes

### 8.2 GET /provider-connections

- **Auth:** Bearer
- **Permission:** provider:read
- **Filtering:** `?providerType=render&status=valid`
- **Response:** `{ data: [{ id, name, providerType, status, lastSyncAt, resourceCount }] }`

### 8.3 GET /provider-connections/:id

- **Auth:** Bearer
- **Permission:** provider:read
- **Response:** `{ id, name, providerType, status, capabilities, lastSyncAt, resourceCount, createdAt }`
- **Errors:** 404

### 8.4 PATCH /provider-connections/:id

- **Auth:** Bearer
- **Permission:** provider:manage
- **Request:** `{ name?, credentials? }`
- **Response:** `{ id, name, status, updatedAt }`
- **Errors:** 404, 422 PROVIDER_AUTH_FAILED
- **Audit:** Yes

### 8.5 DELETE /provider-connections/:id

- **Auth:** Bearer
- **Permission:** provider:manage
- **Request:** None
- **Response:** 204
- **Errors:** 404
- **Audit:** Yes

---

## 9. Resources

### 9.1 GET /resources

- **Auth:** Bearer
- **Permission:** resource:read
- **Filtering:** `?provider=render&type=service&status=active&environment=production&search=my-app`
- **Pagination:** Yes
- **Sorting:** Yes (name, type, status, createdAt, lastSyncAt)
- **Response:** `{ data: [{ id, provider, name, type, status, region, environment, providerUrl, capabilities, lastSyncAt }], meta }`

### 9.2 GET /resources/:id

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ id, provider, providerAccountId, providerResourceId, type, name, region, environment, repository, branch, domain, status, providerUrl, capabilities, metadata, lastSyncAt, createdAt }`
- **Errors:** 404

### 9.3 GET /resources/:id/health

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ resourceId, health: "HEALTHY"|"DEGRADED"|"DOWN"|"UNKNOWN", evidence: [...], checkedAt }`
- **Errors:** 404

### 9.4 GET /resources/:id/metrics

- **Auth:** Bearer
- **Permission:** metrics:read
- **Filtering:** `?metric=cpu&from=2024-01-01&to=2024-01-02&interval=1h`
- **Response:** `{ data: [{ timestamp, metric, value, unit }], meta }`
- **Errors:** 404, 422 NOT_SUPPORTED

### 9.5 GET /resources/:id/logs

- **Auth:** Bearer
- **Permission:** logs:read
- **Filtering:** `?from=2024-01-01&to=2024-01-02&level=error&limit=100`
- **Response:** `{ data: [{ timestamp, level, message, metadata }], meta }`
- **Errors:** 404, 422 NOT_SUPPORTED

### 9.6 GET /resources/:id/deployments

- **Auth:** Bearer
- **Permission:** deployment:read
- **Pagination:** Yes
- **Response:** `{ data: [{ id, status, commit, branch, createdAt, finishedAt }], meta }`
- **Errors:** 404

---

## 10. Applications

### 10.1 POST /applications

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** `{ name, description? }`
- **Response:** `{ id, name, description, createdAt }`
- **Errors:** 400 VALIDATION_ERROR, 409 ALREADY_EXISTS
- **Audit:** Yes

### 10.2 GET /applications

- **Auth:** Bearer
- **Permission:** resource:read
- **Filtering:** `?search=my-app`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, name, description, resourceCount, healthStatus, createdAt }], meta }`

### 10.3 GET /applications/:id

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ id, name, description, resources: [...], relations: [...], healthStatus, createdAt }`
- **Errors:** 404

### 10.4 PATCH /applications/:id

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** `{ name?, description? }`
- **Response:** `{ id, name, description, updatedAt }`
- **Errors:** 404
- **Audit:** Yes

### 10.5 DELETE /applications/:id

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** None
- **Response:** 204
- **Errors:** 404
- **Audit:** Yes

### 10.6 POST /applications/:id/resources

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** `{ resourceId, role? }`
- **Response:** `{ applicationId, resourceId, role, createdAt }`
- **Errors:** 404, 409 ALREADY_MAPPED
- **Audit:** Yes

### 10.7 DELETE /applications/:id/resources/:resourceId

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** None
- **Response:** 204
- **Errors:** 404
- **Audit:** Yes

---

## 11. Relations

### 11.1 POST /applications/:id/relations

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** `{ sourceResourceId, targetResourceId, type, confidence?, source? }`
- **Response:** `{ id, source, target, type, confidence, source, createdAt }`
- **Errors:** 404, 400 VALIDATION_ERROR
- **Audit:** Yes

### 11.2 GET /applications/:id/relations

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ data: [{ id, source, target, type, confidence, source, confirmed }] }`

### 11.3 PATCH /relations/:id

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** `{ confirmed?, confidence? }`
- **Response:** `{ id, confirmed, confidence, updatedAt }`
- **Audit:** Yes

### 11.4 DELETE /relations/:id

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** None
- **Response:** 204
- **Audit:** Yes

---

## 12. Deployments

### 12.1 GET /deployments

- **Auth:** Bearer
- **Permission:** deployment:read
- **Filtering:** `?resourceId=xxx&status=failed`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, resource, status, commit, branch, createdAt }], meta }`

### 12.2 GET /deployments/:id

- **Auth:** Bearer
- **Permission:** deployment:read
- **Response:** `{ id, resource, status, commit, branch, metadata, createdAt, finishedAt }`
- **Errors:** 404

### 12.3 POST /deployments/trigger

- **Auth:** Bearer
- **Permission:** deployment:trigger
- **Request:** `{ resourceId, branch?, commit? }`
- **Response:** `{ id, status: "building", createdAt }`
- **Errors:** 404, 422 NOT_SUPPORTED
- **Idempotency:** Yes
- **Audit:** Yes

### 12.4 POST /deployments/:id/rollback

- **Auth:** Bearer
- **Permission:** deployment:rollback
- **Request:** None
- **Response:** `{ id, status: "rolling_back", createdAt }`
- **Errors:** 404, 422 NOT_SUPPORTED
- **Idempotency:** Yes
- **Audit:** Yes

---

## 13. Domains

### 13.1 GET /domains

- **Auth:** Bearer
- **Permission:** resource:read
- **Filtering:** `?applicationId=xxx`
- **Response:** `{ data: [{ id, name, resourceId, applicationId, verified, expiresAt }] }`

### 13.2 GET /domains/:id

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ id, name, resourceId, applicationId, verified, ssl, expiresAt, dnsRecords }`
- **Errors:** 404

---

## 14. Health

### 14.1 GET /health

- **Auth:** Bearer
- **Permission:** resource:read
- **Filtering:** `?applicationId=xxx&resourceId=xxx`
- **Response:** `{ data: [{ entityId, entityType, health, evidence, checkedAt }] }`

### 14.2 GET /health/:entityType/:entityId

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ entityId, entityType, health, evidence: [{ source, value, collectedAt, freshness }], checkedAt }`
- **Errors:** 404

---

## 15. Metrics

### 15.1 GET /metrics

- **Auth:** Bearer
- **Permission:** metrics:read
- **Filtering:** `?resourceId=xxx&metric=cpu&from=...&to=...&interval=1h`
- **Response:** `{ data: [{ timestamp, metric, value, unit, source }], meta }`

### 15.2 GET /metrics/summary

- **Auth:** Bearer
- **Permission:** metrics:read
- **Filtering:** `?applicationId=xxx&from=...&to=...`
- **Response:** `{ cpu: { avg, max }, memory: { avg, max }, ... }`

---

## 16. Logs

### 16.1 GET /logs

- **Auth:** Bearer
- **Permission:** logs:read
- **Filtering:** `?resourceId=xxx&from=...&to=...&level=error&search=text&limit=100`
- **Response:** `{ data: [{ id, timestamp, level, message, metadata, source }], meta }`
- **Bounded:** Max 1000 entries per query

---

## 17. Monitoring

### 17.1 GET /monitoring/status

- **Auth:** Bearer
- **Permission:** resource:read
- **Response:** `{ data: [{ resourceId, lastCheckAt, status, nextCheckAt, stale }] }`

### 17.2 POST /monitoring/check/:resourceId

- **Auth:** Bearer
- **Permission:** resource:manage
- **Request:** None
- **Response:** `{ triggered: true, jobId }`
- **Errors:** 404
- **Audit:** Yes

---

## 18. Alerts

### 18.1 POST /alerts

- **Auth:** Bearer
- **Permission:** alerts:manage
- **Request:** `{ name, condition, threshold, scope: { resourceIds?, applicationIds? }, enabled? }`
- **Response:** `{ id, name, condition, threshold, scope, enabled, createdAt }`
- **Errors:** 400 VALIDATION_ERROR
- **Audit:** Yes

### 18.2 GET /alerts

- **Auth:** Bearer
- **Permission:** alerts:read
- **Filtering:** `?enabled=true&condition=health_degraded`
- **Response:** `{ data: [{ id, name, condition, threshold, scope, enabled, lastTriggeredAt }] }`

### 18.3 GET /alerts/:id

- **Auth:** Bearer
- **Permission:** alerts:read
- **Response:** `{ id, name, condition, threshold, scope, enabled, history: [...] }`
- **Errors:** 404

### 18.4 PATCH /alerts/:id

- **Auth:** Bearer
- **Permission:** alerts:manage
- **Request:** `{ name?, condition?, threshold?, scope?, enabled? }`
- **Response:** `{ id, name, updatedAt }`
- **Errors:** 404
- **Audit:** Yes

### 18.5 DELETE /alerts/:id

- **Auth:** Bearer
- **Permission:** alerts:manage
- **Request:** None
- **Response:** 204
- **Errors:** 404
- **Audit:** Yes

### 18.6 POST /alerts/:id/acknowledge

- **Auth:** Bearer
- **Permission:** alerts:manage
- **Request:** None
- **Response:** `{ id, status: "acknowledged", acknowledgedAt }`
- **Errors:** 404, 409 ALREADY_ACKNOWLEDGED
- **Audit:** Yes

### 18.7 POST /alerts/:id/resolve

- **Auth:** Bearer
- **Permission:** alerts:manage
- **Request:** None
- **Response:** `{ id, status: "resolved", resolvedAt }`
- **Errors:** 404
- **Audit:** Yes

---

## 19. Incidents

### 19.1 GET /incidents

- **Auth:** Bearer
- **Permission:** incidents:read
- **Filtering:** `?status=investigating&resourceId=xxx`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, title, status, severity, affectedResources, createdAt }], meta }`

### 19.2 GET /incidents/:id

- **Auth:** Bearer
- **Permission:** incidents:read
- **Response:** `{ id, title, status, severity, affectedResources, notes, timeline, createdAt }`
- **Errors:** 404

### 19.3 PATCH /incidents/:id

- **Auth:** Bearer
- **Permission:** incidents:manage
- **Request:** `{ status?, severity? }`
- **Response:** `{ id, status, severity, updatedAt }`
- **Errors:** 404
- **Audit:** Yes

### 19.4 POST /incidents/:id/notes

- **Auth:** Bearer
- **Permission:** incidents:manage
- **Request:** `{ content }`
- **Response:** `{ id, note: { id, content, author, createdAt } }`
- **Errors:** 404
- **Audit:** Yes

---

## 20. Sync

### 20.1 POST /sync/provider-connections/:id

- **Auth:** Bearer
- **Permission:** provider:manage
- **Request:** None
- **Response:** `{ jobId, status: "queued" }`
- **Errors:** 404, 409 ALREADY_SYNCING
- **Idempotency:** Yes
- **Audit:** Yes

### 20.2 GET /sync/jobs

- **Auth:** Bearer
- **Permission:** provider:read
- **Filtering:** `?connectionId=xxx&status=running`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, connectionId, status, startedAt, completedAt, resourcesDiscovered, errors }], meta }`

### 20.3 GET /sync/jobs/:id

- **Auth:** Bearer
- **Permission:** provider:read
- **Response:** `{ id, connectionId, status, startedAt, completedAt, resourcesDiscovered, errors, details }`
- **Errors:** 404

---

## 21. Chat

### 21.1 POST /chat/sessions

- **Auth:** Bearer
- **Permission:** chat:use
- **Request:** None
- **Response:** `{ id, createdAt }`

### 21.2 GET /chat/sessions

- **Auth:** Bearer
- **Permission:** chat:use
- **Pagination:** Yes
- **Response:** `{ data: [{ id, title, messageCount, createdAt }], meta }`

### 21.3 GET /chat/sessions/:id

- **Auth:** Bearer
- **Permission:** chat:use
- **Response:** `{ id, messages: [{ id, role, content, tools: [...], createdAt }], createdAt }`
- **Errors:** 404

### 21.4 POST /chat/sessions/:id/messages

- **Auth:** Bearer
- **Permission:** chat:use
- **Request:** `{ content }`
- **Response:** `{ id, role: "assistant", content, tools: [{ name, args, result }], createdAt }`
- **Errors:** 404, 429 RATE_LIMITED
- **Streaming:** SSE optional
- **Audit:** Yes

### 21.5 GET /chat/tools

- **Auth:** Bearer
- **Permission:** chat:use
- **Response:** `{ data: [{ name, description, parameters }] }`

---

## 22. Audit

### 22.1 GET /audit

- **Auth:** Bearer
- **Permission:** audit:read
- **Filtering:** `?actorId=xxx&action=login&resourceType=provider_connection&from=...&to=...`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, actor, action, resourceType, resourceId, timestamp, ip, userAgent, result }], meta }`

### 22.2 GET /audit/:id

- **Auth:** Bearer
- **Permission:** audit:read
- **Response:** `{ id, actor, action, resourceType, resourceId, details, timestamp, ip, userAgent, result }`
- **Errors:** 404

---

## 23. Settings

### 23.1 GET /organizations/:orgId/settings

- **Auth:** Bearer
- **Permission:** settings:manage
- **Response:** `{ syncInterval, monitoringInterval, alertNotifications, retentionMetrics, retentionLogs, retentionAudit }`

### 23.2 PATCH /organizations/:orgId/settings

- **Auth:** Bearer
- **Permission:** settings:manage
- **Request:** `{ syncInterval?, monitoringInterval?, alertNotifications?, retentionMetrics?, retentionLogs?, retentionAudit? }`
- **Response:** `{ ...updated }`
- **Errors:** 400 VALIDATION_ERROR
- **Audit:** Yes

---

## 24. Notifications

### 24.1 GET /notifications

- **Auth:** Bearer
- **Permission:** Authenticated
- **Filtering:** `?read=false`
- **Pagination:** Yes
- **Response:** `{ data: [{ id, type, title, message, read, createdAt }], meta }`

### 24.2 PATCH /notifications/:id

- **Auth:** Bearer
- **Permission:** Authenticated
- **Request:** `{ read: true }`
- **Response:** `{ id, read: true }`

### 24.3 POST /notifications/read-all

- **Auth:** Bearer
- **Permission:** Authenticated
- **Request:** None
- **Response:** 204

---

## 25. Health (System)

### 25.1 GET /health/live

- **Auth:** None
- **Response:** `{ status: "ok" }`

### 25.2 GET /health/ready

- **Auth:** None
- **Response:** `{ status: "ok", checks: { database: "ok", redis: "ok" } }`
