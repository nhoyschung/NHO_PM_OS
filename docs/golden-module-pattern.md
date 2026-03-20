# Golden Module Pattern

> **SOT**: Definitive pattern document for replicating the `projects` golden module.
> Every module in ProjectOpsOS follows the exact structure, naming, and patterns documented here.
> All descriptions are extracted from the **actual implementation** in `src/modules/projects/`.

---

## 1. Module File Structure

```
src/modules/{module}/
  constants.ts              — Enums labels, colors, icons, transitions, validation rules, permissions, filter presets
  types.ts                  — Zod enum schemas, DB row types (InferSelectModel), view models, filter schemas, PaginatedResult<T>
  validation.ts             — Zod schemas for create/update/transition/filter with cross-field refinements
  queries.ts                — Read-only Drizzle query functions (paginated list, getById, getBySlug, stats)
  actions.ts                — Server actions (mutations) with 'use server', auth, audit logging, revalidation
  components/
    index.ts                — Barrel re-export of all components
    {module}-list.tsx       — Client component: table with search, filters, pagination, URL-based state
    {module}-detail.tsx     — Client component: tabbed detail view with sidebar info cards
    {module}-form.tsx       — Client component: create/edit form with Zod client-side validation
    stage-badge.tsx         — Reusable badge for stage/status (reads from constants)
    priority-badge.tsx      — Reusable badge for priority (reads from constants)
    health-badge.tsx        — Reusable badge for health status (reads from constants)
    stage-transition-bar.tsx — Interactive state machine transition UI with confirmation dialog

src/app/(dashboard)/{module}/
  page.tsx                  — Server component: parses searchParams, calls query, renders List
  [slug]/
    page.tsx                — Server component: resolves slug, calls getBySlug, renders Detail client wrapper
    project-detail-client.tsx — Client wrapper: bridges server action to client component via callback

tests/modules/{module}/
  constants.test.ts         — Validates all enum coverage, transition count, Tailwind patterns, province data
  validation.test.ts        — Boundary tests for create/update/transition/filter schemas
  queries.test.ts           — Mock-based tests for query function exports and return shapes
  actions.test.ts           — Mock-based tests for action auth, validation rejection, export verification

scripts/
  seed-{module}.ts          — Idempotent seed script with realistic Vietnamese data
```

---

## 2. File Responsibilities

### 2.1 constants.ts

**Exports (24 named exports in projects):**
- `STAGE_LABELS` — `Record<ProjectStage, string>` Vietnamese labels
- `STAGE_DESCRIPTIONS` — `Record<ProjectStage, string>` Vietnamese descriptions
- `STAGE_COLORS` — `Record<ProjectStage, { bg: string; text: string }>` Tailwind classes
- `STAGE_ICONS` — `Record<ProjectStage, string>` Lucide icon names
- `ALLOWED_TRANSITIONS` — `Record<ProjectStage, readonly ProjectStage[]>` state machine edges
- `TransitionMeta` (interface) + `TRANSITION_META` — trigger, guard, requiredRoles, requiresHandover per edge
- `PRIORITY_LABELS` / `PRIORITY_COLORS` — Vietnamese labels + Tailwind per priority
- `HEALTH_LABELS` / `HEALTH_COLORS` — Vietnamese labels + Tailwind per health status
- `PROVINCES` — 63 Vietnamese provinces as `{ value: string; label: string }[]`
- `VALIDATION` — Numeric constants: NAME_MIN=3, NAME_MAX=200, DESCRIPTION_MAX=2000, etc.
- `DEFAULT_PER_PAGE` (20), `MAX_PER_PAGE` (100), `PROJECT_CODE_PREFIX` ('PRJ')
- `PERMISSIONS` — RBAC keys following `resource:action` pattern (7 keys)
- `DEFAULT_COLUMN_VISIBILITY` — Table column defaults
- `FILTER_PRESETS` — 6 preset filter configs (ALL_ACTIVE, MY_PROJECTS, AT_RISK, BLOCKED, COMPLETED, ARCHIVED)

