import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { handovers, handoverChecklistItems } from '@/db/schema/core';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────

export const HandoverStatus = z.enum([
  'draft',
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
]);
export type HandoverStatus = z.infer<typeof HandoverStatus>;

export const HandoverType = z.enum([
  'project_transfer',
  'stage_transition',
  'team_change',
  'department_transfer',
  'role_change',
]);
export type HandoverType = z.infer<typeof HandoverType>;

export const ChecklistCategory = z.enum([
  'documentation',
  'access_transfer',
  'knowledge_transfer',
  'tool_setup',
  'review',
  'signoff',
  'other',
]);
export type ChecklistCategory = z.infer<typeof ChecklistCategory>;

export const ChecklistPriority = z.enum([
  'required',
  'recommended',
  'optional',
]);
export type ChecklistPriority = z.infer<typeof ChecklistPriority>;

// ── DB Row Types (inferred from Drizzle schema) ──────────────────

export type HandoverRow = InferSelectModel<typeof handovers>;
export type ChecklistItemRow = InferSelectModel<typeof handoverChecklistItems>;

// ── Handover List Item (subset for list views) ───────────────────

export interface HandoverListItem {
  id: string;
  title: string;
  type: HandoverType;
  status: HandoverStatus;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  dueDate: Date | null;
  initiatedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  projectName: string | null;
  fromUserName: string | null;
  toUserName: string | null;
  checklistItemCount: number;
  checklistCompletedCount: number;
}

// ── Handover Detail (full entity with relations) ─────────────────

export interface HandoverDetail extends HandoverRow {
  project: { id: string; name: string; code: string; slug: string } | null;
  fromUser: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  toUser: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  approvedByUser: { id: string; fullName: string | null; email: string } | null;
  fromDepartment: { id: string; name: string; code: string } | null;
  toDepartment: { id: string; name: string; code: string } | null;
  checklistItems: Array<ChecklistItemRow & {
    completedByUser: { id: string; fullName: string | null; email: string } | null;
  }>;
  documents: Array<{ id: string; title: string; type: string; status: string; createdAt: Date }>;
  _count: {
    checklistItems: number;
    checklistCompleted: number;
    documents: number;
  };
}

// ── Handover Form Data ───────────────────────────────────────────

export const HandoverFormSchema = z.object({
  projectId: z.string().uuid('Dự án là bắt buộc'),
  title: z.string().min(3, 'Tiêu đề bàn giao phải có ít nhất 3 ký tự').max(200),
  description: z.string().max(2000).optional(),
  type: HandoverType,
  toUserId: z.string().uuid('Người nhận là bắt buộc'),
  fromDepartmentId: z.string().uuid().optional(),
  toDepartmentId: z.string().uuid().optional(),
  fromStage: z.string().optional(),
  toStage: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
});
export type HandoverFormData = z.infer<typeof HandoverFormSchema>;

export const HandoverUpdateSchema = HandoverFormSchema.partial();
export type HandoverUpdateData = z.infer<typeof HandoverUpdateSchema>;

// ── Checklist Item Form Data ─────────────────────────────────────

export const ChecklistItemFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề mục kiểm tra là bắt buộc').max(300),
  description: z.string().max(1000).optional(),
  category: ChecklistCategory.default('other'),
  priority: ChecklistPriority.default('required'),
  sortOrder: z.number().int().min(0).default(0),
  requiresEvidence: z.boolean().default(false),
});
export type ChecklistItemFormData = z.infer<typeof ChecklistItemFormSchema>;

// ── Handover Filters ─────────────────────────────────────────────

export const SortableColumns = z.enum([
  'title',
  'type',
  'status',
  'created_at',
  'updated_at',
  'due_date',
]);
export type SortableColumn = z.infer<typeof SortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const HandoverFilterSchema = z.object({
  search: z.string().optional(),
  status: HandoverStatus.optional(),
  type: HandoverType.optional(),
  projectId: z.string().uuid().optional(),
  fromUserId: z.string().uuid().optional(),
  toUserId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: SortableColumns.default('updated_at'),
  sortOrder: SortOrder.default('desc'),
});
export type HandoverFilters = z.infer<typeof HandoverFilterSchema>;

// ── Paginated Result ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
