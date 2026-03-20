# Step 22 — Module Integration Wiring

**Status**: COMPLETE
**Date**: 2026-03-19
**Agent**: RBAC Integrator

---

## 22.1 Sidebar Navigation

Updated `src/components/layout/sidebar.tsx` with all 7 module navigation items:

| Label (Vietnamese) | Route | Icon | Visibility |
|---|---|---|---|
| Tổng quan | /dashboard | LayoutDashboard | All |
| Dự án | /dashboard/projects | FolderKanban | All |
| Bàn giao | /dashboard/handovers | ArrowRightLeft | All |
| Tài liệu | /dashboard/documents | FileText | All |
| Công việc | /dashboard/tasks | CheckSquare | All |
| Tài chính | /dashboard/finance | DollarSign | admin, manager |
| Nhật ký | /dashboard/audit-logs | ScrollText | admin, manager |
| Thông báo | /dashboard/notifications | Bell | All |

Removed stale items: Báo cáo (/dashboard/reports), Tuân thủ (/dashboard/compliance), old /dashboard/financials and /dashboard/audit-log routes.

## 22.2 Module Index Files

Created barrel exports for all 7 modules + top-level aggregator:

| Module | File | Exports |
|---|---|---|
| projects | `src/modules/projects/index.ts` | 7 components + PERMISSIONS |
| handovers | `src/modules/handovers/index.ts` | 5 components + PERMISSIONS |
| documents | `src/modules/documents/index.ts` | 5 components + PERMISSIONS |
| tasks | `src/modules/tasks/index.ts` | 6 components + PERMISSIONS |
| notifications | `src/modules/notifications/index.ts` | 3 components + PERMISSIONS |
| audit-logs | `src/modules/audit-logs/index.ts` | 5 components + PERMISSIONS |
| finance | `src/modules/finance/index.ts` | 5 components + PERMISSIONS |
| **barrel** | `src/modules/index.ts` | All 36 components + PermissionGuard |

Design note: Server actions (`'use server'`) and queries are NOT re-exported through barrel files to avoid Next.js module boundary issues. They should be imported directly (e.g., `import { createProjectAction } from '@/modules/projects/actions'`).

## 22.3 Modules Wired — File Counts

| Module | File Count |
|---|---|
| projects | 14 |
| handovers | 12 |
| documents | 12 |
| tasks | 13 |
| notifications | 10 |
| audit-logs | 12 |
| finance | 12 |
| **Total** | **85** |

## 22.4 Integration Tests

Created `tests/integration/module-wiring.test.ts` with 5 test groups:

1. **Module directory structure** — All 7 modules have required files (actions.ts, constants.ts, queries.ts, types.ts, validation.ts, index.ts, components/index.ts)
2. **Sidebar navigation** — All expected routes present with Vietnamese labels
3. **RBAC permission matrix** — Every module exports PERMISSIONS; rbac.ts imports from all 7
4. **Server action wrapper** — All modules import createAction + use 'use server'
5. **Module barrel exports** — Top-level index references all 7 modules; each module re-exports from ./components

## 22.5 TypeScript Check

```
pnpm exec tsc --noEmit → 0 errors
```

## 22.6 Full Test Suite Results

```
Test Files  12 passed (12)
     Tests  577 passed (577)
  Duration  1.07s
```

**0 failures.** All 577 tests pass.

## pACS Assessment

| Dimension | Score | Rationale |
|---|---|---|
| **F** (Functional completeness) | 95 | All 7 modules wired, sidebar complete, barrel exports created, integration tests pass |
| **C** (Code quality) | 95 | Named exports only, consistent patterns, Vietnamese labels, proper Next.js module boundaries |
| **L** (Linting / types) | 100 | tsc --noEmit passes with 0 errors |
| **T** (Test coverage) | 95 | 577 tests pass, new integration tests cover wiring, sidebar, RBAC, action wrappers |

**Overall**: 96/100
