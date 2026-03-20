import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
  index,
} from 'drizzle-orm/pg-core';
import {
  taskTypeEnum,
  taskStatusEnum,
  taskPriorityEnum,
  notificationTypeEnum,
  notificationPriorityEnum,
  auditActionEnum,
  auditEntityTypeEnum,
  auditSeverityEnum,
  financialTypeEnum,
  financialCategoryEnum,
  financialStatusEnum,
  complianceFrameworkEnum,
  complianceStatusEnum,
  riskLevelEnum,
  settingScopeEnum,
} from './enums';

// ── 1. Tasks (Công việc) ──────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Context (Ngữ cảnh)
    projectId: uuid('project_id').notNull(),

    // Task info (Thông tin công việc)
    title: text('title').notNull(),
    description: text('description'),
    code: text('code').notNull(),                 // Auto-generated: TSK-001

    // Classification (Phân loại)
    type: taskTypeEnum('type').default('feature').notNull(),
    priority: taskPriorityEnum('priority').default('medium').notNull(),

    // Status (Trạng thái)
    status: taskStatusEnum('status').default('backlog').notNull(),

    // Assignment (Phân công)
    assigneeId: uuid('assignee_id'),
    reporterId: uuid('reporter_id').notNull(),

    // Stage association (Liên kết giai đoạn)
    projectStage: text('project_stage'),

    // Timeline (Tiến độ)
    startDate: date('start_date'),
    dueDate: date('due_date'),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Effort (Nỗ lực)
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours'),

    // Dependencies (Phụ thuộc)
    parentTaskId: uuid('parent_task_id'),
    dependsOn: jsonb('depends_on').default([]),

    // Acceptance criteria (Tiêu chí nghiệm thu)
    acceptanceCriteria: jsonb('acceptance_criteria').default([]),

    // Metadata
    tags: jsonb('tags').default([]),
    sortOrder: integer('sort_order').default(0).notNull(),
    metadata: jsonb('metadata').default({}),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_tasks_project').on(table.projectId),
    index('idx_tasks_assignee').on(table.assigneeId),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_priority').on(table.priority),
    index('idx_tasks_due_date').on(table.dueDate),
    index('idx_tasks_parent').on(table.parentTaskId),
  ],
);

// ── 2. Task Comments (Bình luận công việc) ────────────────────────

export const taskComments = pgTable(
  'task_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    taskId: uuid('task_id').notNull(),
    authorId: uuid('author_id').notNull(),

    content: text('content').notNull(),
    isInternal: boolean('is_internal').default(false).notNull(),

    // Thread support (Hỗ trợ luồng)
    parentCommentId: uuid('parent_comment_id'),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_task_comments_task').on(table.taskId),
    index('idx_task_comments_author').on(table.authorId),
  ],
);

// ── 3. Notifications (Thông báo) ─────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Recipient (Người nhận)
    userId: uuid('user_id').notNull(),

    // Notification content (Nội dung thông báo)
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: notificationTypeEnum('type').notNull(),

    // Priority (Mức ưu tiên)
    priority: notificationPriorityEnum('priority').default('normal').notNull(),

    // Context references (Tham chiếu ngữ cảnh)
    projectId: uuid('project_id'),
    taskId: uuid('task_id'),
    handoverId: uuid('handover_id'),
    documentId: uuid('document_id'),

    // Actor (Người kích hoạt)
    actorId: uuid('actor_id'),

    // Read status (Trạng thái đọc)
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),

    // Action URL
    actionUrl: text('action_url'),

    // Delivery (Gửi email)
    emailSent: boolean('email_sent').default(false).notNull(),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),

    // Metadata
    metadata: jsonb('metadata').default({}),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_notifications_user').on(table.userId),
    index('idx_notifications_type').on(table.type),
    index('idx_notifications_created').on(table.createdAt),
  ],
);