**Imports:** `type { ProjectStage, ProjectPriority, HealthStatus }` from `./types`

**Key pattern:** All UI-facing strings are Vietnamese. Color objects use `{ bg, text }` shape for Tailwind badge components. State machine is encoded as adjacency list (`ALLOWED_TRANSITIONS`) with metadata map (`TRANSITION_META`) keyed by `"from->to"` strings.

**When replicating:** Replace all enum values, labels, colors, icons, transitions. Keep the same type shapes (`Record<EnumType, string>`, `Record<EnumType, { bg, text }>`). If no state machine, remove `ALLOWED_TRANSITIONS` and `TRANSITION_META`. Always include `VALIDATION`, `PERMISSIONS`, `DEFAULT_PER_PAGE`, `MAX_PER_PAGE`.

### 2.2 types.ts

**Exports (16 named exports in projects):**
- Zod enum schemas: `ProjectStage`, `ProjectPriority`, `HealthStatus`, `ProjectMemberRole` — each with dual `z.enum()` export + `type` alias via `z.infer`
- DB row types: `ProjectRow`, `ProjectMemberRow`, `HandoverRow`, `DocumentRow`, `StageHistoryRow` — via `InferSelectModel<typeof table>`
- View models: `ProjectListItem` (interface, lightweight for list views), `ProjectDetail` (interface, extends `ProjectRow` with relations + `_count`)
- Form schema: `ProjectFormSchema` (Zod) + `ProjectFormData` (inferred type), `ProjectUpdateSchema` + `ProjectUpdateData`
- Transition: `StageTransition` (interface), `StageTransitionInputSchema` (Zod) + `StageTransitionInput`
- Filter: `SortableColumns` (Zod enum), `SortOrder` (Zod enum), `ProjectFilterSchema` (Zod) + `ProjectFilters`
- Generic: `PaginatedResult<T>` (interface with `data`, `total`, `page`, `perPage`, `totalPages`)

**Imports:** `z` from 'zod', `InferSelectModel` from 'drizzle-orm', table types from `@/db/schema/core`

**Key pattern:** Zod schemas are the SOT for type definitions. DB row types are inferred from Drizzle schema (not hand-written). View models are separate interfaces for different UI needs (list vs detail). The `PaginatedResult<T>` generic is defined here and reused by queries.

**When replicating:** Define module-specific Zod enums, DB row types from your schema tables, list/detail view models, form schemas, filter schema. Always include `PaginatedResult<T>` (or import from shared if extracted).

### 2.3 validation.ts

**Exports (6 named exports in projects):**
- `createProjectSchema` — Zod `.object()` with `.refine()` for cross-field validation (endDate >= startDate)
- `CreateProjectInput` — inferred type
- `updateProjectSchema` — partial base with same refinement
- `UpdateProjectInput` — inferred type
- `transitionStageSchema` — Zod `.object()` with `.refine()` against `ALLOWED_TRANSITIONS`
- `projectFiltersSchema` — re-export from types for co-location convenience

**Imports:** `z`, enums from `./types`, `ALLOWED_TRANSITIONS` + `VALIDATION` from `./constants`

**Key pattern:** Validation uses constants from `constants.ts` for limits (`VALIDATION.NAME_MIN`, etc.) rather than hardcoded values. Vietnamese error messages are inline. Cross-field validation uses `.refine()`. The transition schema validates against the actual state machine adjacency list. The update schema makes all fields `.partial()` then applies the same refinement.

**When replicating:** Copy structure, replace field definitions and error messages. If no state machine, remove `transitionStageSchema`. Always use `VALIDATION` constants from `constants.ts`.

### 2.4 queries.ts

