# Step 12: Golden Module — Tests & Seed Data

## Summary

Created comprehensive test suite for the `projects` golden module and enhanced seed data with additional Vietnamese construction/infrastructure projects.

**Status**: PASS — 108 tests passing, 0 failures, TypeScript compiles cleanly.

---

## Files Created

| File | Lines | Tests | Description |
|------|-------|-------|-------------|
| `tests/modules/projects/constants.test.ts` | 373 | 38 | Constants validation (labels, colors, transitions, provinces) |
| `tests/modules/projects/validation.test.ts` | 378 | 46 | Zod schema tests (create, update, transition, filters) |
| `tests/modules/projects/queries.test.ts` | 260 | 9 | Query function tests with mocked DB |
| `tests/modules/projects/actions.test.ts` | 261 | 15 | Server action tests with mocked deps |
| `scripts/seed-projects.ts` | 226 | — | 7 additional Vietnamese project seeds |
| **Total** | **1,498** | **108** | |

---

## Test Categories & Coverage

### constants.test.ts (38 tests)
- **STAGE_LABELS**: Covers all 10 stages, no extra keys, non-empty Vietnamese labels
- **STAGE_DESCRIPTIONS**: Full coverage, non-empty descriptions
- **STAGE_COLORS**: Valid Tailwind `bg-*` and `text-*` classes for all stages
- **STAGE_ICONS**: All 10 stages have Lucide icon names
- **ALLOWED_TRANSITIONS**: Exactly 15 transitions (9 forward + 6 backward), matches ref-state-machine.md, `completed` is terminal, all targets are valid stages
- **TRANSITION_META**: 15 entries matching edges, valid shape (trigger/guard/requiredRoles/requiresHandover), only `monitoring->handover` requires handover
- **PRIORITY_LABELS/COLORS**: All 4 priorities covered with valid Tailwind classes
- **HEALTH_LABELS/COLORS**: All 4 statuses covered with valid Tailwind classes
- **PROVINCES**: Exactly 63 entries, unique codes, contains 5 central municipalities
- **VALIDATION**: Positive numeric constraints, valid CODE_PATTERN regex
- **Pagination/Code/Permissions/Columns/Presets**: All validated

### validation.test.ts (46 tests)
- **createProjectSchema**: Valid data passes, defaults applied (priority=medium, currency=VND, tags=[]), boundary testing (min/max name, budget=0), rejection cases (missing name, short name, negative budget, non-integer budget, end<start date, invalid priority/currency/description/UUID)
- **updateProjectSchema**: Partial updates, empty object, nullable fields, type rejection, constraint enforcement on provided fields
- **transitionStageSchema**: Forward/backward transitions, invalid skips, terminal state rejection, invalid UUID/stage values, self-transition rejection, exhaustive test of all 15 valid transitions, exhaustive test of all invalid transitions
- **projectFiltersSchema**: Default values, valid combinations, boundary rejection (page<1, perPage>100), invalid sortBy/sortOrder, UUID validation, date string validation

### queries.test.ts (9 tests)
- Function export verification for `getProjects`, `getProjectById`, `getProjectBySlug`, `getProjectsByDepartment`, `getProjectStats`
- Return shape validation (`PaginatedResult`, `ProjectStats`)
- Null return for non-existent project
- `ProjectListItem` type structure verification

### actions.test.ts (15 tests)
- Function export verification for all 6 actions
- **createProjectAction**: Valid data returns success+slug, invalid data returns error, unauthenticated returns error
- **updateProjectAction**: Invalid data rejected, unauthenticated rejected
- **transitionStageAction**: Invalid transitions rejected (stage skip, terminal state), unauthenticated rejected
- **deleteProjectAction**: Unauthenticated rejected
- **addProjectMemberAction/removeProjectMemberAction**: Export verification

---

## Seed Data Summary

`scripts/seed-projects.ts` adds 7 Vietnamese construction/infrastructure projects:

| Code | Name | Stage | Province | Priority |
|------|------|-------|----------|----------|
| PRJ-004 | Xay dung Cau Nhat Tan mo rong | in_progress | HN | critical |
| PRJ-005 | Trung tam Du lieu Da Nang | planning | DN | high |
| PRJ-006 | Khu Cong nghiep Xanh Binh Duong | testing | BD | medium |
| PRJ-007 | He thong Thoat nuoc TP.HCM GD3 | deployment | HCM | critical |
| PRJ-008 | Phan mem Quan ly Tai chinh DN | staging | HN | high |
| PRJ-009 | Cang Bien Quoc te Hai Phong | initiation | HP | critical |
| PRJ-010 | Duong cao toc Can Tho - Ca Mau | completed | CT | high |

- All stages represented across seed data (combined with existing 3 projects)
- Uses actual PROVINCES values from constants.ts (HN, DN, BD, HCM, HP, CT)
- Mix of priorities: 3 critical, 2 high, 1 medium + existing data
- Realistic Vietnamese project names and descriptions
- Idempotent: checks existing IDs before insert

---

## Key Technical Decisions

1. **Zod v4 UUID compliance**: Test UUIDs use RFC 4122 v4 format (variant bits `[89ab]`), since Zod v4 enforces strict UUID validation unlike v3.
2. **DB mocking strategy**: Queries and actions tests use `vi.mock()` for `@/db`, `@/db/schema`, `@/lib/auth`, `next/cache`, and `drizzle-orm` to avoid requiring a live database.
3. **Exhaustive transition testing**: Both `validation.test.ts` and `constants.test.ts` programmatically verify all 15 valid transitions AND reject all invalid transitions against the `ALLOWED_TRANSITIONS` map.

---

## Verification Commands

```bash
# TypeScript compilation (clean — no errors)
pnpm exec tsc --noEmit

# Run all tests (108 passed, 0 failed)
pnpm exec vitest run tests/modules/projects/
```

---

## pACS Self-Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Faithfulness) | 95 | Tests validate exact contract from ref-state-machine.md (15 transitions), ref-golden-module.md patterns, constants.ts values. Seed data follows ref-seed-data.md patterns. |
| **C** (Completeness) | 92 | All 4 test files created. 108 tests cover constants, validation schemas, queries, actions. Seed script adds 7 projects. Minor gap: query/action tests rely on mock chains that may not exercise full DB behavior (integration test in Step 13). |
| **L** (Lucidity) | 90 | Test structure follows AAA pattern, describe/it blocks with clear descriptions, named exports per CONVENTIONS.md. |
| **T** (Traceability) | 93 | Constants tests reference ref-state-machine.md counts exactly. Validation tests exercise every schema from validation.ts. Seed data uses PROVINCES values from constants.ts. |
| **Final** | **92.5** | Arithmetic mean of (95 + 92 + 90 + 93) / 4 |
