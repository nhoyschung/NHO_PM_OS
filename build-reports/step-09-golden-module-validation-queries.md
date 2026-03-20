# Step 9: Golden Module — Validation & Queries

**Status**: COMPLETE
**Date**: 2026-03-19
**Agent**: Schema Architect

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/modules/projects/validation.ts` | 113 | Zod validation schemas for CRUD + stage transitions |
| `src/modules/projects/queries.ts` | 321 | Drizzle read-only query functions with pagination |
| **Total** | **434** | |

---

## Key Design Decisions

### Validation (`validation.ts`)

1. **Cross-field refinement for date validation**: `createProjectSchema` uses `.refine()` to enforce `startDate <= endDate` when both are provided. This is a business rule that cannot be expressed with per-field validators alone.

2. **Update schema uses `.partial()` with separate base**: The update schema is built from a separate base object (with nullable fields for clearable values) then `.partial()` applied, then the same date refinement added. This allows clearing optional fields (setting to `null`) in updates, which `.partial()` on the create schema wouldn't support properly.

3. **Stage transition validates against `ALLOWED_TRANSITIONS`**: The `transitionStageSchema` requires both `fromStage` and `toStage` and uses a `.refine()` to check that the `toStage` is in the `ALLOWED_TRANSITIONS[fromStage]` array imported from `constants.ts`. This makes the validation deterministic and traceable to the state machine spec.

4. **Filter schema re-exported from types.ts**: Rather than duplicating the `ProjectFilterSchema`, `validation.ts` re-exports it from `types.ts` where it is the SOT. This avoids drift between the filter type and the validation schema.

5. **Validation constants from `constants.ts`**: All magic numbers (`NAME_MIN`, `NAME_MAX`, `DESCRIPTION_MAX`, etc.) come from the `VALIDATION` object in `constants.ts`, ensuring a single source of truth for validation rules.

### Queries (`queries.ts`)

1. **Pagination pattern**: All list queries return `PaginatedResult<T>` with `{ data, total, page, perPage, totalPages }`. The count query runs in parallel with the data query via `Promise.all`.

2. **Dynamic where clauses**: Filters are built as an array of conditions, then composed with `and(...)`. Empty filters produce no `WHERE` clause (returns all non-deleted projects).

3. **Sort column map**: A `SORT_COLUMN_MAP` maps string sort keys to Drizzle column references, avoiding `any` type assertions or dynamic property access.

4. **Member count enrichment**: `getProjects` fetches member counts in a separate grouped query using `ANY()` array containment, avoiding N+1 queries. This is more efficient than a correlated subquery per row.

5. **`getProjectById` uses Drizzle relational queries**: The `db.query.projects.findFirst()` with `with:` clauses leverages Drizzle's relational query builder for nested data (manager, teamLead, members with user info, handovers, documents, stageHistory). Counts are computed separately via parallel `count()` queries.

6. **`getProjectsByDepartment` delegates to `getProjects`**: Avoids code duplication by passing the department filter to the main query function.

7. **`getProjectStats` returns typed stats**: Aggregates are computed in 5 parallel queries: total count, budget sums, count by stage, count by priority, count by health status. Uses `COALESCE` to handle NULL sums.

8. **No string interpolation**: All queries use Drizzle's parameterized query builder or `sql` tagged template literals. No raw string concatenation.

---

## TypeScript Compilation

```
pnpm exec tsc --noEmit → SUCCESS (0 errors)
```

---

## Source Traceability

| Element | Source |
|---------|--------|
| `createProjectSchema` fields | ref-schema-core.md §9 `CreateProjectSchema` |
| Stage transition validation | ref-state-machine.md §3 `ALLOWED_TRANSITIONS` |
| Filter schema | ref-golden-module.md §3.1 `ProjectFilterSchema` |
| Pagination pattern | ref-golden-module.md §4.3 |
| Column names / types | `src/db/schema/core.ts` (Drizzle schema SOT) |
| Enum values | `src/db/schema/enums.ts` |

---

## pACS Self-Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| F (Fidelity) | 95 | All schemas trace to PRD refs. Validation rules match ref-schema-core.md. ALLOWED_TRANSITIONS imported from constants.ts which matches ref-state-machine.md exactly. Minor: `updateProjectSchema` uses nullable fields (a practical enhancement not explicitly in spec). |
| C (Completeness) | 93 | All 4 required schemas created (create, update, transition, filters). All 4 query functions implemented (getProjects, getProjectById, getProjectsByDepartment, getProjectStats). ProjectStats type exported for consumers. Missing: `getProjectBySlug` (present in ref-golden-module.md §3.4 but not listed in step spec). |
| L (Logical Coherence) | 96 | Cross-field date validation is sound. Stage transition validation is deterministic. Pagination math is correct. Sort column map is exhaustive for all SortableColumns values. Member count enrichment avoids N+1. Stats use COALESCE for NULL safety. |
| T (Testability) | 92 | All functions accept typed inputs and return typed outputs. Validation schemas can be tested with `.safeParse()`. Query functions are parameterized and deterministic given a DB state. Stats function returns a flat typed object. Minor: some queries depend on Drizzle relational query builder which requires schema registration in `db` instance. |

**Final Score**: (95 + 93 + 96 + 92) / 4 = **94.0**
