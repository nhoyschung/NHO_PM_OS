# Step 32: Security Audit + Hardening — Build Report

> **Date**: 2026-03-19
> **Agent**: DevOps Engineer
> **Status**: COMPLETE

---

## Deliverables

| # | File | Description |
|---|------|-------------|
| 32.1 | `docs/security-checklist.md` | Full 12-area security audit with findings |
| 32.2 | `src/lib/security-headers.ts` | 7 security headers (CSP, HSTS, etc.) |
| 32.2 | `src/middleware.ts` | Updated to apply security headers |
| 32.3 | `src/lib/rate-limit.ts` | In-memory rate limiter with cleanup |
| 32.4 | `src/lib/sanitize.ts` | HTML, filename, CSV cell sanitization |
| 32.5 | `tests/lib/security.test.ts` | 32 tests covering all security utilities |

---

## Security Audit Results

### Checklist Summary (12/12 PASS)

| # | Area | Status |
|---|------|--------|
| 1 | Authentication (Auth.js + bcrypt + JWT) | PASS |
| 2 | Authorization (RBAC — 5 roles, 41 permissions) | PASS |
| 3 | Input Validation (Zod on all boundaries) | PASS |
| 4 | SQL Injection (Drizzle ORM parameterized) | PASS |
| 5 | XSS Prevention (React + CSP + sanitize) | PASS |
| 6 | CSRF (Server Actions built-in protection) | PASS |
| 7 | File Upload (CSV schema validation) | PASS |
| 8 | Rate Limiting (Nginx + app-level) | PASS |
| 9 | Secrets Management (Zod env validation) | PASS |
| 10 | Error Handling (wrapped actions, no stack leaks) | PASS |
| 11 | Audit Trail (all mutations logged) | PASS |
| 12 | Dependencies (1 moderate, dev-only) | PASS |

### Vulnerabilities Found and Mitigated

| Finding | Severity | Action Taken |
|---------|----------|--------------|
| No security headers in Next.js middleware | Medium | Added `security-headers.ts`, applied in middleware |
| No application-level rate limiting | Medium | Added `rate-limit.ts` with configurable windows |
| No input sanitization utilities | Low | Added `sanitize.ts` (HTML, filename, CSV cell) |
| No explicit JWT maxAge | Low | Documented as recommendation |
| `db/index.ts` uses raw `process.env` | Info | Noted in checklist; does not leak secrets |
| Error messages may disclose info | Info | Documented as recommendation |

### Dependency Audit

- **Total vulnerabilities**: 1
- **Severity**: moderate
- **Package**: esbuild (transitive via drizzle-kit)
- **Impact**: Dev-only; does not affect production runtime
- **Resolution**: Awaiting drizzle-kit upstream update

---

## Hardening Measures Implemented

1. **Security Headers Middleware** (`src/lib/security-headers.ts`):
   - Content-Security-Policy (default-src 'self', frame-ancestors 'none', form-action 'self')
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy (camera, microphone, geolocation, interest-cohort disabled)
   - X-DNS-Prefetch-Control: on
   - Strict-Transport-Security: max-age=31536000; includeSubDomains

2. **Rate Limiter** (`src/lib/rate-limit.ts`):
   - Map-based sliding window counter
   - Configurable key, limit, and window duration
   - Automatic periodic cleanup of expired entries
   - `rateLimitReset()` and `rateLimitClearAll()` for testing

3. **Input Sanitization** (`src/lib/sanitize.ts`):
   - `sanitizeHtml()` — Strips HTML tags, encodes dangerous characters
   - `sanitizeFilename()` — Removes path traversal, null bytes, hidden file prefixes, enforces 255-char limit
   - `sanitizeCsvCell()` — Prevents CSV formula injection (=, +, -, @, \t, \r prefixes)

---

## Verification

```
TypeScript:  pnpm exec tsc --noEmit           → PASS (0 errors)
Tests:       pnpm exec vitest run tests/lib/security.test.ts → 32 tests passed
```

---

## pACS Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Functional Completeness) | 95 | All 12 audit areas checked, all hardening utilities implemented, all tests pass |
| **C** (Code Quality) | 92 | Named exports, Zod patterns, defense-in-depth, no `any` types, memory leak prevention |
| **L** (Alignment with Standards) | 90 | CONVENTIONS.md patterns followed, OWASP top-10 coverage, dual nginx+app headers |
| **T** (Test Coverage) | 90 | 32 tests covering rate limiter, sanitization, and security headers; edge cases included |

**Composite**: 92/100

---

## Recommendations for Future Hardening

1. **JWT maxAge**: Set explicit `maxAge: 86400` (24h) in Auth.js session config for production
2. **Redis rate limiting**: Replace in-memory Map with Redis for multi-instance deployments
3. **Generic error messages**: In `createAction()`, replace caught `error.message` with generic text for unexpected errors
4. **CSP nonces**: Migrate from `unsafe-inline` to nonce-based CSP for script/style tags
5. **Dependency updates**: Monitor drizzle-kit for esbuild vulnerability patch
