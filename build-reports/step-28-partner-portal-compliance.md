# Step 28: Partner Portal + Compliance

## Summary

Created a partner-facing portal with read-only access for viewer-role users, and a compliance verification module accessible only to admin/manager roles.

## Files Created

### Partner Portal
| File | Purpose |
|------|---------|
| `src/app/(partner)/layout.tsx` | Partner route group layout — RBAC: redirects non-viewer roles to `/dashboard` |
| `src/app/(partner)/projects/page.tsx` | Read-only project list filtered to member projects |
| `src/app/(partner)/projects/[id]/page.tsx` | Read-only project detail — overview, documents, handovers tabs only |
| `src/components/layout/partner-layout.tsx` | Simplified layout shell for partner portal |
| `src/components/layout/partner-sidebar.tsx` | Minimal sidebar: only projects and documents links |

### Compliance Module
| File | Purpose |
|------|---------|
| `src/modules/compliance/types.ts` | ComplianceCheck, ComplianceReport, ComplianceStatus types |
| `src/modules/compliance/queries.ts` | `runComplianceChecks(projectId?)` — 5 compliance checks |
| `src/modules/compliance/partner-queries.ts` | `getProjectsByMember()`, `isProjectMember()` — partner-scoped queries |
| `src/modules/compliance/components/compliance-dashboard.tsx` | Compliance table with pass/fail/warning badges and pass rate |
| `src/modules/compliance/components/partner-project-list.tsx` | Read-only project list (no create button) |
| `src/modules/compliance/components/partner-project-detail.tsx` | Read-only detail with overview/documents/handovers tabs |
| `src/modules/compliance/components/index.ts` | Barrel export |
| `src/modules/compliance/index.ts` | Module public API |

### Pages
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/compliance/page.tsx` | Compliance dashboard — admin/manager only |

### Tests
| File | Tests |
|------|-------|
| `tests/modules/compliance/compliance.test.ts` | 17 tests: type validation, pass rate calculation, status determination logic |

## Files Modified

| File | Change |
|------|--------|
| `src/modules/index.ts` | Added ComplianceDashboard to barrel exports |

## Compliance Checks Implemented

1. **Handover per stage transition** — Verifies every project stage change has associated handover documentation
2. **Finance approval timeliness** — No pending finance records older than 30 days
3. **Required documents** — Every active project has at least one document
4. **Audit trail completeness** — All mutation entity types (project, task, handover, document) are tracked
5. **RBAC enforcement** — No unauthorized viewer-role mutations detected in audit logs

## Verification

- `pnpm exec tsc --noEmit` — **0 errors**
- `pnpm exec vitest run tests/modules/compliance/compliance.test.ts` — **17/17 passed**

## pACS Self-Rating

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **F** (Fidelity) | 9/10 | All specified files created per spec. Partner portal is read-only with RBAC enforcement. Compliance checks cover all 5 required areas. |
| **C** (Completeness) | 9/10 | All deliverables implemented: partner layout, project list/detail, compliance module with types/queries/components/page, tests, barrel exports. Vietnamese labels throughout. |
| **L** (Linkage) | 9/10 | Properly imports from existing modules (projects, documents, handovers, finance, audit-logs). Barrel exports updated. RBAC uses existing `isRoleAtLeast` and role checks. |
| **T** (Testability) | 9/10 | 17 tests covering type contracts, pass rate calculation, and status determination logic for all 5 compliance checks. All pass. |