**Exports (5 named exports + 1 interface in projects):**
- `getProjects(rawFilters)` — paginated list with dynamic WHERE, LEFT JOINs, member count enrichment
- `getProjectById(id)` — full detail with `db.query.*.findFirst()` and nested `with:` relations + parallel count queries
- `getProjectBySlug(slug)` — slug-to-id lookup then delegates to `getProjectById`
- `getProjectsByDepartment(departmentId)` — convenience wrapper around `getProjects`
- `getProjectStats()` — aggregate stats (total, budget sums, groupBy stage/priority/health)
- `ProjectStats` (interface)

**Imports:** Drizzle operators (`eq`, `and`, `or`, `ilike`, `gte`, `lte`, `desc`, `asc`, `count`, `sql`, `inArray`), `db` from `@/db`, schema tables, types from `./types`, constants from `./constants`

**Key patterns:**
1. **LIKE escaping:** `escapeLikePattern()` helper replaces `%`, `_`, `\\` to prevent pattern injection
2. **Sort column map:** `SORT_COLUMN_MAP` maps filter `sortBy` string values to Drizzle column refs
3. **Parallel queries:** data + count queries run via `Promise.all()` for performance
4. **Member count enrichment:** After main query, batch-fetches member counts with `inArray` and merges into results
5. **Pagination math:** `offset = (page - 1) * perPage`, `totalPages = Math.ceil(total / perPage)`
6. **Zod validation at entry:** `ProjectFilterSchema.parse(rawFilters)` validates + applies defaults before building WHERE

**When replicating:** Replace table references, column mappings, JOIN relations. Keep the `escapeLikePattern`, `SORT_COLUMN_MAP`, parallel query, and Zod-parse-at-entry patterns. Adjust enrichment step to your module's related data.

### 2.5 actions.ts

**Exports (6 named exports in projects):**
- `createProjectAction(data)` — create with auto-generated code + slug + owner membership
- `updateProjectAction(projectId, data)` — partial update with changed-field detection
- `transitionStageAction(projectId, fromStage, targetStage, notes?)` — state machine transition with TOCTOU protection
- `deleteProjectAction(projectId)` — soft delete (sets `isArchived=true`)
- `addProjectMemberAction(projectId, targetUserId, role)` — add/reactivate member
- `removeProjectMemberAction(projectId, targetUserId)` — soft-remove member (prevents owner removal)

**Directive:** `'use server'` at top of file

**Imports:** Drizzle operators, `revalidatePath` from `next/cache`, `db` + schema tables, `auth` from `@/lib/auth`, validation schemas from `./validation`, constants from `./constants`, types from `./types`

**Key patterns:**
1. **Result type:** `ActionResult<T>` = `{ success: true; data?: T } | { success: false; error: string }`
2. **Auth check:** `requireAuth()` returns `{ userId, userEmail, userRole }` from session
3. **Audit log:** `createAuditLog()` internal helper inserts into `auditLogs` table for every mutation
4. **Slug generation:** `toSlug()` strips Vietnamese diacritics + generates collision-avoiding slugs
5. **Code generation:** `generateProjectCode()` reads MAX(code) and increments (e.g., PRJ-001 -> PRJ-002)
6. **TOCTOU protection:** `transitionStageAction` re-reads DB after validation to prevent race conditions
7. **Validation:** `safeParse()` at entry, returns first error message on failure
8. **Changed-field detection:** `updateProjectAction` only persists fields that actually differ from DB
9. **Error handling:** try/catch wrapping with Vietnamese error messages
10. **Revalidation:** `revalidatePath('/dashboard/{module}')` + detail path after mutations

**When replicating:** Keep the `ActionResult<T>` type, `requireAuth()`, `createAuditLog()`, `safeParse()` validation, and `revalidatePath()` patterns. Replace table/schema references. Adapt code/slug generation to module's needs. Remove state machine logic if not applicable.

### 2.6 components/index.ts

**Pattern:** Named re-exports only, no default exports. One line per component.

```typescript
export { ProjectList } from './project-list';
export { ProjectDetail } from './project-detail';
export { ProjectForm } from './project-form';
export { StageTransitionBar } from './stage-transition-bar';
export { StageBadge } from './stage-badge';
export { PriorityBadge } from './priority-badge';
export { HealthBadge } from './health-badge';
```

