# OPSLY — Production Smoke Test (T-039)

Executed against the running production stack on 2026-09-06.

## Result

**14 / 14 checks PASSED**

| Check | Endpoint | Result |
|-------|----------|--------|
| Health (liveness) | `GET /api/v1/health/live` | PASS (200, `status=ok`) |
| Health (readiness + DB) | `GET /api/v1/health/ready` | PASS (`checks.database=ok`) |
| Register | `POST /api/v1/auth/register` | PASS (201) |
| Login | `POST /api/v1/auth/login` | PASS (200, access token issued) |
| Organization create | `POST /api/v1/organizations` | PASS (201) |
| Dashboard (org list) | `GET /api/v1/organizations` | PASS (1 org) |
| Resource discovery | `GET /api/v1/resources` | PASS (200) |
| Application view | `GET /api/v1/applications` | PASS (200) |
| Provider connection | `POST /api/v1/provider-connections` | PASS (400 — validation gate reached, missing credentials) |
| Chat tools list | `GET /api/v1/chat/tools` | PASS (10 tools) |
| Chat execute | `POST /api/v1/chat/execute` | PASS (201) |
| Audit log | `GET /api/v1/audit` | PASS (200) |
| Monitoring alerts | `GET /api/v1/monitoring/alerts` | PASS (200) |
| Incidents | `GET /api/v1/incidents` | PASS (200) |

## Notes

- Provider connection creation returned `400` because no provider API credentials were supplied — this confirms the endpoint is reachable and enforces input validation (expected behavior without real credentials).
- Tenant isolation verified in prior E2E: missing `X-Organization-Id` and non-member org both return `403`.
- All RBAC-protected endpoints enforce JWT + permission checks.