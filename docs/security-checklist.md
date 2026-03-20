# Security Audit Checklist — ProjectOpsOS

> **Audit date**: 2026-03-19
> **Auditor**: DevOps Engineer Agent (Step 32)
> **Scope**: Full-stack application security review

---

## 1. Authentication

- [x] **Auth.js (NextAuth v5)** properly configured with Credentials provider
- [x] **JWT strategy** — stateless sessions with `session: { strategy: 'jwt' }`
- [x] **Password hashing** — bcryptjs with `bcrypt.compare()` (no plaintext)
- [x] **Inactive user check** — `user.isActive` verified in `authorize()` callback
- [x] **Session enrichment** — JWT callback propagates `id`, `role`, `departmentId` to session
- [x] **Login redirect** — Unauthorized users redirected to `/login`
- [x] **NEXTAUTH_SECRET** — Validated via Zod (`min(16)`) in `src/lib/env.ts`

**Finding**: No session expiration explicitly configured. Auth.js defaults apply (30-day JWT maxAge). Consider adding explicit `maxAge` for production.

**Status**: PASS (with recommendation)

---

## 2. Authorization (RBAC)

- [x] **5-tier role hierarchy**: admin(100) > manager(80) > lead(60) > member(40) > viewer(20)
- [x] **Explicit permission matrix** — No implicit/inherited permissions; each role has an explicit `Set<Permission>`
- [x] **Permission monotonicity** — Higher roles are strict supersets of lower roles (verified by test)
- [x] **`hasPermission()`** returns `false` for unknown roles (safe default)
- [x] **`requirePermission()`** throws `PermissionDeniedError` for denied access
- [x] **`createAction()` wrapper** — All server actions require authenticated session
- [x] **41 permissions** across 7 modules (projects, handovers, documents, tasks, notifications, audit-logs, finance)

**Finding**: `createAction()` enforces authentication but does not enforce RBAC permissions at the wrapper level. Each action must call `requirePermission()` or `hasPermission()` individually. This is by design (each action has different permission needs) but requires developer discipline.

**Status**: PASS

---

## 3. Input Validation

- [x] **All server actions** validate input with Zod `safeParse()` before DB operations
- [x] **Typed schemas** — `createProjectSchema`, `updateProjectSchema`, `transitionStageSchema`, `createFinanceRecordSchema`, `csvRowSchema`, etc.
- [x] **UUID validation** — Project IDs, record IDs validated as UUID format
- [x] **Enum validation** — Financial types, categories, statuses validated against enum values
- [x] **String length limits** — Descriptions capped at `DESCRIPTION_MAX`, reference numbers at `REFERENCE_NUMBER_MAX`
- [x] **Numeric validation** — Amounts validated as integers with minimum bounds
- [x] **Date validation** — Transaction dates validated with `z.string().date()`
- [x] **No `as` type assertions on external data** — All external data parsed through Zod

**Status**: PASS

---

## 4. SQL Injection

- [x] **Drizzle ORM** used for all database operations — parameterized queries by default
- [x] **No raw SQL strings** with user input concatenation found
- [x] **`sql` template literal** used in `generateUniqueSlug()` — properly parameterized via Drizzle's tagged template
- [x] **`sql<string>` typed** — aggregate queries in `generateProjectCode()` use type-safe SQL

**Status**: PASS

---

## 5. XSS Prevention

- [x] **React auto-escaping** — JSX renders text content safely by default
- [x] **No `dangerouslySetInnerHTML`** found in codebase
- [x] **No `eval()` or `new Function()`** found in codebase
- [x] **No `@ts-ignore` or `@ts-expect-error`** found in codebase
- [x] **CSP header** — `Content-Security-Policy` set in both nginx and Next.js middleware
- [x] **`X-Content-Type-Options: nosniff`** — Prevents MIME-type sniffing
- [x] **Sanitization library** added — `sanitizeHtml()`, `sanitizeCsvCell()` for defense-in-depth

**Status**: PASS

---

## 6. CSRF Protection

- [x] **Next.js Server Actions** — Built-in CSRF token protection via `.action` protocol
- [x] **`form-action 'self'`** in CSP header — Prevents form submissions to external origins
- [x] **Referrer-Policy: strict-origin-when-cross-origin** — Limits referer leakage

**Status**: PASS

---

## 7. File Upload Security (CSV Import)