### 2.7 Page Routes

**List page** (`src/app/(dashboard)/{module}/page.tsx`):
- Server component (no `'use client'`)
- Receives `searchParams: Promise<Record<string, string | string[] | undefined>>`
- Builds `Partial<Filters>` from URL params, passes to query function
- Query function's Zod parse strips invalid enum values
- Renders the client List component with data + filters

**Detail page** (`src/app/(dashboard)/{module}/[slug]/page.tsx`):
- Server component
- Receives `params: Promise<{ slug: string }>`
- Calls `getBySlug()`, returns `notFound()` if null
- Renders a client wrapper component

**Client wrapper** (`project-detail-client.tsx`):
- `'use client'` component at the route level
- Bridges server actions to client components via `useCallback`
- Calls `router.refresh()` after successful mutations

---

## 3. Naming Conventions (Extracted from Actual Code)

### 3.1 File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Module logic files | kebab-case `.ts` | `constants.ts`, `types.ts`, `validation.ts`, `queries.ts`, `actions.ts` |
| React components | kebab-case `.tsx` | `project-list.tsx`, `stage-badge.tsx`, `health-badge.tsx` |
| Barrel exports | `index.ts` | `components/index.ts` |
| Page routes | Next.js convention | `page.tsx`, `layout.tsx` |
| Test files | `{source-name}.test.ts` | `constants.test.ts`, `validation.test.ts` |
| Seed scripts | `seed-{module}.ts` | `seed-projects.ts` |

### 3.2 Export Naming

| Type | Convention | Example |
|------|-----------|---------|
| Zod enum schemas | PascalCase | `ProjectStage`, `ProjectPriority`, `HealthStatus` |
| Zod validation schemas | camelCase | `createProjectSchema`, `updateProjectSchema` |
| Inferred types | PascalCase | `CreateProjectInput`, `ProjectFilters` |
| Interfaces | PascalCase | `ProjectListItem`, `ProjectDetail`, `PaginatedResult<T>` |
| DB row types | PascalCase + `Row` suffix | `ProjectRow`, `ProjectMemberRow` |
| Query functions | camelCase, `get` prefix | `getProjects`, `getProjectById`, `getProjectBySlug`, `getProjectStats` |
| Action functions | camelCase, verb + `Action` suffix | `createProjectAction`, `updateProjectAction`, `deleteProjectAction` |
| Label/color records | UPPER_SNAKE_CASE | `STAGE_LABELS`, `PRIORITY_COLORS`, `HEALTH_LABELS` |
| Config constants | UPPER_SNAKE_CASE | `DEFAULT_PER_PAGE`, `MAX_PER_PAGE`, `VALIDATION` |
| React components | PascalCase function | `ProjectList`, `StageBadge`, `ProjectForm` |

### 3.3 Component Naming

| Component | Naming Pattern | Props Interface |
|-----------|---------------|-----------------|
| List | `{Module}List` | `{Module}ListProps` with `data`, `total`, `page`, `perPage`, `totalPages`, `filters` |
| Detail | `{Module}Detail` | `{Module}DetailProps` with `{module}` (full entity) + `onTransition` callback |
| Form | `{Module}Form` | `{Module}FormProps` with `defaultValues?`, `onSubmit`, `title` |
| Badge | `{Attribute}Badge` | `{Attribute}BadgeProps` with attribute value + optional `className` |

---

## 4. Server Action Pattern

Every server action follows this exact sequence (from `actions.ts`):

```
1. 'use server' directive (file-level)
2. requireAuth() — retrieve session, return early if not authenticated
3. safeParse(input) — Zod validation, return { success: false, error } on failure
4. DB read (if needed) — fetch existing entity for update/transition
5. Business logic — generate codes, detect changes, validate transitions
6. DB write — insert/update/delete via Drizzle
7. createAuditLog() — immutable audit trail record
8. revalidatePath() — invalidate Next.js cache for affected routes
9. Return ActionResult<T> — { success: true, data? } or { success: false, error }
10. try/catch — wraps entire flow, returns Vietnamese error message on failure
```

