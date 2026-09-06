# T-041 — Production Monitoring Verification

**Date**: 2026-09-06
**Environment**: Docker Compose (`opsly-api-1`, `opsly-db-1`) on localhost:3000

## Checks

### Health / Readiness (probe-monitoring.mjs, in-container)

| Check | Result |
|-------|--------|
| `GET /api/v1/health/live` | 5/5 ok, avg 2.8ms, max 5ms |
| `GET /api/v1/health/ready` | 5/5 ok, avg 2.8ms, max 5ms (database: ok) |
| Total | **10/10 PASS** |

### Database

| Table | Row count |
|-------|-----------|
| User | 7 |
| Organization | 5 |
| ProviderConnection | 3 |
| AuditLog / Incident / Alert / Resource / Application | 0 (empty, expected — no production workloads yet) |

- DB container health: `healthy` (`pg_isready` passing continuously).
- Datasource: PostgreSQL `opsly` on `db:5432`, schema `public`, in sync with Prisma schema.

### Logs / Error Rate

- API log volume (30 min window): 598 lines — normal startup + request logging.
- Errors in last 20 min: **0**.
- No `PrismaClientKnownRequestError` / unhandled rejection / crash since the monitoring
  cron hardening fix (commit `fc82070`).

### Background Jobs (cron)

- `checkStaleResources` 5-min cycle: runs cleanly; with no stale resources, logs
  DEBUG only.
- `evaluateAlertConditions` 15-min cycle: runs cleanly; no failed resources to alert on.
- Earlier crash signature (`Can't reach database server at 'db:5432'`) no longer appears;
  transient DB errors are caught and logged, not fatal (T-042 regression).

### Incidents / Alerts

- `Incident` count: 0 (no incidents raised).
- `Alert` count: 0 (no failing resources to alert on).

## Known Environmental Caveat

- WSL2-backed Docker occasionally restarts the whole compose stack (all containers
  together, ExitCode 0, `RestartCount=0`). This is host-level Docker/WSL2 flakiness,
  not an application fault. After each environmental restart the API and DB come back
  healthy and health checks pass. Uptime therefore reflects host restart cycles rather
  than application instability.