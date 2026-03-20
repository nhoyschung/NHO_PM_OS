# Reference: Operations Schema

> **SOT** for operational tables: tasks, notifications, audit_logs, financial_records, compliance_records. Extracted from PRD §6.

---

## Overview

Operations tables support day-to-day project management activities. These tables track work items (tasks), system events (notifications, audit logs), financial tracking, and compliance records.

---

## 1. Tasks Table

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  project_id: uuid('project_id').references(() => projects.id).notNull(),

  // Task info
  title: text('title').notNull(),
  description: text('description'),
  code: text('code').notNull(),             // Auto-generated: TSK-001

  // Classification
  type: text('type', {
    enum: ['feature', 'bug', 'improvement', 'documentation', 'testing', 'deployment', 'research', 'other']
  }).default('feature').notNull(),
  priority: text('priority', {
    enum: ['critical', 'high', 'medium', 'low']
  }).default('medium').notNull(),

  // Status
  status: text('status', {
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled']
  }).default('backlog').notNull(),

  // Assignment
  assignee_id: uuid('assignee_id').references(() => users.id),
  reporter_id: uuid('reporter_id').references(() => users.id).notNull(),

  // Stage association
  project_stage: text('project_stage'),       // Which project stage this task belongs to

  // Timeline
  start_date: date('start_date'),
  due_date: date('due_date'),
  completed_at: timestamp('completed_at', { withTimezone: true }),

  // Effort
  estimated_hours: integer('estimated_hours'),
  actual_hours: integer('actual_hours'),

  // Dependencies
  parent_task_id: uuid('parent_task_id').references(() => tasks.id),
  depends_on: jsonb('depends_on').default([]),   // Array of task IDs

  // Acceptance criteria
  acceptance_criteria: jsonb('acceptance_criteria').default([]),

  // Metadata
  tags: jsonb('tags').default([]),
  sort_order: integer('sort_order').default(0).notNull(),
  metadata: jsonb('metadata').default({}),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
```

### Tasks — RLS Policies

```sql
-- Project members can read project tasks
CREATE POLICY "tasks_read_project_members"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id AND user_id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND (owner_id = auth.uid() OR team_lead_id = auth.uid())
    )
  );

-- Assignees and project leads can update tasks
CREATE POLICY "tasks_update_assigned"
  ON tasks FOR UPDATE
  USING (
    assignee_id = auth.uid()
    OR reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND (owner_id = auth.uid() OR team_lead_id = auth.uid())
    )
  );

-- Project members can create tasks
CREATE POLICY "tasks_insert_members"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id AND user_id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND (owner_id = auth.uid() OR team_lead_id = auth.uid())
    )
  );
```

---

## 2. Task Comments Table

```typescript
export const task_comments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),

  task_id: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  author_id: uuid('author_id').references(() => users.id).notNull(),

  content: text('content').notNull(),
  is_internal: boolean('is_internal').default(false).notNull(), // Internal comments not visible to all

  // Thread support
  parent_comment_id: uuid('parent_comment_id').references(() => task_comments.id),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
```

---

## 3. Notifications Table

```typescript
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Recipient
  user_id: uuid('user_id').references(() => users.id).notNull(),

  // Notification content
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', {
    enum: [
      'task_assigned',
      'task_status_changed',
      'task_comment',
      'handover_initiated',
      'handover_approved',
      'handover_rejected',
      'project_stage_changed',
      'document_shared',
      'document_approved',
      'mention',
      'deadline_approaching',
      'deadline_overdue',
      'system_alert',
      'report_generated'
    ]
  }).notNull(),

  // Priority
  priority: text('priority', {
    enum: ['urgent', 'high', 'normal', 'low']
  }).default('normal').notNull(),

  // Context references
  project_id: uuid('project_id').references(() => projects.id),
  task_id: uuid('task_id').references(() => tasks.id),
  handover_id: uuid('handover_id').references(() => handovers.id),
  document_id: uuid('document_id').references(() => documents.id),

  // Actor (who triggered the notification)
  actor_id: uuid('actor_id').references(() => users.id),

  // Read status
  is_read: boolean('is_read').default(false).notNull(),
  read_at: timestamp('read_at', { withTimezone: true }),

  // Action URL
  action_url: text('action_url'),

  // Delivery
  email_sent: boolean('email_sent').default(false).notNull(),
  email_sent_at: timestamp('email_sent_at', { withTimezone: true }),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }),
});
```

### Notifications — RLS Policies

```sql
-- Users can only read their own notifications
CREATE POLICY "notifications_read_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System inserts notifications (via service role)
-- No user-facing INSERT policy needed
```

---

## 4. Audit Logs Table

```typescript
export const audit_logs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actor
  user_id: uuid('user_id').references(() => users.id),  // Nullable for system actions
  user_email: text('user_email'),                        // Snapshot at time of action
  user_role: text('user_role'),                          // Snapshot at time of action

  // Action
  action: text('action', {
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout', 'login_failed',
      'export', 'import',
      'approve', 'reject',
      'assign', 'unassign',
      'stage_change', 'status_change',
      'handover_initiate', 'handover_complete',
      'permission_grant', 'permission_revoke',
      'settings_change', 'billing_change'
    ]
  }).notNull(),

  // Target
  entity_type: text('entity_type', {
    enum: ['project', 'task', 'handover', 'document', 'user', 'role', 'department', 'settings', 'billing', 'notification']
  }).notNull(),
  entity_id: uuid('entity_id'),
  entity_name: text('entity_name'),        // Snapshot of entity name at action time

  // Context
  project_id: uuid('project_id').references(() => projects.id),

  // Change details
  old_values: jsonb('old_values'),          // Before state
  new_values: jsonb('new_values'),          // After state
  description: text('description'),         // Human-readable description

  // Request context
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  request_id: text('request_id'),          // Correlation ID

  // Severity
  severity: text('severity', {
    enum: ['info', 'warning', 'critical']
  }).default('info').notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Audit Logs — Design Decisions