**ActionResult type pattern:**
```typescript
interface ActionSuccess<T = void> { success: true; data?: T; }
interface ActionError { success: false; error: string; }
type ActionResult<T = void> = ActionSuccess<T> | ActionError;
```

**Auth helper pattern:**
```typescript
async function requireAuth(): Promise<{ userId: string; userEmail: string; userRole: string }> {
  const session = await auth();
  if (!session?.user?.id) return { userId: '', userEmail: '', userRole: '' };
  return { userId: session.user.id, userEmail: session.user.email ?? '', userRole: session.user.role ?? '' };
}
```

**Audit log fields:** userId, userEmail, userRole, action, entityType, entityId, entityName, projectId, oldValues, newValues, description, severity

**Vietnamese error messages:** All user-facing errors are in Vietnamese (e.g., `'Ban can dang nhap de tao du an.'`, `'Khong the tao du an: ...'`)

---

## 5. Query Pattern

### 5.1 Paginated List Query

```
1. Parse raw filters through Zod schema (applies defaults for page, perPage, sortBy, sortOrder)
2. Build dynamic WHERE conditions array from non-undefined filter fields
3. Combine conditions with and(...conditions)
4. Map sortBy string to Drizzle column reference via SORT_COLUMN_MAP
5. Execute data query + count query in parallel via Promise.all()
6. Enrich with related counts (e.g., member count via batch inArray query)
7. Map rows to view model type
8. Return PaginatedResult<T>
```

### 5.2 Detail Query

```
1. Use db.query.{table}.findFirst() with nested `with:` for eager-loaded relations
2. Compute aggregate counts via parallel Promise.all() count queries
3. Merge into result with _count field
4. Return full detail type or null
```

### 5.3 By-Slug Query

```
1. SELECT id FROM {table} WHERE slug = ? LIMIT 1
2. If not found, return null
3. Delegate to getById() for full detail loading
```

### 5.4 Stats/Aggregate Query

```
1. Multiple parallel queries: total count, SUM aggregates, GROUP BY breakdowns
2. Use COALESCE for null-safe sums
3. Convert to Record<string, number> maps
4. Return stats interface
```

### 5.5 LIKE Pattern Escaping

```typescript
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}
```

Applied to all `ilike()` search queries to prevent wildcard injection.

---

## 6. Component Patterns

### 6.1 Server-Client Separation

- **Page routes** are server components that fetch data and pass as props
- **Module components** are `'use client'` components that handle interactivity
- **Client wrappers** bridge server actions to client components at the route level

### 6.2 URL-Based State Management (ProjectList)

```
1. useSearchParams() to read current URL state
2. updateParams() helper: creates new URLSearchParams, sets/deletes keys, resets page on filter change
3. useTransition() for non-blocking navigation
4. router.push() with updated query string
```

### 6.3 Form with Zod Validation (ProjectForm)

```
1. Native <form> with FormData extraction
2. Client-side: createProjectSchema.safeParse(raw) before submission
3. Field-level errors stored in Record<string, string> state
4. Server error displayed from action response
5. useTransition() wraps async onSubmit
6. On success: router.push() to detail or list page
7. FieldGroup helper component for label + input + error display
```

### 6.4 Badge Component Pattern

All badges follow identical structure:
```typescript
'use client';
import { cn } from '@/lib/utils';
import { {ATTR}_LABELS, {ATTR}_COLORS } from '../constants';
import type { {AttrType} } from '../types';

interface {Attr}BadgeProps {
  {attr}: {AttrType};
  className?: string;
}

export function {Attr}Badge({ {attr}, className }: {Attr}BadgeProps) {
  const colors = {ATTR}_COLORS[{attr}];
  const label = {ATTR}_LABELS[{attr}];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors.bg, colors.text, className)}>
      {label}
    </span>
  );
}
```

