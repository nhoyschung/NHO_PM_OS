# ProjectOpsOS — Troubleshooting Guide

> **Version**: 0.1.0
> **Last updated**: 2026-03-19

---

## Database Connection Issues

### Problem: `ECONNREFUSED` when starting the dev server

**Symptom**: Error message like `connect ECONNREFUSED 127.0.0.1:5432`

**Cause**: PostgreSQL is not running or not accessible.

**Solution**:

```bash
# Check if Docker containers are running
docker compose ps

# If db container is not running, start it
docker compose up -d

# Verify PostgreSQL is ready
docker compose exec db pg_isready -U postgres
```

### Problem: `database "projectops" does not exist`

**Cause**: The database has not been created or the seed has not been run.

**Solution**:

```bash
# Apply schema (creates tables)
pnpm db:push

# Seed initial data
pnpm db:seed
```

### Problem: `relation "users" does not exist`

**Cause**: Database schema has not been applied.

**Solution**:

```bash
pnpm db:push
```

### Problem: `authentication failed for user`

**Cause**: PostgreSQL credentials in `.env` do not match the database configuration.

**Solution**:

1. Check your `.env` file: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projectops`
2. Ensure the Docker container uses matching credentials
3. If you changed the password, restart the db container: `docker compose down && docker compose up -d`

---

## Docker Issues

### Problem: `port 5432 already in use`

**Cause**: Another PostgreSQL instance or Docker container is using port 5432.

**Solution**:

```bash
# Find what is using the port
# On Linux/macOS:
lsof -i :5432
# On Windows:
netstat -ano | findstr :5432

# Option 1: Stop the conflicting service
# Option 2: Change the port mapping in docker-compose.yml
# ports:
#   - "5433:5432"
# Then update DATABASE_URL to use port 5433
```

### Problem: `docker compose` command not found

**Cause**: Docker Compose v2 is not installed or Docker Desktop is not running.

**Solution**:

- Ensure Docker Desktop is installed and running
- Docker Compose v2 is built into Docker Desktop (use `docker compose`, not `docker-compose`)
- On Linux: install the `docker-compose-plugin` package

### Problem: Docker build fails with `pnpm-lock.yaml not found`

**Cause**: The lockfile was not committed or is out of sync.

**Solution**:

```bash
pnpm install
# Commit the updated pnpm-lock.yaml
```

### Problem: Container keeps restarting

**Cause**: Application crash loop, often due to missing environment variables.

**Solution**:

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs app --tail=50

# Common fix: ensure .env.production has all required variables
# Required: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
```

---

## Authentication Issues

### Problem: Cannot log in with seeded users

**Cause**: Seed data was not applied or password hashing issue.

**Solution**:

```bash
# Re-run the seed script
pnpm db:seed

# Default credentials:
# admin@projectops.vn / password123
# manager@projectops.vn / password123
```

### Problem: `NEXTAUTH_SECRET` error on startup

**Cause**: `NEXTAUTH_SECRET` is missing or shorter than 16 characters.

**Solution**:

```bash
# Generate a strong secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET=<generated-value>
```

### Problem: Redirect loop on login page

**Cause**: `NEXTAUTH_URL` does not match the actual URL where the app is served.

**Solution**:

```bash
# For local development
NEXTAUTH_URL=http://localhost:3000

# For production
NEXTAUTH_URL=https://your-actual-domain.com
```

---

## Build Issues

### Problem: TypeScript errors during `pnpm build`

**Solution**:

```bash
# Run type check to see all errors
pnpm exec tsc --noEmit

# Fix reported type errors, then rebuild
pnpm build
```

### Problem: `Module not found: @/...`

**Cause**: Path alias `@/` is configured to `./src/*` in `tsconfig.json`. A file may be missing or incorrectly imported.

**Solution**:

1. Verify the file exists at the expected path under `src/`
2. Check `tsconfig.json` paths configuration:
   ```json
   "paths": { "@/*": ["./src/*"] }
   ```

### Problem: `next build` fails with `prerender` errors

**Cause**: Server-side pages that access environment variables or database at build time.

**Solution**:

Ensure `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are available during build:

```bash
DATABASE_URL=... NEXTAUTH_URL=... NEXTAUTH_SECRET=... pnpm build
```

---

## Test Issues

### Problem: Tests fail with `Cannot find module '@/...'`

**Cause**: Vitest alias configuration is missing or incorrect.

**Solution**:

Check `vitest.config.ts` includes the path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Problem: Tests pass locally but fail in CI

**Cause**: Environment differences, missing dependencies, or stale lockfile.

**Solution**:

```bash
# Ensure lockfile is up to date
pnpm install --frozen-lockfile

# Run tests locally with the same command as CI
pnpm exec vitest run
```

---

## Performance Issues

### Problem: Slow page loads in development

**Cause**: Next.js dev server compiles pages on-demand. First load is always slower.

**Solution**:

- This is expected behavior in development mode
- Production builds (`pnpm build && pnpm start`) are significantly faster
- Ensure your machine has adequate RAM (4GB+ recommended)

### Problem: Database queries are slow

**Solution**:

1. Check if database has proper indexes (Drizzle schema includes indexes)
2. Use `pnpm db:studio` to inspect query plans
3. Consider connection pooling for production

---

## Nginx Issues

### Problem: 502 Bad Gateway

**Cause**: The Next.js application container is not running or not healthy.

**Solution**:

```bash
# Check if the app container is healthy
docker compose -f docker-compose.prod.yml ps

# Check app logs
docker compose -f docker-compose.prod.yml logs app --tail=50

# Ensure the app starts before nginx
# docker-compose.prod.yml should have depends_on with health check
```

### Problem: SSL certificate errors

**Cause**: Missing or expired SSL certificates.

**Solution**:

```bash
# Ensure certificates exist
ls nginx/certs/fullchain.pem nginx/certs/privkey.pem

# For Let's Encrypt renewal
sudo certbot renew
cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/certs/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Zod validation failed` | Invalid input data | Check the form/request payload against the expected schema |
| `PermissionDeniedError` | RBAC permission insufficient | Verify user role has required permission |
| `Session expired` | JWT token expired | Re-login to get a new session |
| `UNIQUE constraint failed` | Duplicate record | Check for existing records with the same unique field |
| `foreign key constraint` | Referenced record does not exist | Ensure related records exist before creating dependents |

---

## Getting Help

1. Check the application logs: `docker compose logs app --tail=100`
2. Check the database logs: `docker compose logs db --tail=100`
3. Check the nginx logs: `docker compose logs nginx --tail=100`
4. Run the health check: `curl http://localhost:3000/api/health`
5. Run the test suite: `pnpm exec vitest run`
6. Check TypeScript: `pnpm exec tsc --noEmit`
