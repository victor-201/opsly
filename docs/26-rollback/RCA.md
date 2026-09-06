# T-042 — Bug Fix / Rollback Loop: RCA & Regression

**Date**: 2026-09-06
**Commits**: `fc82070` (fixes), `31cb700` (monitoring evidence)
**Status**: CLOSED — all detected production bugs fixed, regression-tested, re-deployed, monitored.

## Detected Bugs

| # | Symptom in production | Root Cause | Fix | Status |
|---|-----------------------|------------|-----|--------|
| 1 | `POST /provider-connections` always `400 "property credentials should not exist"` | `CreateProviderConnectionDto.credentials` lacked `@IsObject()`; with `forbidNonWhitelisted: true` every request was rejected | Added `@IsObject()` to DTO (`apps/api/src/providers/dto/create-provider-connection.dto.ts`) | FIXED + verified (T-040, E2E #1) |
| 2 | `registry.getAdapter()` threw `NotFoundException` — connections never reached adapter validation | Production `ProviderRegistry` never registered the 5 adapters (registration only existed in unit-test bootstrap) | `ProviderRegistry` implements `OnModuleInit`, registers `render`, `cloudflare`, `neon`, `upstash`, `mongodb-atlas` from `@opsly/provider-core` | FIXED + verified (T-040, E2E #1/#2/#4: real validation messages returned) |
| 3 | API process crashed with `PrismaClientKnownRequestError` (`Can't reach database server at 'db:5432'`), Docker restart loop | `@Cron` jobs in `MonitoringService` (`checkStaleResources` 5-min, `evaluateAlertConditions` 15-min) ran `prisma` queries with no error handling; a transient DB error became an unhandled rejection killing the process | Wrapped both cron bodies in try/catch with structured `Logger.error` output | FIXED + verified (T-041: 0 errors observed; regression tests below) |

## Detection

- Bug 1 & 2 surfaced during T-040 provider E2E probe (repeated `400`/`NotFoundException`).
- Bug 3 surfaced as container crash-loops during T-039/T-040 smoke/E2E windows.

## Containment

- No destructive actions were ever performed against provider accounts; all
  failed connections were persisted with `status: invalid` and error detail.
- Docker restart policy (`unless-stopped`) auto-recovered the app; no data loss.

## Validation

- T-040 E2E: 5/5 PASS (validation-path + graceful failure + persistence).
- T-041 monitoring: health/readiness 10/10, DB healthy, 0 errors in observed window.
- Unit: 29/29 PASS (including 4 new regression tests), typecheck clean.

## Root Cause Analysis (formal)

- **Bug 1** — Validation configuration mismatch: DTO decorators did not cover a
  required property under `whitelist` + `forbidNonWhitelisted` ValidationPipe config
  (`main.ts`). Design rule violated: *every DTO property must be fully decorated*.
- **Bug 2** — Dependency-injection gap: adapters were registered only in test setup,
  not at runtime. Design rule violated: *production composition must be identical to
  what tests exercise*.
- **Bug 3** — Missing failure-containment in background jobs: cron bodies assumed DB
  availability; no try/catch, so infra errors escalated to process exit. Design rule
  violated: *background jobs must never take down the process on transient infra errors*.

## Regression Tests Added

File: `apps/api/test/unit/monitoring.service.spec.ts`

| Test | Guards against |
|------|----------------|
| `checkStaleResources` does not throw on DB error | Bug 3 (process crash) |
| `evaluateAlertConditions` does not throw on DB error | Bug 3 (process crash) |
| `checkStaleResources` succeeds when DB reachable | Workflow intact |
| alert created for degraded resource without active alert | Alert workflow not broken by refactor |

## Monitoring (post-fix)

- Cron jobs run on schedule with no unhandled rejection (T-041 log analysis).
- Container `RestartCount` reflects environmental WSL2 restarts only; no app-initiated
  crash observed after fixes.

## Preventive Measures

- Production registration of adapters now lives in the service's `OnModuleInit`
  (single source of truth) — no separate test-only bootstrap.
- All `@Cron` handlers documented as must-catch-error pattern; regression suite covers it.
- E2E probes included in repo (`probe-e2e.mjs`, `probe-monitoring.mjs`, `probe-dbcount.mjs`)
  for repeatable production validation.