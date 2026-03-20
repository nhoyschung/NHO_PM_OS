# Reference: Golden Module Pattern

> **SOT** for the canonical module implementation pattern. The `projects` module serves as the golden reference that all other modules replicate.

---

## 1. What Is the Golden Module?

The golden module is a fully implemented, production-quality reference module. Every new module in the system follows this exact structure, naming, and pattern. The `projects` module is the golden module because:

1. It touches all layers (database, server actions, validation, UI components, API)
2. It demonstrates all patterns (CRUD, state machine, RLS, pagination, search)
3. It has the most complex business logic (stage transitions, team membership)
4. Other modules are simpler subsets of what `projects` does

---

## 2. Directory Structure

```
src/modules/projects/
├── types.ts                 # Types + Zod schemas (SOT for this module)
├── constants.ts             # Module-specific constants
├── validation.ts            # Input validation schemas
├── queries.ts               # Read operations (database queries)
├── actions.ts               # Write operations (server actions)
├── components/              # React components
│   ├── ProjectList.tsx      # List view with pagination + filters
│   ├── ProjectDetail.tsx    # Detail view
│   ├── ProjectForm.tsx      # Create/Edit form
│   ├── ProjectCard.tsx      # Card component for grid view
│   ├── ProjectStatusBadge.tsx  # Stage badge with color
│   ├── ProjectStageTimeline.tsx # Visual stage progress
│   ├── ProjectFilters.tsx   # Filter controls
│   └── index.ts             # Re-exports
├── hooks/                   # React hooks (optional)
│   ├── use-projects.ts      # Data fetching hook
│   ├── use-project-filters.ts # Filter state management
│   └── index.ts
└── index.ts                 # Public API
```

---

## 3. File-by-File Specification

### 3.1 types.ts — Type Definitions (SOT)

```typescript
// src/modules/projects/types.ts

import { z } from 'zod';

// ---- Enums as Zod schemas ----

export const ProjectStage = z.enum([
  'initiation', 'planning', 'in_progress', 'review', 'testing',
  'staging', 'deployment', 'monitoring', 'handover', 'completed',
]);
export type ProjectStage = z.infer<typeof ProjectStage>;

export const ProjectPriority = z.enum(['critical', 'high', 'medium', 'low']);
export type ProjectPriority = z.infer<typeof ProjectPriority>;

export const HealthStatus = z.enum(['on_track', 'at_risk', 'delayed', 'blocked']);
export type HealthStatus = z.infer<typeof HealthStatus>;

// ---- Entity schema ----

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(200),
  code: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  category: z.string().nullable(),
  priority: ProjectPriority,
  stage: ProjectStage,
  owner_id: z.string().uuid(),
  department_id: z.string().uuid().nullable(),
  team_lead_id: z.string().uuid().nullable(),
  start_date: z.string().date().nullable(),
  target_end_date: z.string().date().nullable(),
  actual_end_date: z.string().date().nullable(),
  budget_allocated: z.number().int().nullable(),
  budget_spent: z.number().int(),
  currency: z.string(),
  progress_percentage: z.number().int().min(0).max(100),
  health_status: HealthStatus,
  tags: z.array(z.string()),
  is_archived: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

// ---- List/filter types ----

export const ProjectFilterSchema = z.object({
  search: z.string().optional(),
  stage: ProjectStage.optional(),
  priority: ProjectPriority.optional(),
  health_status: HealthStatus.optional(),
  department_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  is_archived: z.boolean().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'priority', 'stage']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

### 3.2 constants.ts — Module Constants

```typescript
// src/modules/projects/constants.ts

import type { ProjectStage, ProjectPriority, HealthStatus } from './types';

export const STAGE_LABELS_VI: Record<ProjectStage, string> = {
  initiation: 'Khởi tạo',
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thực hiện',
  review: 'Đánh giá',
  testing: 'Kiểm thử',
  staging: 'Tiền triển khai',
  deployment: 'Triển khai',
  monitoring: 'Giám sát',
  handover: 'Bàn giao',
  completed: 'Hoàn thành',
};