- **Immutable**: No UPDATE or DELETE policies. Audit logs are append-only.
- **Snapshots**: `user_email`, `user_role`, `entity_name` are snapshots — not FK lookups — because the referenced data may change after the log is written.
- **No cascading deletes**: Audit logs persist even if the referenced entity is deleted.

### Audit Logs — RLS Policies

```sql
-- Admins and managers can read audit logs
CREATE POLICY "audit_logs_read_admin"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'manager')
    )
  );

-- Users can read their own audit logs
CREATE POLICY "audit_logs_read_own"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- No UPDATE or DELETE policies (immutable)
```

---

## 5. Financial Records Table

```typescript
export const financial_records = pgTable('financial_records', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  project_id: uuid('project_id').references(() => projects.id).notNull(),

  // Record info
  type: text('type', {
    enum: ['budget_allocation', 'expense', 'invoice', 'payment', 'refund', 'adjustment']
  }).notNull(),
  category: text('category', {
    enum: ['labor', 'software', 'hardware', 'infrastructure', 'consulting', 'training', 'travel', 'other']
  }).default('other').notNull(),

  // Amount
  amount: integer('amount').notNull(),            // In smallest currency unit (cents)
  currency: text('currency').default('USD').notNull(),

  // Description
  description: text('description').notNull(),
  reference_number: text('reference_number'),      // Invoice/PO number

  // Dates
  transaction_date: date('transaction_date').notNull(),

  // Approval
  approved_by: uuid('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at', { withTimezone: true }),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'processed']
  }).default('pending').notNull(),

  // Metadata
  attachments: jsonb('attachments').default([]),   // File references
  metadata: jsonb('metadata').default({}),

  // Ownership
  created_by: uuid('created_by').references(() => users.id).notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Financial Records — RLS Policies

```sql
-- Project owners and managers can read financial records
CREATE POLICY "financial_records_read"
  ON financial_records FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = financial_records.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'manager')
    )
  );

-- Only admins and project owners can create/update financial records
CREATE POLICY "financial_records_modify"
  ON financial_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = financial_records.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'manager')
    )
  );
```

---

## 6. Compliance Records Table

```typescript
export const compliance_records = pgTable('compliance_records', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  project_id: uuid('project_id').references(() => projects.id).notNull(),

  // Compliance info
  framework: text('framework', {
    enum: ['iso_27001', 'soc2', 'gdpr', 'hipaa', 'pci_dss', 'nist', 'custom']
  }).notNull(),
  control_id: text('control_id').notNull(),       // Framework control identifier
  control_name: text('control_name').notNull(),

  // Status
  status: text('status', {
    enum: ['not_started', 'in_progress', 'implemented', 'verified', 'non_compliant', 'not_applicable']
  }).default('not_started').notNull(),

  // Evidence
  description: text('description'),
  evidence_description: text('evidence_description'),
  evidence_url: text('evidence_url'),

  // Assessment
  assessed_by: uuid('assessed_by').references(() => users.id),
  assessed_at: timestamp('assessed_at', { withTimezone: true }),
  next_review_date: date('next_review_date'),

  // Risk
  risk_level: text('risk_level', {
    enum: ['critical', 'high', 'medium', 'low', 'none']
  }),
  remediation_plan: text('remediation_plan'),
  remediation_deadline: date('remediation_deadline'),

  // Metadata
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),

  // Ownership
  responsible_id: uuid('responsible_id').references(() => users.id),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 7. Relations

```typescript
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignee_id],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [tasks.reporter_id],
    references: [users.id],
  }),
  parent_task: one(tasks, {
    fields: [tasks.parent_task_id],
    references: [tasks.id],
  }),
  subtasks: many(tasks),
  comments: many(task_comments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actor_id],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.project_id],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [notifications.task_id],
    references: [tasks.id],
  }),
}));

export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  user: one(users, {
    fields: [audit_logs.user_id],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [audit_logs.project_id],
    references: [projects.id],
  }),
}));
```

---

## 8. Indexes

```sql
-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity != 'info';

-- Financial Records
CREATE INDEX idx_financial_records_project ON financial_records(project_id);
CREATE INDEX idx_financial_records_type ON financial_records(type);
CREATE INDEX idx_financial_records_status ON financial_records(status);
CREATE INDEX idx_financial_records_date ON financial_records(transaction_date);

-- Compliance Records
CREATE INDEX idx_compliance_records_project ON compliance_records(project_id);
CREATE INDEX idx_compliance_records_framework ON compliance_records(framework);
CREATE INDEX idx_compliance_records_status ON compliance_records(status);
CREATE INDEX idx_compliance_records_risk ON compliance_records(risk_level);
```

---

*Source: PRD v1.0 §6 (F3), §11.5, §16.1*