// ── 4. Audit Logs (Nhật ký kiểm toán) ────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Actor (Người thực hiện)
    userId: uuid('user_id'),              // Nullable for system actions
    userEmail: text('user_email'),         // Snapshot at time of action
    userRole: text('user_role'),           // Snapshot at time of action

    // Action (Hành động)
    action: auditActionEnum('action').notNull(),

    // Target (Đối tượng)
    entityType: auditEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id'),
    entityName: text('entity_name'),       // Snapshot of entity name

    // Context (Ngữ cảnh)
    projectId: uuid('project_id'),

    // Change details (Chi tiết thay đổi)
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    description: text('description'),

    // Request context (Ngữ cảnh yêu cầu)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),        // Correlation ID

    // Severity (Mức độ nghiêm trọng)
    severity: auditSeverityEnum('severity').default('info').notNull(),

    // Timestamps (Dấu thời gian) — immutable, no updated_at
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_logs_user').on(table.userId),
    index('idx_audit_logs_entity').on(table.entityType, table.entityId),
    index('idx_audit_logs_project').on(table.projectId),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_created').on(table.createdAt),
    index('idx_audit_logs_severity').on(table.severity),
  ],
);

// ── 5. Financial Records (Bản ghi tài chính) ─────────────────────

export const financialRecords = pgTable(
  'financial_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Context (Ngữ cảnh)
    projectId: uuid('project_id').notNull(),

    // Record info (Thông tin bản ghi)
    type: financialTypeEnum('type').notNull(),
    category: financialCategoryEnum('category').default('other').notNull(),

    // Amount (Số tiền)
    amount: integer('amount').notNull(),
    currency: text('currency').default('VND').notNull(),

    // Description (Mô tả)
    description: text('description').notNull(),
    referenceNumber: text('reference_number'),

    // Dates (Ngày tháng)
    transactionDate: date('transaction_date').notNull(),

    // Approval (Phê duyệt)
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    status: financialStatusEnum('status').default('pending').notNull(),

    // Metadata
    attachments: jsonb('attachments').default([]),
    metadata: jsonb('metadata').default({}),

    // Ownership (Sở hữu)
    createdBy: uuid('created_by').notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_financial_records_project').on(table.projectId),
    index('idx_financial_records_type').on(table.type),
    index('idx_financial_records_status').on(table.status),
    index('idx_financial_records_date').on(table.transactionDate),
  ],
);

// ── 6. Compliance Records (Bản ghi tuân thủ) ─────────────────────

export const complianceRecords = pgTable(
  'compliance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Context (Ngữ cảnh)
    projectId: uuid('project_id').notNull(),

    // Compliance info (Thông tin tuân thủ)
    framework: complianceFrameworkEnum('framework').notNull(),
    controlId: text('control_id').notNull(),
    controlName: text('control_name').notNull(),

    // Status (Trạng thái)
    status: complianceStatusEnum('status').default('not_started').notNull(),

    // Evidence (Bằng chứng)
    description: text('description'),
    evidenceDescription: text('evidence_description'),
    evidenceUrl: text('evidence_url'),

    // Assessment (Đánh giá)
    assessedBy: uuid('assessed_by'),
    assessedAt: timestamp('assessed_at', { withTimezone: true }),
    nextReviewDate: date('next_review_date'),

    // Risk (Rủi ro)
    riskLevel: riskLevelEnum('risk_level'),
    remediationPlan: text('remediation_plan'),
    remediationDeadline: date('remediation_deadline'),

    // Metadata
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),

    // Ownership (Sở hữu)
    responsibleId: uuid('responsible_id'),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_compliance_records_project').on(table.projectId),
    index('idx_compliance_records_framework').on(table.framework),
    index('idx_compliance_records_status').on(table.status),
    index('idx_compliance_records_risk').on(table.riskLevel),
  ],
);

// ── 7. Settings (Cài đặt hệ thống) ──────────────────────────────

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Scope (Phạm vi)
    scope: settingScopeEnum('scope').notNull(),
    scopeId: uuid('scope_id'),               // user_id or org_id depending on scope

    // Setting definition (Định nghĩa)
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    description: text('description'),

    // Metadata
    isSecret: boolean('is_secret').default(false).notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_settings_scope').on(table.scope, table.scopeId),
    index('idx_settings_key').on(table.key),
  ],
);