export const PRIORITY_LABELS_VI: Record<ProjectPriority, string> = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export const HEALTH_LABELS_VI: Record<HealthStatus, string> = {
  on_track: 'Đúng tiến độ',
  at_risk: 'Có rủi ro',
  delayed: 'Trễ tiến độ',
  blocked: 'Bị chặn',
};

export const PROJECT_CODE_PREFIX = 'PRJ';
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;
```

### 3.3 validation.ts — Input Validation

```typescript
// src/modules/projects/validation.ts

import { z } from 'zod';
import { ProjectPriority } from './types';

export const CreateProjectInput = z.object({
  name: z.string().min(3, 'Tên dự án phải có ít nhất 3 ký tự').max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  priority: ProjectPriority.default('medium'),
  department_id: z.string().uuid().optional(),
  team_lead_id: z.string().uuid().optional(),
  start_date: z.string().date().optional(),
  target_end_date: z.string().date().optional(),
  budget_allocated: z.number().int().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  tags: z.array(z.string()).default([]),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export const UpdateProjectInput = CreateProjectInput.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;

export const TransitionStageInput = z.object({
  project_id: z.string().uuid(),
  target_stage: z.string(),  // Validated against allowed transitions
  reason: z.string().min(1).max(1000).optional(),
});
export type TransitionStageInput = z.infer<typeof TransitionStageInput>;
```

### 3.4 queries.ts — Read Operations

```typescript
// src/modules/projects/queries.ts
'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and, ilike, sql, desc, asc } from 'drizzle-orm';
import type { ProjectFilter, PaginatedResult, Project } from './types';
import { ProjectFilterSchema } from './types';

export async function getProjects(
  rawFilters: Partial<ProjectFilter>
): Promise<PaginatedResult<Project>> {
  const filters = ProjectFilterSchema.parse(rawFilters);

  const conditions = [];

  if (filters.search) {
    conditions.push(
      ilike(projects.name, `%${filters.search}%`)
    );
  }
  if (filters.stage) conditions.push(eq(projects.stage, filters.stage));
  if (filters.priority) conditions.push(eq(projects.priority, filters.priority));
  if (filters.health_status) conditions.push(eq(projects.health_status, filters.health_status));
  if (filters.department_id) conditions.push(eq(projects.department_id, filters.department_id));
  if (filters.is_archived !== undefined) conditions.push(eq(projects.is_archived, filters.is_archived));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select()
      .from(projects)
      .where(where)
      .orderBy(filters.sort_order === 'asc' ? asc(projects[filters.sort_by]) : desc(projects[filters.sort_by]))
      .limit(filters.per_page)
      .offset((filters.page - 1) * filters.per_page),
    db.select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(where),
  ]);

  const total = Number(countResult[0].count);

  return {
    data,
    total,
    page: filters.page,
    per_page: filters.per_page,
    total_pages: Math.ceil(total / filters.per_page),
  };
}

export async function getProjectById(id: string): Promise<Project | null> {
  const result = await db.select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const result = await db.select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  return result[0] ?? null;
}
```

### 3.5 actions.ts — Write Operations

```typescript
// src/modules/projects/actions.ts
'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/modules/audit/actions';
import { CreateProjectInput, UpdateProjectInput, TransitionStageInput } from './validation';
import { canTransition } from './state-machine';
import { generateProjectCode, generateSlug } from './utils';

export async function createProject(input: unknown) {
  const data = CreateProjectInput.parse(input);
  const code = await generateProjectCode();
  const slug = generateSlug(data.name);

  const [project] = await db.insert(projects).values({
    ...data,
    code,
    slug,
    stage: 'initiation',
    owner_id: /* current user id from auth */,
  }).returning();

  await createAuditLog({
    action: 'create',
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project.name,
    new_values: data,
  });

  revalidatePath('/dashboard/projects');
  return project;
}

