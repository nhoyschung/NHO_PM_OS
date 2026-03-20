# Step 8: Golden Module — Schema & Types

**Status**: COMPLETE
**Date**: 2026-03-19
**Agent**: Schema Architect

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/modules/projects/constants.ts` | 309 | Stage labels, colors, icons, transitions, priority/health labels, validation rules, RBAC permissions, column visibility, filter presets |
| `src/modules/projects/types.ts` | 184 | Zod enum schemas, DB row types, ProjectListItem, ProjectDetail, ProjectFormData, StageTransition, ProjectFilters, PaginatedResult |

**Total**: 493 lines across 2 files

---

## Key Design Decisions

### 1. Zod enum values dual-exported (type + runtime)
Each enum (ProjectStage, ProjectPriority, HealthStatus) is exported as both a Zod schema and a TypeScript type via `z.infer`. This allows:
- Runtime validation in server actions (`ProjectStage.parse(input)`)
- Compile-time type checking in components (`stage: ProjectStage`)

### 2. DB row types via Drizzle `InferSelectModel`
Instead of manually defining types that duplicate the schema, we use `InferSelectModel<typeof projects>` to derive `ProjectRow` directly from the Drizzle table definition. This ensures types stay in sync with schema changes automatically.

### 3. ProjectListItem is an interface (not Drizzle-inferred)
The list item type includes joined fields (`managerName`, `departmentName`, `memberCount`) that don't exist on the raw table. It intentionally uses a custom interface to represent the query result shape, not the raw DB row.

### 4. ProjectDetail extends ProjectRow
The detail type adds relational data (manager, teamLead, members, handovers, documents, stageHistory) while preserving all base columns. This enables type-safe access to both core fields and relations.

### 5. Transition machine stored as two structures
- `ALLOWED_TRANSITIONS`: Simple `Record<Stage, Stage[]>` for quick lookup (O(1) check)
- `TRANSITION_META`: Detailed `Record<"from->to", TransitionMeta>` with trigger, guard, requiredRoles, requiresHandover — keyed by transition pair for exact match

### 6. No PROVINCES array
The `province` field exists in the core schema but no 63-province list was provided in any reference document (ref-ux-vietnam.md, ref-schema-core.md, PRD). Rather than inventing data, the province field is typed as `z.string().optional()`. Province data should be added when a reference source is provided.

### 7. Vietnamese currency default
The schema uses `'VND'` as default currency (matching core.ts), not `'USD'` as in the PRD reference schema. This reflects the Vietnamese domain context established in the existing codebase.

### 8. camelCase for filter fields
Filter schema uses camelCase (`departmentId`, `managerId`, `sortBy`) to match TypeScript conventions, while the core schema uses snake_case for DB columns. The query layer will handle the mapping.

---

## State Machine Transition Mapping

All 15 transitions from ref-state-machine.md Section 3 are mapped:

**Forward (9)**:
1. initiation -> planning (approve_charter)
2. planning -> in_progress (approve_plan)
3. in_progress -> review (submit_for_review)
4. review -> testing (approve_review)
5. testing -> staging (tests_passed)
6. staging -> deployment (staging_approved)
7. deployment -> monitoring (deployment_complete)
8. monitoring -> handover (monitoring_complete)
9. handover -> completed (handover_accepted)

**Backward (6)**:
10. review -> in_progress (request_changes)
11. testing -> in_progress (tests_failed)
12. staging -> in_progress (staging_issues)
13. deployment -> staging (deployment_rollback)
14. monitoring -> in_progress (issues_detected)
15. handover -> monitoring (handover_rejected)

---

## pACS Self-Assessment

### Pre-mortem Analysis

**Q1: "If this step's output were to cause a type error downstream, what would be the most likely cause?"**
The `ProjectListItem` interface has manually defined fields that must match the query SELECT shape in `queries.ts` (Step 9). If a query returns different field names (e.g., `manager_name` vs `managerName`), the mismatch will surface at the query layer. Mitigation: the interface documents the expected shape clearly; `queries.ts` must conform.

**Q2: "What is the most likely deviation from the PRD or reference documents?"**
Two intentional deviations:
1. Currency default is `'VND'` (matching existing `core.ts`) vs `'USD'` in `ref-schema-core.md`. The codebase-established default takes precedence.
2. Field names use `managerId` instead of `owner_id` — following the naming established in `core.ts` Step 3 (the schema already uses `managerId` not `ownerId`).

**Q3: "Which part of the type system is most likely to need revision?"**
The `ProjectDetail` interface makes assumptions about relation shapes (e.g., `manager: { id, fullName, email, avatarUrl }`) that depend on how queries.ts constructs the joined result. If Drizzle's relational queries return a different shape, this interface will need adjustment.

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| F (Fidelity) | 93 | All 15 transitions match ref-state-machine.md exactly. All Vietnamese labels from ref-ux-vietnam.md. Currency default deviation is intentional and documented. |
| C (Completeness) | 91 | All required types present: enums, DB row types, list/detail/form types, filters, pagination, transitions, constants. No provinces array (no source data). |
| L (Logical Coherence) | 95 | Types align across files: constants.ts uses types from types.ts. Zod enum values match enums.ts. Filter schema field types match Drizzle column types. |
| T (Testability) | 92 | Zod schemas are testable via `.parse()/.safeParse()`. ALLOWED_TRANSITIONS can be tested against ref-state-machine.md transition matrix. Constants are plain data. |

**Final Score: 92.75 / 100**

---

*Source references: ref-schema-core.md, ref-state-machine.md, ref-golden-module.md, ref-features-f01-f04.md, ref-ux-vietnam.md, CONVENTIONS.md*
