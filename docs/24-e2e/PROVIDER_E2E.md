# T-040 — Production E2E: Provider Integrations

**Date**: 2026-09-06
**Environment**: Docker Compose (`opsly-api-1`, `opsly-db-1`) on localhost:3000
**Version**: 0.1.0

## Scope

Validate real provider integrations where authorized. No destructive actions were
taken against live provider accounts. Validation exercised the full production chain:
DTO validation -> ProviderRegistry adapter resolution -> adapter validation -> real
provider API call (where credentials supplied) -> graceful failure -> DB persistence.

## Production Bugs Found & Fixed

### Bug 1 — Provider connection creation rejected by ValidationPipe

- **Symptom**: `POST /api/v1/provider-connections` always returned
  `400 "property credentials should not exist"`.
- **Root cause**: `CreateProviderConnectionDto.credentials` lacked `@IsObject()`.
  With `whitelist: true` + `forbidNonWhitelisted: true`, any `credentials` property
  was stripped/rejected.
- **Fix**: Added `@IsObject()` decorator and import in
  `apps/api/src/providers/dto/create-provider-connection.dto.ts`.

### Bug 2 — No provider adapters registered at runtime

- **Symptom**: `ProviderRegistry.getAdapter()` threw `NotFoundException`, so no
  connection could reach adapter-level validation.
- **Root cause**: Adapters were only registered in the unit-test bootstrap; the
  production `ProviderRegistry` never registered the 5 adapters.
- **Fix**: `ProviderRegistry` now implements `OnModuleInit` and registers all 5
  adapters (`render`, `cloudflare`, `neon`, `upstash`, `mongodb-atlas`) from
  `@opsly/provider-core` in
  `apps/api/src/providers/provider-registry.service.ts`.

### Bug 3 — Scheduler crash-loop on DB blip (stability)

- **Symptom**: API process crashed with `PrismaClientKnownRequestError`
  (`Can't reach database server at 'db:5432'`) from a scheduled job, causing Docker
  to restart the container.
- **Root cause**: `@Cron` jobs in `MonitoringService` (`checkStaleResources`,
  `evaluateAlertConditions`) ran `prisma` queries with no error handling; a transient
  DB connection error became an unhandled rejection that killed the process.
- **Fix**: Wrapped both cron bodies in try/catch with structured `Logger.error`
  output in `apps/api/src/monitoring/monitoring.service.ts`.

## E2E Results

Executed inside the API container against `http://127.0.0.1:3000/api/v1`.

| # | Request | Expected | Actual | Status |
|---|---------|----------|--------|--------|
| 1 | `POST /provider-connections` render, `credentials: {}` | 400 with adapter message | `400 {"message":"Provider validation failed: API key is required"}` | PASS |
| 2 | `POST /provider-connections` render, fake apiKey | real API call attempted, graceful failure | `400 {"message":"Provider validation failed: API returned 401"}` | PASS |
| 3 | `POST /provider-connections` `providerType: nope` | 400 enum validation | `400 {"message":["providerType must be one of the following values: render, cloudflare, neon, upstash, mongodb-atlas"]}` | PASS |
| 4 | `POST /provider-connections` cloudflare, `credentials: {}` | adapter reaches validation | `400 {"message":"Provider validation failed: API token and account ID are required"}` | PASS |
| 5 | `GET /provider-connections` | 3 records persisted with `invalid` status | `200`, count=3, all `status:"invalid"` with `lastSyncError` populated | PASS |

## Outcome

- 5/5 E2E checks PASS.
- Registered adapters confirmed reachable for `render` and `cloudflare`; neon,
  upstash, mongodb-atlas registered through the same mechanism.
- Connection failures are non-destructive: real API calls made only with supplied
  credentials, no destructive actions performed; records persisted with
  `status: invalid` and error detail.
- Full live provider credential validation is only possible with real user-owned
  API keys, which are outside this environment's control.

## Artifacts

- Probe script: `probe-e2e.mjs`
- Fix commits (working tree, pending commit): DTO `@IsObject()`, registry
  `OnModuleInit`, monitoring cron error handling, `vitest.config.ts`
- Unit regression: 25/25 tests pass after fixes.