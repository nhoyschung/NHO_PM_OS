# Reference: Core Schema

> **SOT** for core domain tables: projects, handovers, documents. Extracted from PRD §6, §7, §16.1.

---

## Overview

Core tables represent the primary business domain of the generated SaaS. These tables are **LLM-generated** from the DataModel Registry and require human review for semantic correctness. The structures below are the specification that LLM-generated schemas must conform to.

---

## 1. Projects Table

The central entity. Projects move through a 10-stage lifecycle (see `ref-state-machine.md`).

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identity
  name: text('name').notNull(),
  code: text('code').notNull().unique(),       // Auto-generated project code: PRJ-001
  description: text('description'),
  slug: text('slug').notNull().unique(),

  // Classification
  category: text('category'),                  // Project category/type
  priority: text('priority', {
    enum: ['critical', 'high', 'medium', 'low']
  }).default('medium').notNull(),

  // State machine
  stage: text('stage', {
    enum: [
      'initiation',
      'planning',
      'in_progress',
      'review',
      'testing',
      'staging',
      'deployment',
      'monitoring',
      'handover',
      'completed'
    ]
  }).default('initiation').notNull(),

  // Ownership
  owner_id: uuid('owner_id').references(() => users.id).notNull(),
  department_id: uuid('department_id').references(() => departments.id),
  team_lead_id: uuid('team_lead_id').references(() => users.id),

  // Timeline
  start_date: date('start_date'),
  target_end_date: date('target_end_date'),
  actual_end_date: date('actual_end_date'),

  // Budget
  budget_allocated: integer('budget_allocated'),  // In smallest currency unit (cents)
  budget_spent: integer('budget_spent').default(0),
  currency: text('currency').default('USD'),

  // Progress
  progress_percentage: integer('progress_percentage').default(0),
  health_status: text('health_status', {
    enum: ['on_track', 'at_risk', 'delayed', 'blocked']
  }).default('on_track'),

  // Metadata
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata').default({}),
  is_archived: boolean('is_archived').default(false).notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
```

### Projects — RLS Policies

```sql
-- Project members can read their projects
CREATE POLICY "projects_read_members"
  ON projects FOR SELECT
  USING (
    owner_id = auth.uid()
    OR team_lead_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

-- Project owner and team lead can update
CREATE POLICY "projects_update_owner_lead"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid() OR team_lead_id = auth.uid());

-- Only owner can delete (soft delete)
CREATE POLICY "projects_delete_owner"
  ON projects FOR DELETE
  USING (owner_id = auth.uid());

-- Admins and managers can read all projects
CREATE POLICY "projects_admin_read_all"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'manager')
    )
  );
```

---

## 2. Project Members Table (Junction)

```typescript
export const project_members = pgTable('project_members', {
  id: uuid('id').primaryKey().defaultRandom(),

  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id).notNull(),

  role: text('role', {
    enum: ['owner', 'lead', 'member', 'reviewer', 'observer']
  }).default('member').notNull(),

  joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  removed_at: timestamp('removed_at', { withTimezone: true }),
  is_active: boolean('is_active').default(true).notNull(),
});
```

---

## 3. Handovers Table

Handovers track the formal transfer of project responsibility between team members or departments.

```typescript
export const handovers = pgTable('handovers', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  project_id: uuid('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),

  // Handover type
  type: text('type', {
    enum: ['project_transfer', 'stage_transition', 'team_change', 'department_transfer', 'role_change']
  }).notNull(),

  // Parties
  from_user_id: uuid('from_user_id').references(() => users.id).notNull(),
  to_user_id: uuid('to_user_id').references(() => users.id).notNull(),
  from_department_id: uuid('from_department_id').references(() => departments.id),
  to_department_id: uuid('to_department_id').references(() => departments.id),

  // Status
  status: text('status', {
    enum: ['draft', 'pending_review', 'in_review', 'approved', 'rejected', 'completed', 'cancelled']
  }).default('draft').notNull(),

  // Stage context (which project stage this handover relates to)
  from_stage: text('from_stage'),
  to_stage: text('to_stage'),

  // Dates
  initiated_at: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
  review_started_at: timestamp('review_started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  due_date: timestamp('due_date', { withTimezone: true }),

  // Approval
  approved_by: uuid('approved_by').references(() => users.id),
  rejection_reason: text('rejection_reason'),

  // Notes and metadata
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 4. Handover Checklist Items Table

Each handover has a checklist of items that must be verified before the handover is complete.

```typescript
export const handover_checklist_items = pgTable('handover_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),

  handover_id: uuid('handover_id').references(() => handovers.id, { onDelete: 'cascade' }).notNull(),

  // Item definition
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['documentation', 'access_transfer', 'knowledge_transfer', 'tool_setup', 'review', 'signoff', 'other']
  }).default('other').notNull(),

  // Status
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_by: uuid('completed_by').references(() => users.id),
  completed_at: timestamp('completed_at', { withTimezone: true }),

  // Priority and ordering
  priority: text('priority', { enum: ['required', 'recommended', 'optional'] }).default('required').notNull(),
  sort_order: integer('sort_order').default(0).notNull(),

  // Verification
  requires_evidence: boolean('requires_evidence').default(false).notNull(),
  evidence_url: text('evidence_url'),
  evidence_notes: text('evidence_notes'),

  // From template?
  template_id: text('template_id'),  // Reference to checklist template

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 5. Documents Table

```typescript
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  project_id: uuid('project_id').references(() => projects.id),
  handover_id: uuid('handover_id').references(() => handovers.id),

  // Document info
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['requirement', 'design', 'technical', 'test_plan', 'user_guide', 'handover', 'report', 'meeting_notes', 'other']
  }).default('other').notNull(),

  // Storage
  file_path: text('file_path'),              // Storage path or URL
  file_size: integer('file_size'),           // In bytes
  mime_type: text('mime_type'),
  content: text('content'),                  // For text-based documents

  // Version control
  current_version: integer('current_version').default(1).notNull(),

  // Ownership
  created_by: uuid('created_by').references(() => users.id).notNull(),

  // Status
  status: text('status', {
    enum: ['draft', 'review', 'approved', 'archived', 'obsolete']
  }).default('draft').notNull(),

  // Metadata
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata').default({}),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
```

---

## 6. Document Versions Table

```typescript
export const document_versions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),

  document_id: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),

  // Version
  version_number: integer('version_number').notNull(),
  change_summary: text('change_summary'),

  // Content snapshot
  content: text('content'),
  file_path: text('file_path'),
  file_size: integer('file_size'),

  // Author
  created_by: uuid('created_by').references(() => users.id).notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 7. Relations

