#!/usr/bin/env bash
# ============================================================
# db-migrate.sh — Run Drizzle ORM migrations in production
# Uses the app container to run migrations against the DB service
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log()  { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ── Pre-flight: check DB is reachable ────────────────────
log "Checking database connectivity..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec db \
  pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  err "Database is not reachable. Start it first: docker compose -f docker-compose.prod.yml up -d db"
  exit 1
fi

# ── Run Drizzle push (schema sync) ───────────────────────
# In production, drizzle-kit push applies schema changes directly.
# For migration-file-based workflow, use: pnpm db:migrate
log "Applying database schema with drizzle-kit push..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
  -e DATABASE_URL="${DATABASE_URL}" \
  app sh -c "npx drizzle-kit push --config=drizzle.config.ts"

# ── Post-migration health check ──────────────────────────
log "Verifying database after migration..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec db \
  psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-projectops}" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 5;"

if [ $? -eq 0 ]; then
  log "Migration completed successfully."
else
  err "Post-migration verification failed."
  exit 1
fi
