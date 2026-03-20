# Step 11: Golden Module — Server Actions

## File Created

| File | Lines | Status |
|------|-------|--------|
| `src/modules/projects/actions.ts` | 660 | TypeScript clean (0 errors) |

## Actions Implemented

| # | Export | Signature | Description |
|---|--------|-----------|-------------|
| 1 | `createProjectAction` | `(data: ProjectFormData) => Promise<{success, error?, slug?}>` | Create project with auto PRJ-XXX code, unique slug, owner membership |
| 2 | `updateProjectAction` | `(projectId: string, data: Partial<ProjectFormData>) => Promise<ActionResult<{id, slug}>>` | Partial update, only changed fields persisted |
| 3 | `transitionStageAction` | `(projectId, fromStage, targetStage, notes?) => Promise<{success, error?}>` | State machine validated, TOCTOU protected, role-checked |
| 4 | `deleteProjectAction` | `(projectId: string) => Promise<ActionResult>` | Soft delete (isArchived=true) |
| 5 | `addProjectMemberAction` | `(projectId, targetUserId, role?) => Promise<ActionResult<{id}>>` | Add/reactivate team member |
| 6 | `removeProjectMemberAction` | `(projectId, targetUserId) => Promise<ActionResult>` | Soft-remove member, owner protected |

## Internal Helpers (not exported)

| Helper | Purpose |
|--------|---------|
| `requireAuth()` | Session extraction via next-auth |
| `createAuditLog()` | Immutable audit_logs insert (type-safe enums) |
| `toSlug()` / `generateUniqueSlug()` | Vietnamese-safe slug with collision avoidance |
| `generateProjectCode()` | Sequential PRJ-001, PRJ-002, ... from MAX(code) |
| `getTransitionDirection()` | forward/backward based on STAGE_ORDER |

## Key Patterns (Canonical Reference for Replication)

### 1. Action Wrapper Pattern
- All actions use `'use server'` directive
- Auth check via `requireAuth()` at the top of every action
- Try/catch returns `{ success: false, error }` -- never throws to client
- Vietnamese error messages throughout

### 2. Audit Logging
- Every mutation (create/update/delete/transition/assign/unassign) produces an audit log
- Uses typed enums from `auditActionEnum` and `auditEntityTypeEnum`
- Old/new values stored as JSONB for change tracking

### 3. State Machine Enforcement
- Double validation: Zod schema refinement + `ALLOWED_TRANSITIONS` lookup
- TOCTOU protection: re-reads `project.stage` from DB before applying transition
- Role permission check via `TRANSITION_META[key].requiredRoles`
- Stage history record with direction (forward/backward) + trigger name

### 4. Path Revalidation
- `revalidatePath('/dashboard/projects')` on all mutations
- `revalidatePath('/dashboard/projects/[slug]')` on detail-affecting changes

### 5. UI Contract Preservation
- `createProjectAction` and `transitionStageAction` maintain exact return shapes expected by existing UI components (`project-form-client.tsx`, `project-detail-client.tsx`)
- No breaking changes to Step 10 component wiring

## pACS Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **F** (Functionality) | 95 | All 6 actions implemented with validation, auth, audit, state machine. No API routes -- server actions only as required. |
| **C** (Consistency) | 95 | Follows CONVENTIONS.md (named exports, camelCase, Drizzle ORM, Zod validation). Matches golden module reference pattern. |
| **L** (Longevity) | 90 | Clean separation of concerns (helpers, typed enums, collision-safe slugs). Replication-ready patterns. Minor: slug generation could be extracted to shared util. |
| **T** (Thoroughness) | 92 | TOCTOU protection, role checks, Vietnamese error messages, owner-cannot-be-removed guard, member reactivation logic. TypeScript strict mode passes. |
| **Final** | **93** | Arithmetic mean of (95 + 95 + 90 + 92) / 4 |