```typescript
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.owner_id],
    references: [users.id],
  }),
  team_lead: one(users, {
    fields: [projects.team_lead_id],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [projects.department_id],
    references: [departments.id],
  }),
  members: many(project_members),
  handovers: many(handovers),
  documents: many(documents),
  tasks: many(tasks),
}));

export const handoversRelations = relations(handovers, ({ one, many }) => ({
  project: one(projects, {
    fields: [handovers.project_id],
    references: [projects.id],
  }),
  from_user: one(users, {
    fields: [handovers.from_user_id],
    references: [users.id],
  }),
  to_user: one(users, {
    fields: [handovers.to_user_id],
    references: [users.id],
  }),
  approved_by_user: one(users, {
    fields: [handovers.approved_by],
    references: [users.id],
  }),
  checklist_items: many(handover_checklist_items),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.project_id],
    references: [projects.id],
  }),
  handover: one(handovers, {
    fields: [documents.handover_id],
    references: [handovers.id],
  }),
  created_by_user: one(users, {
    fields: [documents.created_by],
    references: [users.id],
  }),
  versions: many(document_versions),
}));
```

---

## 8. Indexes

```sql
-- Projects
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_department ON projects(department_id);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_health ON projects(health_status);
CREATE INDEX idx_projects_code ON projects(code);

-- Handovers
CREATE INDEX idx_handovers_project ON handovers(project_id);
CREATE INDEX idx_handovers_from_user ON handovers(from_user_id);
CREATE INDEX idx_handovers_to_user ON handovers(to_user_id);
CREATE INDEX idx_handovers_status ON handovers(status);

-- Documents
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_handover ON documents(handover_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_by ON documents(created_by);

-- Document Versions
CREATE INDEX idx_document_versions_document ON document_versions(document_id);

-- Project Members
CREATE UNIQUE INDEX idx_project_members_unique ON project_members(project_id, user_id) WHERE is_active = true;
```

---

## 9. Zod Validation Schemas

```typescript
import { z } from 'zod';

// Project schemas
export const ProjectStage = z.enum([
  'initiation', 'planning', 'in_progress', 'review', 'testing',
  'staging', 'deployment', 'monitoring', 'handover', 'completed'
]);

export const ProjectPriority = z.enum(['critical', 'high', 'medium', 'low']);
export const HealthStatus = z.enum(['on_track', 'at_risk', 'delayed', 'blocked']);

export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(200),
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

export const UpdateProjectSchema = CreateProjectSchema.partial();

// Handover schemas
export const HandoverType = z.enum([
  'project_transfer', 'stage_transition', 'team_change',
  'department_transfer', 'role_change'
]);

export const HandoverStatus = z.enum([
  'draft', 'pending_review', 'in_review', 'approved',
  'rejected', 'completed', 'cancelled'
]);

export const CreateHandoverSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: HandoverType,
  to_user_id: z.string().uuid(),
  to_department_id: z.string().uuid().optional(),
  from_stage: ProjectStage.optional(),
  to_stage: ProjectStage.optional(),
  due_date: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
});

// Document schemas
export const DocumentType = z.enum([
  'requirement', 'design', 'technical', 'test_plan',
  'user_guide', 'handover', 'report', 'meeting_notes', 'other'
]);

export const DocumentStatus = z.enum(['draft', 'review', 'approved', 'archived', 'obsolete']);

export const CreateDocumentSchema = z.object({
  project_id: z.string().uuid().optional(),
  handover_id: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  type: DocumentType,
  content: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
```

---

*Source: PRD v1.0 §6, §7, §16.1, §11.5*
