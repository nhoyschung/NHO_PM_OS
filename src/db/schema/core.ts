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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  projectStageEnum,
  projectPriorityEnum,
  healthStatusEnum,
  projectMemberRoleEnum,
  handoverTypeEnum,
  handoverStatusEnum,
  checklistCategoryEnum,
  checklistPriorityEnum,
  documentTypeEnum,
  documentStatusEnum,
  transitionDirectionEnum,
} from './enums';

// ── 1. Projects (Dự án) ──────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Identity (Định danh)
    name: text('name').notNull(),
    code: text('code').notNull().unique(),       // Auto-generated: PRJ-001
    description: text('description'),
    slug: text('slug').notNull().unique(),

    // Classification (Phân loại)
    category: text('category'),
    priority: projectPriorityEnum('priority').default('medium').notNull(),

    // Location — Vietnamese administrative context (Địa phương)
    province: text('province'),                  // Tỉnh/Thành phố
    district: text('district'),                  // Quận/Huyện

    // State machine (Giai đoạn dự án — 10 stages)
    stage: projectStageEnum('stage').default('initiation').notNull(),

    // Ownership (Sở hữu)
    managerId: uuid('manager_id'),               // Project manager (Quản lý dự án)
    departmentId: uuid('department_id'),          // Phòng ban
    teamLeadId: uuid('team_lead_id'),             // Trưởng nhóm
    createdById: uuid('created_by_id'),           // Người tạo

    // Timeline (Tiến độ)
    startDate: date('start_date'),
    endDate: date('end_date'),                    // Target end date (Ngày kết thúc dự kiến)
    actualEndDate: date('actual_end_date'),

    // Budget (Ngân sách)
    budget: integer('budget'),                    // In smallest currency unit (cents/đồng)
    budgetSpent: integer('budget_spent').default(0),
    currency: text('currency').default('VND'),

    // Progress (Tiến độ)
    progressPercentage: integer('progress_percentage').default(0),
    healthStatus: healthStatusEnum('health_status').default('on_track'),

    // Metadata
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),
    isArchived: boolean('is_archived').default(false).notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_projects_manager').on(table.managerId),
    index('idx_projects_department').on(table.departmentId),
    index('idx_projects_stage').on(table.stage),
    index('idx_projects_priority').on(table.priority),
    index('idx_projects_health').on(table.healthStatus),
    index('idx_projects_code').on(table.code),
    index('idx_projects_created_by').on(table.createdById),
  ],
);

// ── 2. Project Members (Thành viên dự án) ─────────────────────────

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    projectId: uuid('project_id').notNull(),
    userId: uuid('user_id').notNull(),

    role: projectMemberRoleEnum('role').default('member').notNull(),

    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    removedAt: timestamp('removed_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    index('idx_project_members_project').on(table.projectId),
    index('idx_project_members_user').on(table.userId),
    uniqueIndex('idx_project_members_unique')
      .on(table.projectId, table.userId),
  ],
);

// ── 3. Handovers (Bàn giao) ──────────────────────────────────────

export const handovers = pgTable(
  'handovers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Context (Ngữ cảnh)
    projectId: uuid('project_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),

    // Handover type (Loại bàn giao)
    type: handoverTypeEnum('type').notNull(),

    // Parties (Các bên)
    fromUserId: uuid('from_user_id').notNull(),
    toUserId: uuid('to_user_id').notNull(),
    fromDepartmentId: uuid('from_department_id'),
    toDepartmentId: uuid('to_department_id'),

    // Status (Trạng thái)
    status: handoverStatusEnum('status').default('draft').notNull(),

    // Stage context (Giai đoạn — which project stage this handover relates to)
    fromStage: text('from_stage'),
    toStage: text('to_stage'),

    // Dates (Ngày tháng)
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
    reviewStartedAt: timestamp('review_started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),

    // Approval (Phê duyệt)
    approvedBy: uuid('approved_by'),
    rejectionReason: text('rejection_reason'),

    // Notes and metadata
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_handovers_project').on(table.projectId),
    index('idx_handovers_from_user').on(table.fromUserId),
    index('idx_handovers_to_user').on(table.toUserId),
    index('idx_handovers_status').on(table.status),
  ],
);

// ── 4. Handover Checklist Items (Mục kiểm tra bàn giao) ──────────

export const handoverChecklistItems = pgTable(
  'handover_checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    handoverId: uuid('handover_id').notNull(),

    // Item definition (Định nghĩa mục)
    title: text('title').notNull(),
    description: text('description'),
    category: checklistCategoryEnum('category').default('other').notNull(),

    // Status (Trạng thái)
    isCompleted: boolean('is_completed').default(false).notNull(),
    completedBy: uuid('completed_by'),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Priority and ordering (Ưu tiên và thứ tự)
    priority: checklistPriorityEnum('priority').default('required').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    // Verification (Xác minh)
    requiresEvidence: boolean('requires_evidence').default(false).notNull(),
    evidenceUrl: text('evidence_url'),
    evidenceNotes: text('evidence_notes'),

    // From template? (Từ mẫu?)
    templateId: text('template_id'),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_checklist_items_handover').on(table.handoverId),
  ],
);

// ── 5. Documents (Tài liệu) ──────────────────────────────────────

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Context (Ngữ cảnh)
    projectId: uuid('project_id'),
    handoverId: uuid('handover_id'),

    // Document info (Thông tin tài liệu)
    title: text('title').notNull(),
    description: text('description'),
    type: documentTypeEnum('type').default('other').notNull(),

    // Storage (Lưu trữ)
    filePath: text('file_path'),
    fileSize: integer('file_size'),           // In bytes
    mimeType: text('mime_type'),
    content: text('content'),                  // For text-based documents

    // Version control (Quản lý phiên bản)
    currentVersion: integer('current_version').default(1).notNull(),

    // Ownership (Sở hữu)
    createdBy: uuid('created_by').notNull(),

    // Status (Trạng thái)
    status: documentStatusEnum('status').default('draft').notNull(),

    // Metadata
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_documents_project').on(table.projectId),
    index('idx_documents_handover').on(table.handoverId),
    index('idx_documents_type').on(table.type),
    index('idx_documents_status').on(table.status),
    index('idx_documents_created_by').on(table.createdBy),
  ],
);

// ── 6. Document Versions (Phiên bản tài liệu) ───────────────────

export const documentVersions = pgTable(
  'document_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    documentId: uuid('document_id').notNull(),

    // Version (Phiên bản)
    versionNumber: integer('version_number').notNull(),
    changeSummary: text('change_summary'),

    // Content snapshot (Bản chụp nội dung)
    content: text('content'),
    filePath: text('file_path'),
    fileSize: integer('file_size'),

    // Author (Tác giả)
    createdBy: uuid('created_by').notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_document_versions_document').on(table.documentId),
  ],
);

// ── 7. Project Stage History (Lịch sử giai đoạn dự án) ───────────

export const projectStageHistory = pgTable(
  'project_stage_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    projectId: uuid('project_id').notNull(),

    // Transition (Chuyển đổi)
    fromStage: projectStageEnum('from_stage').notNull(),
    toStage: projectStageEnum('to_stage').notNull(),
    direction: transitionDirectionEnum('direction').notNull(),
    trigger: text('trigger').notNull(),        // What caused the transition

    // Actor (Người thực hiện)
    triggeredBy: uuid('triggered_by').notNull(),

    // Context (Ngữ cảnh)
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_stage_history_project').on(table.projectId),
    index('idx_stage_history_created').on(table.createdAt),
  ],
);