export async function updateProject(id: string, input: unknown) {
  const data = UpdateProjectInput.parse(input);
  const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!existing[0]) throw new Error('Project not found');

  const [updated] = await db.update(projects)
    .set({ ...data, updated_at: new Date() })
    .where(eq(projects.id, id))
    .returning();

  await createAuditLog({
    action: 'update',
    entity_type: 'project',
    entity_id: id,
    entity_name: updated.name,
    old_values: existing[0],
    new_values: data,
  });

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${updated.slug}`);
  return updated;
}

export async function transitionStage(input: unknown) {
  const { project_id, target_stage, reason } = TransitionStageInput.parse(input);

  const project = await db.select().from(projects).where(eq(projects.id, project_id)).limit(1);
  if (!project[0]) throw new Error('Project not found');

  const result = canTransition(project[0].stage, target_stage, /* user role */);
  if (!result.allowed) throw new Error(result.reason);

  const [updated] = await db.update(projects)
    .set({ stage: target_stage, updated_at: new Date() })
    .where(eq(projects.id, project_id))
    .returning();

  await createAuditLog({
    action: 'stage_change',
    entity_type: 'project',
    entity_id: project_id,
    entity_name: updated.name,
    old_values: { stage: project[0].stage },
    new_values: { stage: target_stage },
    description: reason,
  });

  revalidatePath('/dashboard/projects');
  return updated;
}

export async function deleteProject(id: string) {
  // Soft delete
  const [deleted] = await db.update(projects)
    .set({ deleted_at: new Date(), is_archived: true })
    .where(eq(projects.id, id))
    .returning();

  await createAuditLog({
    action: 'delete',
    entity_type: 'project',
    entity_id: id,
    entity_name: deleted.name,
  });

  revalidatePath('/dashboard/projects');
  return deleted;
}
```

### 3.6 index.ts — Public API

```typescript
// src/modules/projects/index.ts

// Types
export type { Project, ProjectFilter, PaginatedResult } from './types';
export { ProjectSchema, ProjectStage, ProjectPriority, HealthStatus } from './types';

// Constants
export { STAGE_LABELS_VI, PRIORITY_LABELS_VI, HEALTH_LABELS_VI } from './constants';

// Queries
export { getProjects, getProjectById, getProjectBySlug } from './queries';

// Actions
export { createProject, updateProject, transitionStage, deleteProject } from './actions';

// Components
export {
  ProjectList,
  ProjectDetail,
  ProjectForm,
  ProjectCard,
  ProjectStatusBadge,
} from './components';
```

---

## 4. Pattern Rules

### 4.1 Every Module Must Have
- `types.ts` with Zod schemas as SOT
- `validation.ts` for input validation (separate from entity schemas)
- `queries.ts` for read operations
- `actions.ts` for write operations with `'use server'`
- `components/` directory with at least List, Detail, and Form components
- `index.ts` with explicit re-exports

### 4.2 Every Action Must
- Validate input with Zod `.parse()` at the entry point
- Check authorization (role-based)
- Create an audit log entry
- Call `revalidatePath()` for affected routes
- Return the created/updated entity

### 4.3 Every Query Must
- Accept a typed filter object (Zod-validated)
- Support pagination (`page`, `per_page`)
- Support sorting (`sort_by`, `sort_order`)
- Return a `PaginatedResult<T>` for list queries

### 4.4 Every Component Must
- Accept props typed from `types.ts`
- Use Vietnamese labels from `constants.ts`
- Handle loading and error states
- Be accessible (WCAG 2.1 AA)

---

## 5. Replication Checklist

When creating a new module, copy the `projects` module and adapt:

- [ ] `types.ts` — Define entity schema, filter schema, enums
- [ ] `constants.ts` — Define Vietnamese labels, module constants
- [ ] `validation.ts` — Define create/update input schemas
- [ ] `queries.ts` — Implement list (paginated + filtered), getById
- [ ] `actions.ts` — Implement create, update, delete with audit logs
- [ ] `components/` — Implement List, Detail, Form, Card, StatusBadge
- [ ] `hooks/` — Data fetching and filter state hooks (if needed)
- [ ] `index.ts` — Export public API
- [ ] Register routes in `app/(dashboard)/`
- [ ] Add to navigation sidebar
- [ ] Add seed data

---

*Source: PRD v1.0 §6 (F3), §7.2, §16.1*
