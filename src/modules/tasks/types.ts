import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import { UUID_REGEX } from '@/lib/utils';
import type { tasks, taskComments } from '@/db/schema/operations';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────
// Source: ref-ux-vietnam.md Section 5, 6 — Task Status, Task Type

export const TaskStatus = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'testing',
  'done',
  'cancelled',
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskType = z.enum([
  'feature',
  'bug',
  'improvement',
  'documentation',
  'testing',
  'deployment',
  'research',
  'other',
]);
export type TaskType = z.infer<typeof TaskType>;

export const TaskPriority = z.enum(['critical', 'high', 'medium', 'low']);
export type TaskPriority = z.infer<typeof TaskPriority>;

// ── DB Row Types (inferred from Drizzle schema) ──────────────────

export type TaskRow = InferSelectModel<typeof tasks>;
export type TaskCommentRow = InferSelectModel<typeof taskComments>;

// ── Task List Item (subset for list views) ───────────────────────
// Lightweight type used in TaskList, KanbanColumn components

export interface TaskListItem {
  id: string;
  title: string;
  code: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  projectStage: string | null;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  projectName: string | null;
  projectCode: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  reporterName: string | null;
}

// ── Task Detail (full entity with relations) ──────────────────────
// Used in TaskDetail view

export interface TaskDetail extends TaskRow {
  project: { id: string; name: string; code: string; slug: string; stage: string } | null;
  assignee: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  reporter: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  parentTask: { id: string; title: string; code: string } | null;
  subtasks: Array<{ id: string; title: string; code: string; status: TaskStatus }>;
  comments: TaskCommentRow[];
  _count: {
    subtasks: number;
    comments: number;
  };
}

// ── Kanban Column ────────────────────────────────────────────────
// Represents one column in the Kanban board

export interface KanbanColumn {
  status: TaskStatus;
  label: string;
  tasks: TaskListItem[];
  count: number;
}

// ── Task Form Data ───────────────────────────────────────────────

export const TaskFormSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(300),
  description: z.string().max(5000).optional(),
  projectId: z.string().regex(UUID_REGEX, 'ID dự án không hợp lệ'),
  type: TaskType.default('feature'),
  priority: TaskPriority.default('medium'),
  status: TaskStatus.default('backlog'),
  assigneeId: z.string().regex(UUID_REGEX).optional(),
  projectStage: z.string().optional(),
  startDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  estimatedHours: z.number().int().min(0).optional(),
  parentTaskId: z.string().regex(UUID_REGEX).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});
export type TaskFormData = z.infer<typeof TaskFormSchema>;

export const TaskUpdateSchema = TaskFormSchema.partial();
export type TaskUpdateData = z.infer<typeof TaskUpdateSchema>;

// ── Task Filters ─────────────────────────────────────────────────

export const TaskSortableColumns = z.enum([
  'title',
  'code',
  'created_at',
  'updated_at',
  'priority',
  'status',
  'due_date',
  'sort_order',
]);
export type TaskSortableColumn = z.infer<typeof TaskSortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const TaskFilterSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().regex(UUID_REGEX).optional(),
  status: TaskStatus.optional(),
  type: TaskType.optional(),
  priority: TaskPriority.optional(),
  assigneeId: z.string().regex(UUID_REGEX).optional(),
  reporterId: z.string().regex(UUID_REGEX).optional(),
  isOverdue: z.boolean().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: TaskSortableColumns.default('updated_at'),
  sortOrder: SortOrder.default('desc'),
});
export type TaskFilters = z.infer<typeof TaskFilterSchema>;

// ── Task Status Transition Input ──────────────────────────────────

export const TransitionTaskStatusInputSchema = z.object({
  taskId: z.string().regex(UUID_REGEX),
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  notes: z.string().max(1000).optional(),
});
export type TransitionTaskStatusInput = z.infer<typeof TransitionTaskStatusInputSchema>;

// ── Paginated Result ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