- [x] **CSV import** validates each row with `csvRowSchema` (Zod)
- [x] **No arbitrary file execution** — CSV data is parsed as structured rows, not executed
- [x] **Row-level error isolation** — Failed rows are skipped with error messages, not propagated
- [x] **Max body size** — Nginx limits to `client_max_body_size 10m`
- [x] **Filename sanitization** utility added — `sanitizeFilename()` strips path traversal, null bytes, special chars
- [x] **CSV formula injection** defense — `sanitizeCsvCell()` prefixes formula characters

**Status**: PASS

---

## 8. Rate Limiting

- [x] **Nginx rate limiting** — `limit_req_zone` at 30r/s with burst=20 on `/api/` routes
- [x] **Application-level rate limiter** added — `rateLimit()` with configurable key/limit/window
- [x] **Memory cleanup** — Periodic interval cleans expired entries (prevents memory leak)
- [x] **Available for sensitive actions** — Login attempts, CSV import can be rate-limited

**Status**: PASS

---

## 9. Secrets Management

- [x] **No hardcoded secrets** found in source code (grep scan confirmed)
- [x] **Environment variables** validated via Zod in `src/lib/env.ts`
- [x] **`.env.example`** uses placeholder values only (`your-secret-here`)
- [x] **NEXTAUTH_SECRET** requires minimum 16 characters

**Finding**: `src/db/index.ts` uses `process.env.DATABASE_URL!` directly instead of the Zod-validated `env.DATABASE_URL`. This is a minor deviation from the env validation pattern but does not leak secrets.

**Status**: PASS (with note)

---

## 10. Error Handling

- [x] **`createAction()` wrapper** catches all errors and returns generic `{ success: false, error: message }` — no stack traces exposed
- [x] **Structured logging** — `src/lib/logger.ts` logs JSON in production, human-readable in dev
- [x] **Error tracking** — `src/lib/error-tracking.ts` normalizes errors, placeholder for Sentry integration
- [x] **Global handlers** — `uncaughtException` and `unhandledRejection` captured

**Finding**: Error messages from caught exceptions (`error.message`) are returned to the client. For production, consider replacing with generic messages for unexpected errors to prevent information disclosure.

**Status**: PASS (with recommendation)

---

## 11. Audit Trail

- [x] **All mutations logged** — `createAuditLog()` called in every server action (create, update, delete, stage_change, approve, reject, import, assign, unassign)
- [x] **Immutable records** — Audit logs are insert-only (no update/delete operations)
- [x] **Old/new value tracking** — Change diffs recorded in `oldValues`/`newValues` JSON columns
- [x] **User attribution** — Every audit entry includes `userId`

**Status**: PASS

---

## 12. Dependency Audit

```
pnpm audit results (2026-03-19):
1 vulnerability found — Severity: 1 moderate

┌─────────────────────┬──────────────────────────────────────────┐
│ moderate            │ esbuild enables any website to send any  │
│                     │ requests to the development server       │
├─────────────────────┼──────────────────────────────────────────┤
│ Package             │ esbuild                                  │
├─────────────────────┼──────────────────────────────────────────┤
│ Vulnerable versions │ <=0.24.2                                 │
├─────────────────────┼──────────────────────────────────────────┤
│ Patched versions    │ >=0.25.0                                 │
├─────────────────────┼──────────────────────────────────────────┤
│ Path                │ drizzle-kit > @esbuild-kit/esm-loader >  │
│                     │ @esbuild-kit/core-utils > esbuild        │
└─────────────────────┴──────────────────────────────────────────┘
```

**Assessment**: This is a **dev-only dependency** (drizzle-kit) that only affects the development server's esbuild instance. It does NOT affect production builds or runtime. Risk is limited to development environments where an attacker has network access to the dev server.

**Status**: PASS (dev-only, not exploitable in production)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Authentication | PASS | Recommend explicit JWT maxAge |
| Authorization (RBAC) | PASS | Per-action enforcement by design |
| Input Validation | PASS | Zod on all boundaries |
| SQL Injection | PASS | Drizzle ORM parameterized |
| XSS Prevention | PASS | React + CSP + sanitization |
| CSRF | PASS | Server Actions built-in |
| File Upload | PASS | Schema-validated CSV rows |
| Rate Limiting | PASS | Nginx + app-level |
| Secrets Management | PASS | Env validated, no hardcoded |
| Error Handling | PASS | Recommend generic messages |
| Audit Trail | PASS | All mutations logged |
| Dependencies | PASS | 1 moderate (dev-only) |

**Overall Assessment**: **PASS** — No critical or high-severity vulnerabilities found. The application demonstrates solid security practices with defense-in-depth across authentication, authorization, input validation, and output encoding layers.
