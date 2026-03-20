# ProjectOpsOS — Deploy Guide

> **Version**: 0.1.0
> **Last updated**: 2026-03-19

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | v2 (built into Docker Desktop) | Multi-container orchestration |
| Node.js | 22 LTS | Local development only |
| pnpm | 10+ | Package manager (local dev only) |
| PostgreSQL | 16 (provided via Docker) | Primary database |

---

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repo-url>
cd ProjectOpsOS

# 2. Configure environment
cp .env.example .env
# Edit .env if needed — defaults work for local development

# 3. Install dependencies
pnpm install

# 4. Start PostgreSQL via Docker
docker compose up -d

# 5. Apply database schema
pnpm db:push

# 6. Seed sample data
pnpm db:seed

# 7. Start development server
pnpm dev
```

The application will be available at **http://localhost:3000**.

### Default Seed Users

| Email | Password | Role (Vai tro) |
|-------|----------|------|
| admin@projectopsos.local | admin123456 | admin |
| manager@projectopsos.local | admin123456 | manager |
| lead@projectopsos.local | admin123456 | lead |
| member@projectopsos.local | admin123456 | member |
| viewer@projectopsos.local | admin123456 | viewer |

---

## Production Deployment

### Step 1: Configure Environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with real values:

```env
NODE_ENV=production
APP_PORT=3000

POSTGRES_USER=projectops
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=projectops
DATABASE_URL=postgresql://projectops:<password>@db:5432/projectops

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

### Step 2: Deploy with Docker Compose

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 3: Apply Database Schema

```bash
docker exec projectopsosdb-app pnpm db:push
```

### Step 4: Seed Initial Data

```bash
docker exec projectopsosdb-app pnpm db:seed
```

### Step 5: Verify

```bash
# Check all services are healthy
docker compose -f docker-compose.prod.yml ps

# Test health endpoint
curl http://localhost:3000/api/health
```

### Automated Deployment

Use the included deploy script for zero-downtime deployments:

```bash
./scripts/deploy.sh
```

The script performs:
1. Pre-flight checks (`.env.production` exists, Docker installed)
2. Git pull (if in a git repo)
3. Build new Docker image
4. Start/wait for healthy database
5. Run database migrations
6. Deploy new application container
7. Wait for health check to pass
8. Start nginx reverse proxy (if configured)
9. Clean up dangling images

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`) |
| `APP_PORT` | No | `3000` | Application port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `POSTGRES_USER` | Yes (Docker) | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes (Docker) | — | PostgreSQL password |
| `POSTGRES_DB` | No | `projectops` | PostgreSQL database name |
| `NEXTAUTH_URL` | Yes | — | Public URL where the app is accessible |
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret (min 16 chars). Generate: `openssl rand -base64 32` |

---

## Architecture Overview

```
                    ┌─────────────┐
                    │   Nginx     │  :80/:443
                    │  (reverse   │  TLS termination
                    │   proxy)    │  rate limiting
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Next.js 15 │  :3000
                    │  App Router │  Server Actions
                    │  + Auth.js  │  RBAC middleware
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │  :5432
                    │     16      │  Drizzle ORM
                    └─────────────┘