### 6.5 Detail View Pattern (ProjectDetail)

```
1. Tab-based navigation with useState<TabKey>
2. Two-column layout: tabs content (2/3) + sidebar info cards (1/3)
3. Tabs defined as array: { key, label, icon: LucideIcon, count? }
4. Sidebar cards: InfoCard (key-value pairs), MembersCard (avatar list)
5. Stage transition bar integrated above tabs
6. PlaceholderTab for not-yet-implemented sub-modules
```

### 6.6 Stage Transition Bar (StageTransitionBar)

```
1. Reads ALLOWED_TRANSITIONS for current stage
2. Renders target buttons; hidden when no transitions (terminal state)
3. Click sets confirmTarget state, shows confirmation dialog with notes textarea
4. Confirm calls onTransition callback with useTransition wrapper
5. Error displayed inline; cancel resets state
```

---

## 7. Test Patterns

### 7.1 Constants Validation Tests (`constants.test.ts` — 374 lines)

- **Enum coverage:** For each record (`STAGE_LABELS`, `PRIORITY_COLORS`, etc.), verify every enum value has an entry and no extra keys exist
- **Tailwind pattern:** Regex `^bg-[a-z]+-\d{2,3}$` / `^text-[a-z]+-\d{2,3}$` for color validation
- **State machine:** Verify exactly 15 transitions total, 9 forward + 6 backward, completed is terminal
- **Transition meta:** Verify 15 entries, keys match ALLOWED_TRANSITIONS edges, valid shape (trigger, guard, requiredRoles, requiresHandover)
- **Provinces:** Verify exactly 63, unique codes, 5 centrally-run municipalities present
- **Validation constants:** Positive values, CODE_PATTERN regex correctness
- **Permissions:** `resource:action` naming pattern
- **Filter presets:** Label + filters shape verification

### 7.2 Zod Schema Boundary Tests (`validation.test.ts` — 378 lines)

- **Valid input acceptance:** Full valid object, defaults applied (priority, currency, tags)
- **Boundary values:** name at exact min (3) and max (200), budget=0 accepted
- **Rejection cases:** Missing required fields, too short/long, negative budget, non-integer budget, invalid enum values, invalid UUID, date ordering (endDate < startDate)
- **Update schema:** Partial acceptance, nullable fields, still enforces constraints when field present
- **Transition schema:** All 15 valid transitions pass, all disallowed transitions rejected (exhaustive matrix), self-transition rejected, terminal state rejected
- **Filter schema:** Defaults verification (page=1, perPage=20, sortBy='updated_at', sortOrder='desc'), boundary rejection (page<1, perPage>100), invalid sortBy/sortOrder

### 7.3 Query Mock Tests (`queries.test.ts` — 261 lines)

- **Mock strategy:** Mock `@/db`, `@/db/schema`, `drizzle-orm` entirely to avoid DB connection
- **Chain builder:** `createChainMock()` returns chained `.select().from().where()...` mock objects
- **Export verification:** Each query function is an exported async function
- **Return shape:** `PaginatedResult` has `data`, `total`, `page`, `perPage`, `totalPages`
- **Null handling:** `getProjectById` returns null for non-existent
- **Type-level tests:** Verify `ProjectListItem` has expected fields

### 7.4 Action Mock Tests (`actions.test.ts` — 262 lines)

- **Mock strategy:** Mock `@/lib/auth`, `next/cache`, `@/db`, `@/db/schema`, `drizzle-orm`
- **Export verification:** Each action is an exported async function
- **Auth rejection:** When session has no user, all actions return `{ success: false }`
- **Validation rejection:** Invalid input (e.g., name too short) returns `{ success: false, error }`
- **State machine rejection:** Invalid transitions (skip stages, from terminal) return `{ success: false }`

---

## 8. Seed Data Pattern

