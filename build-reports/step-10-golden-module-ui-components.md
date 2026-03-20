# Step 10: Golden Module — UI Components

**Status**: Complete
**Date**: 2026-03-19
**TypeScript Check**: PASS (0 errors)

---

## Files Created

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/modules/projects/components/stage-badge.tsx` | 28 | Stage badge with color from STAGE_COLORS |
| 2 | `src/modules/projects/components/priority-badge.tsx` | 28 | Priority badge with color from PRIORITY_COLORS |
| 3 | `src/modules/projects/components/health-badge.tsx` | 28 | Health status badge with color from HEALTH_COLORS |
| 4 | `src/modules/projects/components/project-list.tsx` | 388 | Full list view: table, search, filters, pagination |
| 5 | `src/modules/projects/components/project-detail.tsx` | 464 | Detail view: tabs, sidebar, stage history, finance |
| 6 | `src/modules/projects/components/project-form.tsx` | 272 | Create/Edit form with Zod validation |
| 7 | `src/modules/projects/components/stage-transition-bar.tsx` | 131 | Stage transition with confirmation dialog |
| 8 | `src/modules/projects/components/index.ts` | 7 | Barrel export |
| 9 | `src/modules/projects/actions.ts` | 23 | Stub server actions (full impl in Step 11) |
| 10 | `src/app/(dashboard)/projects/page.tsx` | 48 | Server component: project list page |
| 11 | `src/app/(dashboard)/projects/[slug]/page.tsx` | 18 | Server component: project detail page |
| 12 | `src/app/(dashboard)/projects/[slug]/project-detail-client.tsx` | 33 | Client wrapper binding transition action |
| 13 | `src/app/(dashboard)/projects/new/page.tsx` | 5 | Server component: create project page |
| 14 | `src/app/(dashboard)/projects/new/project-form-client.tsx` | 14 | Client wrapper binding create action |

**Total new lines**: 1,487
**Files modified**: `src/modules/projects/queries.ts` (+13 lines — `getProjectBySlug`)

---

## Component Hierarchy

```
app/(dashboard)/projects/
├── page.tsx (Server)
│   └── ProjectList (Client)
│       ├── StageBadge
│       ├── PriorityBadge
│       └── HealthBadge
├── [slug]/
│   ├── page.tsx (Server)
│   └── ProjectDetailClient (Client)
│       └── ProjectDetail
│           ├── StageTransitionBar
│           ├── StageBadge / PriorityBadge / HealthBadge
│           ├── OverviewTab
│           ├── FinanceTab
│           ├── AuditTab
│           ├── InfoCard
│           └── MembersCard
└── new/
    ├── page.tsx (Server)
    └── ProjectFormClient (Client)
        └── ProjectForm
```

---

## Key Design Decisions

1. **No shadcn/ui dependency**: Components use plain Tailwind CSS since `src/components/ui/` has no installed primitives. This avoids adding dependencies in a UI-components-only step. If shadcn/ui is installed later, badges/buttons can be swapped incrementally.

2. **Server/Client separation**: Pages are server components (data fetching). Interactive parts (filters, tabs, transitions) use `'use client'` wrappers. This follows Next.js App Router best practice.

3. **URL-based filter state**: Filters and pagination are stored in URL search params via `useSearchParams()` + `useRouter()`. This enables:
   - Shareable/bookmarkable filter states
   - Browser back/forward navigation
   - Server-side filtering via `getProjects()`

4. **Stub actions.ts**: Created minimal stubs for `createProjectAction` and `transitionStageAction` so UI can compile and wire up. Full implementation deferred to Step 11.

5. **getProjectBySlug added to queries.ts**: Detail page routes use `[slug]` param. Added a slug-to-id lookup function that delegates to `getProjectById` for the full relation query.

6. **Vietnamese UI text**: All labels sourced from `constants.ts` (STAGE_LABELS, PRIORITY_LABELS, HEALTH_LABELS) and ref-ux-vietnam.md. Validation messages in Vietnamese per validation.ts.

7. **Named exports only**: All components use named exports per CONVENTIONS.md. Default exports used only on Next.js page.tsx files (framework requirement).

---

## pACS Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Functionality) | 85 | All specified UI screens created. Actions are stubs — full functionality in Step 11. |
| **C** (Completeness) | 80 | List, Detail, Form, Transition Bar all present. Handover/Document/Task tabs are placeholders (correct — those modules don't exist yet). |
| **L** (Linkage) | 90 | Types from types.ts, constants from constants.ts, queries from queries.ts all correctly wired. URL routing matches ref-ux-screens.md pattern. |
| **T** (TypeScript) | 95 | Zero tsc errors. Strict typing throughout. Proper use of branded types from Zod schemas. |

**Overall**: 87.5 / 100
