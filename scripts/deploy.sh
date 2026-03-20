#!/usr/bin/env bash
# ============================================================
# deploy.sh — Production deploy script for ProjectOpsOS
# Zero-downtime deploy: build new image, migrate DB, swap containers
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ── Pre-flight checks ────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  err ".env.production not found. Copy .env.production.example and configure it."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  err "docker is not installed."
  exit 1
fi

# ── Pull latest code (if in git repo) ────────────────────
if [ -d "$PROJECT_DIR/.git" ]; then
  log "Pulling latest code..."
  git -C "$PROJECT_DIR" pull --ff-only
fi

# ── Build the new image ──────────────────────────────────
log "Building production image..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build app

# ── Ensure DB is running and healthy ─────────────────────
log "Starting database service..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db
log "Waiting for database to be healthy..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec db \
  sh -c 'until pg_isready -U ${POSTGRES_USER:-postgres}; do sleep 1; done'

# ── Run database migrations ──────────────────────────────
log "Running database migrations..."
bash "$SCRIPT_DIR/db-migrate.sh"

# ── Zero-downtime swap: start new container, stop old ────
log "Deploying new application container..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d app

# ── Wait for health check to pass ────────────────────────
log "Waiting for application health check..."
MAX_RETRIES=30
RETRY=0
until docker compose -f "$COMPOSE_FILE" ps app | grep -q "healthy"; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    err "Application failed to become healthy after ${MAX_RETRIES} attempts."
    err "Rolling back..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs app --tail=50
    exit 1
  fi
  sleep 2
done

# ── Start nginx (if configured) ──────────────────────────
if [ -f "$PROJECT_DIR/nginx/nginx.conf" ]; then
  log "Starting nginx reverse proxy..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx
fi

# ── Cleanup old images ───────────────────────────────────
log "Cleaning up dangling images..."
docker image prune -f

log "Deployment complete! Application is healthy."
