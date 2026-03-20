# Step 31: CI/CD + Observability — Build Report

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `.github/workflows/ci.yml` | GitHub Actions CI pipeline (lint, test, build) |
| 2 | `.github/workflows/cd.yml` | GitHub Actions CD pipeline (build image, deploy staging, deploy production) |
| 3 | `src/lib/logger.ts` | Structured JSON logger (prod) / console logger (dev) |
| 4 | `src/lib/error-tracking.ts` | Error capture + global handler stub |
| 5 | `src/middleware.ts` | Request ID injection, response time tracking, request logging |
| 6 | `tests/lib/logger.test.ts` | Logger output format + log level tests (7 tests) |
| 7 | `tests/lib/error-tracking.test.ts` | Error capture + normalization tests (7 tests) |

## Files Updated

| # | File | Change |
|---|------|--------|
| 1 | `src/app/api/health/route.ts` | Enhanced with DB connectivity check, uptime, version, degraded status |

## CI Pipeline (ci.yml)

- **Trigger**: Push to `main`/`develop`, PR to `main`
- **Jobs**: `lint-typecheck` → `test` (with coverage) → `build` (depends on both)
- **Runtime**: Node.js 22, pnpm 10, pnpm cache enabled
- **Concurrency**: Cancel-in-progress per branch
- **Secrets**: All env vars via `${{ secrets.* }}` — no hardcoded values

## CD Pipeline (cd.yml)

- **Trigger**: Runs after CI workflow succeeds on `main`
- **Jobs**: `build-image` → `deploy-staging` → `deploy-production`
- **Registry**: GitHub Container Registry (ghcr.io)
- **Approval gate**: `production` environment requires manual approval (GitHub environment protection rules)
- **Image tags**: Git SHA + `latest` for default branch

## Observability

### Logger (`src/lib/logger.ts`)
- Production: structured JSON (`{"timestamp","level","message","context"}`)
- Development: human-readable (`[timestamp] LEVEL message {context}`)
- Levels: debug (dev only), info, warn, error
- Named exports: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`

### Middleware (`src/middleware.ts`)
- Injects `x-request-id` header (preserves existing or generates UUID)
- Tracks `x-response-time` header
- JSON request log in production mode

### Health Check (`src/app/api/health/route.ts`)
- Checks DB connectivity via `SELECT 1`
- Returns: `{ status, db: { status, latencyMs }, uptime, version, timestamp }`
- Returns 503 with `"degraded"` status when DB is unreachable

### Error Tracking (`src/lib/error-tracking.ts`)
- `captureError(error, context)` — normalizes any error type, logs structured data
- `installGlobalErrorHandlers()` — attaches `uncaughtException` / `unhandledRejection` handlers
- Placeholder comment for Sentry integration

## Verification

```
✅ tsc --noEmit         — 0 errors
✅ vitest run           — 14/14 tests passed (259ms)
```

## pACS Self-Rating

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F — Faithfulness** | 5 | All 6 sub-deliverables implemented per spec. CI/CD triggers, jobs, and caching match requirements. Logger provides JSON/pretty dual mode. Health check queries DB. Error tracking includes captureError + global handlers. |
| **C — Completeness** | 5 | All files from spec created: ci.yml, cd.yml, logger.ts, error-tracking.ts, middleware.ts, health route update, 2 test files (14 tests). Named exports throughout. No secrets in CI config. |
| **L — Loyalty** | 5 | Follows CONVENTIONS.md: camelCase functions, named exports, kebab-case files, single quotes, 2-space indent, `@/` path aliases, Vitest test structure, Zod-validated env reference in health check. |
| **T — Testability** | 5 | 14 tests cover: logger format (dev/prod), log level routing (console.error/warn/log), debug suppression in prod, error normalization (Error/string/unknown), context propagation, logger.error integration. All pass. |
