# T-045 — Official Production

**Date**: 2026-09-06
**Release version**: v0.1.0
**Git tag**: `v0.1.0` (annotated, commit `3efc091`)
**Status**: FROZEN — official production version recorded

## Release Artifact Record

| Field | Value |
|-------|-------|
| Version | `0.1.0` |
| Git tag | `v0.1.0` |
| Commit | `3efc091` |
| Tagger | Victor-201 <4.victor.201@gmail.com> |
| Tag date | 2026-09-06 23:35:24 UTC+7 |
| Gate | T-044 APPROVED (6/6 criteria PASS) |

## Frozen Artifact

- **Docker image**: `opsly-api:latest` (multi-stage Alpine build, Prisma Client v5.22.0)
- **Compose stack**: `opsly-api` (port 3000) + `opsly-db` (postgres:16-alpine, port 5432)
- **Database schema**: 25 models, `db push` applied at container boot
- **Git**: tag `v0.1.0` on `main` branch

## Tag Composition

| Phase | Description | Commit(s) |
|-------|-------------|-----------|
| T-001–T-005 | Discovery | `35a7e7f` |
| T-006–T-018 | Specs & design | `35a7e7f`–`ec67760` |
| T-019–T-031 | Implementation (22 modules) | `35a7e7f`–`ec67760` |
| T-032–T-036 | Audits & tests | `9d9833c`–`fd288dd` |
| T-037 | Pre-production validation | `ec67760` |
| T-038 | Deployment evidence | `a2c89fc` |
| T-039 | Production smoke test | `a2c89fc` |
| T-040 | Provider E2E (bug fixes) | `fc82070` |
| T-041 | Production monitoring | `31cb700` |
| T-042 | Bug fix/rollback + regression | `e6af934` |
| T-043 | Final audit + middleware fix | `3efc091` |
| T-044 | Release approval gate | `3efc091` |
| T-045 | Official production freeze | `3efc091` |

## How to Deploy

```bash
# Clone at the frozen tag
git clone --branch v0.1.0 <repo-url>
cd opsly

# Build and run
docker compose build api
docker compose up -d

# Verify
docker exec opsly-api-1 wget -qO- http://127.0.0.1:3000/api/v1/health/live
# => {"status":"ok"}
```

## Rollback

```bash
# Revert to previous version
git revert HEAD   # or checkout earlier tag and rebuild
docker compose build api && docker compose up -d
```