### 8.1 Script Structure (`seed-projects.ts` — 349 lines)

```typescript
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });
```

### 8.2 Key Patterns

1. **Deterministic UUIDs:** Fixed UUID format `00000000-0000-0000-{segment}-{number}` for reproducible data
2. **Idempotent insertion:** Check by ID before insert, skip if exists
3. **Unique constraint handling:** Try/catch for members with `23505` (unique violation) detection
4. **Foreign key awareness:** Reference existing user IDs and department IDs from prior seed
5. **Vietnamese realistic data:** Project names, descriptions, categories in Vietnamese; real province codes
6. **Full stage coverage:** 9 additional projects cover all 10 stages (combined with base seed's 3 projects)
7. **Related data:** Project members created after projects, respecting project ownership
8. **Verification:** After seeding, counts total projects and lists unique stages covered
9. **Connection cleanup:** `await sql.end()` at completion

### 8.3 Data Shape

Each seed project includes all required fields:
```typescript
{
  id: string,         // deterministic UUID
  name: string,       // Vietnamese
  code: string,       // PRJ-NNN
  slug: string,       // kebab-case from name
  description: string, // Vietnamese
  category: string,
  priority: 'critical' | 'high' | 'medium' | 'low',
  stage: ProjectStage,
  managerId: string,  // FK to users
  departmentId: string, // FK to departments
  teamLeadId: string | null,
  province: string,   // matches PROVINCES.value
  startDate: string,
  endDate: string,
  budget: number,
  budgetSpent: number,
  currency: 'VND',
  progressPercentage: number,
  healthStatus: HealthStatus,
  tags: string[],
}
```

---

## 9. Replication Checklist

When creating a new module (e.g., `tasks`, `documents`, `handovers`, `teams`, `reports`, `departments`):

### Phase 1: Module Core (4 files)

- [ ] **constants.ts** — Define:
  - [ ] Vietnamese labels for all enums (`{ENUM}_LABELS: Record<EnumType, string>`)
  - [ ] Tailwind color maps (`{ENUM}_COLORS: Record<EnumType, { bg: string; text: string }>`)
  - [ ] Icon maps if applicable (`{ENUM}_ICONS: Record<EnumType, string>`)
  - [ ] State machine transitions if applicable (`ALLOWED_TRANSITIONS`, `TRANSITION_META`)
  - [ ] `VALIDATION` object with numeric limits
  - [ ] `PERMISSIONS` object with RBAC keys
  - [ ] `DEFAULT_PER_PAGE`, `MAX_PER_PAGE`
  - [ ] Module-specific code prefix
  - [ ] `DEFAULT_COLUMN_VISIBILITY`, `FILTER_PRESETS`

- [ ] **types.ts** — Define:
  - [ ] Zod enum schemas with dual type export (`z.enum()` + `type = z.infer`)
  - [ ] DB row types via `InferSelectModel<typeof table>`
  - [ ] `{Module}ListItem` interface (lightweight fields + joined fields)
  - [ ] `{Module}Detail` interface (extends Row + relations + `_count`)
  - [ ] `{Module}FormSchema` (Zod) + `{Module}FormData` type
  - [ ] `{Module}UpdateSchema` via `.partial()`
  - [ ] `{Module}FilterSchema` (Zod) with page, perPage, sortBy, sortOrder defaults
  - [ ] `PaginatedResult<T>` (or import from shared)

- [ ] **validation.ts** — Define:
  - [ ] `create{Module}Schema` with Vietnamese error messages, cross-field `.refine()`
  - [ ] `update{Module}Schema` via base `.partial()` + same refinements
  - [ ] `transition{Status}Schema` if state machine exists
  - [ ] Re-export `{module}FiltersSchema` from types

- [ ] **queries.ts** — Implement:
  - [ ] `get{Module}s(rawFilters)` — paginated list with `escapeLikePattern`, `SORT_COLUMN_MAP`, `Promise.all()`
  - [ ] `get{Module}ById(id)` — full detail with `db.query.*.findFirst()` + nested relations
  - [ ] `get{Module}BySlug(slug)` — slug lookup + delegate to getById (if slug exists)
  - [ ] `get{Module}Stats()` — aggregate counts and sums (if dashboard stats needed)

### Phase 2: Server Actions (1 file)

- [ ] **actions.ts** — Implement:
  - [ ] `'use server'` directive
  - [ ] `requireAuth()` helper (copy pattern)
  - [ ] `createAuditLog()` helper (copy pattern)
  - [ ] `create{Module}Action(data)` — validate, generate code/slug, insert, audit, revalidate
  - [ ] `update{Module}Action(id, data)` — validate, detect changes, update, audit, revalidate
  - [ ] `delete{Module}Action(id)` — soft delete (set isArchived), audit, revalidate
  - [ ] State transition action if applicable
  - [ ] Member management actions if applicable
  - [ ] All return `ActionResult<T>`

### Phase 3: UI Components (7+ files)

- [ ] **components/{module}-list.tsx** — `'use client'`, URL-based filters, table, pagination
- [ ] **components/{module}-detail.tsx** — `'use client'`, tabbed view, sidebar cards
- [ ] **components/{module}-form.tsx** — `'use client'`, Zod client validation, FieldGroup helper
- [ ] **components/{status}-badge.tsx** — Badge per enum, reads from constants
- [ ] **components/index.ts** — Barrel re-exports

### Phase 4: Page Routes (3 files)

- [ ] **src/app/(dashboard)/{module}/page.tsx** — Server component, parse searchParams, call query, render List
- [ ] **src/app/(dashboard)/{module}/[slug]/page.tsx** — Server component, resolve slug, render client wrapper
- [ ] **src/app/(dashboard)/{module}/[slug]/{module}-detail-client.tsx** — Client wrapper bridging actions to components

### Phase 5: Tests (4 files)

- [ ] **tests/modules/{module}/constants.test.ts** — Enum coverage, color patterns, transition count, province/data integrity
- [ ] **tests/modules/{module}/validation.test.ts** — Valid/invalid boundary tests for all schemas
- [ ] **tests/modules/{module}/queries.test.ts** — Mock DB, verify exports and return shapes
- [ ] **tests/modules/{module}/actions.test.ts** — Mock auth/DB, verify auth rejection, validation rejection

### Phase 6: Seed Data (1 file)

- [ ] **scripts/seed-{module}.ts** — Idempotent, deterministic UUIDs, FK-aware, Vietnamese data, stage coverage

### Phase 7: Integration

- [ ] Add navigation link in sidebar layout
- [ ] Run `pnpm exec tsc --noEmit` — zero errors
- [ ] Run `pnpm exec vitest run tests/modules/{module}/` — all pass
- [ ] Verify pages render at `/dashboard/{module}` and `/dashboard/{module}/{slug}`

---

## 10. Import Dependency Graph

```
constants.ts ←── types.ts (type imports for Record keys)
     ↑               ↑
     |               |
validation.ts ───────┘ (imports enums from types, VALIDATION/TRANSITIONS from constants)
     ↑
     |
queries.ts ──── imports: types (filter/result types), constants (DEFAULT_PER_PAGE), @/db, @/db/schema, drizzle-orm
     ↑
     |
actions.ts ──── imports: validation (schemas), constants (TRANSITIONS, PREFIX), types, @/db, @/db/schema, @/lib/auth, next/cache
     ↑
     |
components/ ─── imports: types (view models), constants (labels, colors), @/lib/utils, lucide-react
     ↑
     |
pages/ ───────── imports: queries (data fetching), components (rendering), types (filter type)
```

**Dependency direction:** `constants ← types ← validation ← queries/actions ← components ← pages`. Nothing imports in reverse.

---

*Generated from actual implementation in `src/modules/projects/` — ProjectOpsOS Phase 3, Step 14.*