```

### Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Authentication**: Auth.js (NextAuth v5) with Credentials provider + JWT
- **UI**: Tailwind CSS 4 + shadcn/ui components + Lucide icons
- **Validation**: Zod schemas on all boundaries
- **Reverse Proxy**: Nginx 1.27 (TLS, gzip, rate limiting)

### 10 Application Modules

| # | Module | Vietnamese Label | Description |
|---|--------|-----------------|-------------|
| 1 | Projects (Du an) | Quan ly du an | Project lifecycle with 8-stage FSM |
| 2 | Handovers (Ban giao) | Quan ly ban giao | Handover tracking with approval workflow |
| 3 | Documents (Tai lieu) | Quan ly tai lieu | Document management with versioning |
| 4 | Tasks (Cong viec) | Quan ly cong viec | Task tracking with Kanban board |
| 5 | Notifications (Thong bao) | Thong bao | Real-time notification system |
| 6 | Audit Logs (Nhat ky) | Nhat ky hoat dong | Immutable audit trail |
| 7 | Finance (Tai chinh) | Quan ly tai chinh | Financial records with CSV import |
| 8 | Dashboard (Tong quan) | Bang dieu khien | Executive overview with charts |
| 9 | Reports (Bao cao) | Bao cao | CSV/JSON report generation |
| 10 | Compliance (Tuan thu) | Tuan thu | Compliance monitoring dashboard |

### RBAC — 5-Tier Role Hierarchy

| Role | Level | Capabilities |
|------|-------|-------------|
| admin | 100 | Full system access, user management |
| manager | 80 | Project management, approvals, finance |
| lead | 60 | Team operations, task assignment |
| member | 40 | Own work, create/edit within scope |
| viewer | 20 | Read-only access |

---

## Docker Services

The production stack (`docker-compose.prod.yml`) includes 3 services:

| Service | Container Name | Image | Port |
|---------|---------------|-------|------|
| `app` | projectopsosdb-app | Custom (Dockerfile) | 3000 |
| `db` | projectopsosdb | postgres:16-alpine | 5432 (internal) |
| `nginx` | projectopsosdb-nginx | nginx:1.27-alpine | 80, 443 |

### Docker Image

The Dockerfile uses a 3-stage multi-stage build:

1. **deps**: Install dependencies with `pnpm install --frozen-lockfile`
2. **builder**: Build Next.js with `pnpm build` (standalone output)
3. **runner**: Minimal Alpine image with non-root `nextjs` user

Health check: `wget --spider http://localhost:3000/api/health` (30s interval)

---

## Monitoring

### Health Check

```bash
GET /api/health
```

Returns `200 OK` when the application is running and responsive.

### Logging

- **Development**: Human-readable console output
- **Production**: Structured JSON logs via `src/lib/logger.ts`
- **Nginx**: Access logs at `/var/log/nginx/access.log`, error logs at `/var/log/nginx/error.log`

### Error Tracking

- Global `uncaughtException` and `unhandledRejection` handlers configured
- Error normalization in `src/lib/error-tracking.ts`
- Placeholder for Sentry integration (set `SENTRY_DSN` env var)

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main`/`develop` and PRs to `main`:

| Job | Steps |
|-----|-------|
| **lint-typecheck** | Install deps, `tsc --noEmit`, `eslint` |
| **test** | Install deps, `vitest run --coverage`, upload coverage artifact |
| **build** | Install deps, `next build` (depends on lint + test passing) |

---

## SSL/TLS Configuration

The nginx configuration expects SSL certificates at:

```
nginx/certs/fullchain.pem
nginx/certs/privkey.pem
```

For Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# Copy to project
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/
```

---

## Database Management

### Schema Changes

```bash
# Generate migration files
pnpm db:generate

# Apply schema to database
pnpm db:push

# Open Drizzle Studio (visual DB explorer)
pnpm db:studio
```

### Backup & Restore

```bash
# Backup
docker exec projectopsosdb pg_dump -U projectops projectops > backup.sql

# Restore
docker exec -i projectopsosdb psql -U projectops projectops < backup.sql
```

---

## Security Checklist

See `docs/security-checklist.md` for the full audit. Key highlights:

- Auth.js with JWT strategy and bcrypt password hashing
- RBAC with 41 permissions across 7 modules
- Zod validation on all server action inputs
- Drizzle ORM (parameterized queries, no SQL injection)
- CSP headers, HSTS, X-Frame-Options via nginx + middleware
- Rate limiting at nginx (30r/s) and application level
- Immutable audit log for all mutations
- No hardcoded secrets; all env vars validated via Zod
