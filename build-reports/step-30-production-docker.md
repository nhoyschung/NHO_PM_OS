# Step 30: Production Docker + Deploy Config

## Status: COMPLETE

## Summary

Created production-ready Docker configuration for deploying the ProjectOpsOS Next.js application with PostgreSQL, Nginx reverse proxy, and zero-downtime deploy scripts.

## Files Created

| # | File | Purpose |
|---|------|---------|
| 30.1 | `Dockerfile` | Multi-stage build (deps -> build -> runner) with Node.js 22 Alpine |
| 30.2 | `docker-compose.prod.yml` | Production compose: app + db + nginx services |
| 30.3 | `.env.production.example` | Environment template with placeholder secrets |
| 30.4 | `nginx/nginx.conf` | Reverse proxy with SSL, gzip, security headers, rate limiting |
| 30.5a | `scripts/deploy.sh` | Zero-downtime deploy: build, migrate, swap, health check |
| 30.5b | `scripts/db-migrate.sh` | Database migration runner with pre/post health checks |
| 30.6 | `.dockerignore` | Excludes node_modules, .next, .git, tests, secrets |
| 30.7 | `src/app/api/health/route.ts` | Health check endpoint for Docker HEALTHCHECK |

## Files Modified

| File | Change |
|------|--------|
| `next.config.ts` | Added `output: "standalone"` for Docker standalone builds |
| `src/modules/reports/actions.ts` | Moved `exportToCsv` to `csv-utils.ts` (fix: sync function in `'use server'` file) |
| `src/modules/reports/csv-utils.ts` | **New** — Pure CSV utility extracted from actions |
| `tests/modules/reports/reports.test.ts` | Updated import path for `exportToCsv` |
| `src/app/(partner)/` -> `src/app/partner/` | Renamed route group to actual URL segment (fix: ambiguous route `/projects/[*]`) |

## Pre-existing Issues Fixed

### 1. Ambiguous Route Pattern
- **Problem**: `(dashboard)/projects/[slug]` and `(partner)/projects/[id]` both resolved to `/projects/[*]` because route groups `()` are transparent in Next.js URL resolution.
- **Fix**: Renamed `(partner)` to `partner` (actual URL segment), so partner routes are at `/partner/projects/[id]`.
- **Impact**: Partner sidebar already referenced `/partner/projects` URLs, so no link changes needed.

### 2. Sync Function Export in 'use server' File
- **Problem**: `exportToCsv` was a non-async exported function in a `'use server'` file. Next.js production build requires all exports from server action files to be async.
- **Fix**: Extracted `exportToCsv` and `escapeCsvField` to `src/modules/reports/csv-utils.ts`. Updated import in actions and test files.

## Docker Image Details

| Metric | Value |
|--------|-------|
| Base image | `node:22-alpine` |
| Build stages | 3 (deps, builder, runner) |
| Final image size | **287 MB** |
| User | `nextjs` (non-root, UID 1001) |
| Exposed port | 3000 |
| Health check | `wget http://localhost:3000/api/health` every 30s |

## Architecture

```
Internet -> Nginx (80/443) -> Next.js App (3000) -> PostgreSQL (5432)
                |                    |
           SSL termination     standalone server
           gzip compression    non-root user
           security headers    health check
           rate limiting       ENV injection
```

## Verification

- [x] `tsc --noEmit` passes (0 errors)
- [x] `docker build -t projectopsosdb-app .` succeeds
- [x] Image size: 287 MB (multi-stage minimized)
- [x] Non-root user (`nextjs:nodejs`)
- [x] No secrets in Dockerfile or docker-compose
- [x] Health checks on both app and db services
- [x] `.dockerignore` excludes sensitive files

## Security Measures

1. **Non-root user**: `nextjs` (UID 1001) in production image
2. **No secrets baked in**: All via environment variables / `.env.production`
3. **Nginx security headers**: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
4. **Rate limiting**: 30 req/s per IP on API routes
5. **TLS 1.2+**: Modern cipher configuration
6. **Minimal image**: Only standalone output + static files copied to runner stage

## pACS Self-Rating

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **F** (Faithfulness) | 9/10 | All spec items implemented. Nginx is included as recommended. |
| **C** (Completeness) | 9/10 | Dockerfile, compose, env template, nginx, deploy scripts, dockerignore, health check all present. |
| **L** (Logical Soundness) | 9/10 | Multi-stage build is correct. Standalone output properly configured. Two pre-existing build issues discovered and fixed. |
| **T** (Technical Accuracy) | 9/10 | Docker build verified successfully. Image runs Node.js 22 Alpine with proper standalone server. |

## Deploy Instructions

```bash
# 1. Configure environment
cp .env.production.example .env.production
# Edit .env.production with real values

# 2. Place SSL certificates
mkdir -p nginx/certs
# Copy fullchain.pem and privkey.pem to nginx/certs/

# 3. Deploy
bash scripts/deploy.sh
```
