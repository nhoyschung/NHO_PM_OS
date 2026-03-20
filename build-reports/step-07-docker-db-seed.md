# Build Report: Step 07 — Dev Docker + DB Migration + Seed Data

**Date**: 2026-03-19
**Agent**: @foundation-builder
**Status**: COMPLETE

---

## Deliverables

| # | Deliverable | Path | Status |
|---|------------|------|--------|
| 1 | Docker Compose (PostgreSQL 16) | `docker-compose.yml` | Created |
| 2 | Environment variables (.env) | `.env` | Created |
| 3 | Migration runner script | `scripts/migrate.ts` | Created |
| 4 | Seed data script | `scripts/seed.ts` | Created |
| 5 | Generated migration SQL | `drizzle/0000_bouncy_pyro.sql` | Generated |
| 6 | Package.json scripts | `package.json` | Updated |

---

## What Was Done

### 1. Docker Compose (`docker-compose.yml`)
- PostgreSQL 16 Alpine image
- Container name: `projectopsosdb`
- Port mapping: `5432:5432`
- Persistent volume: `pgdata`
- Health check: `pg_isready` every 5s with 5 retries
- Note: Removed obsolete `version` attribute per Docker Compose v2 standard

### 2. Environment Variables (`.env`)
- `DATABASE_URL`: PostgreSQL connection string (localhost:5432)
- `NEXTAUTH_URL`: http://localhost:3000
- `NEXTAUTH_SECRET`: Development-only secret (32+ chars)
- `.env.example` already existed and was left unchanged

### 3. Scripts Added to `package.json`
```
db:generate  — drizzle-kit generate
db:push      — drizzle-kit push
db:migrate   — tsx scripts/migrate.ts
db:seed      — tsx scripts/seed.ts
db:studio    — drizzle-kit studio
```

### 4. Migration Runner (`scripts/migrate.ts`)
- Uses `drizzle-orm/postgres-js/migrator`
- Loads env via `dotenv/config`
- Single connection (`max: 1`), auto-closes after migration

### 5. Seed Script (`scripts/seed.ts`)
- **Data SOT**: `refs/ref-seed-data.md`
- **Idempotent**: Checks existence before insert (by primary key)
- **Password hashing**: bcryptjs with 12 salt rounds
- **Execution order**: Departments -> Roles -> Users -> Projects -> Tasks

Seeded data summary:

| Entity | Count | Details |
|--------|-------|---------|
| Departments | 7 | BGD, TECH, PROD, SALES, HR, FIN, OPS |
| Roles | 5 | admin (L100), manager (L80), lead (L60), member (L40), viewer (L20) |
| Users | 5 | admin, manager, lead, member, viewer |
| Projects | 3 | PRJ-001 (in_progress), PRJ-002 (planning), PRJ-003 (review) |
| Tasks | 3 | TSK-001 (done), TSK-002 (in_progress), TSK-003 (todo) |

### 6. Drizzle Migration Generated
- `drizzle-kit generate` produced `drizzle/0000_bouncy_pyro.sql`
- 19 tables, all indexes, all enum types

---

## Verification Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| `docker compose ps` shows healthy | Running (healthy) | Running (healthy) | YES |
| `SELECT count(*) FROM departments` | 7 | 7 | YES |
| `SELECT count(*) FROM roles` | 5 | 5 | YES |
| `SELECT count(*) FROM users` (admin role) | 1 | 1 | YES |
| `SELECT count(*) FROM users` (total) | 5 | 5 | YES |
| `SELECT count(*) FROM projects` | 3 | 3 | YES |
| `SELECT count(*) FROM tasks` | 3 | 3 | YES |
| Idempotency (second run) | 0 new records | 0 new records | YES |
| Vietnamese characters (UTF-8) | Correct diacritics | Correct diacritics | YES |

---

## Design Decisions

1. **Followed `ref-seed-data.md` as SOT** over task instruction discrepancies:
   - Department names: Used SOT's 7 departments (Phong Cong nghe, Phong San pham, etc.) rather than the task's different list
   - Admin email: `admin@projectopsos.local` (SOT) not `admin@projectops.local`
   - Password: `admin123456` (SOT) not `admin123`
   - User count: 5 users total (1 admin + 4 sample) matching SOT

2. **Per-row existence check** instead of `onConflictDoNothing()` for better logging granularity and to avoid silent failures on non-PK conflicts.

3. **Single `DEV_PASSWORD`** for all dev users (as specified in SOT `ref-seed-data.md` §8), hashed once and reused.

4. **Removed `version: "3.9"`** from docker-compose.yml — Docker Compose v2 treats it as obsolete and emits a warning.

---

## pACS Self-Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Precision** | 9/10 | All data matches SOT exactly. Vietnamese diacritics preserved. One gap: `ref-seed-data.md` shows `owner_id` for projects but schema uses `managerId` — mapped correctly. |
| **Accuracy** | 9/10 | All 8 verification queries pass. Idempotency confirmed. Schema-to-seed column mapping validated against actual Drizzle table definitions. |
| **Completeness** | 9/10 | All 6 deliverables created. Docker running, schema pushed, seed executed, migrations generated, scripts registered. Did not seed `project_members` (marked optional in SOT). |
| **Style** | 9/10 | Follows CONVENTIONS.md: camelCase variables, snake_case DB columns via Drizzle mapping, single quotes, 2-space indent, named exports, dotenv/config pattern. |

**Overall**: 9/10 — Fully functional local dev database with verified seed data.
