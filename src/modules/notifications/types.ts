import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { notifications } from '@/db/schema/operations';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────
// Source: ref-ux-vietnam.md Section 12 — Notification Types

export const NotificationType = z.enum([
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
  'report_generated',
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const NotificationPriority = z.enum(['urgent', 'high', 'normal', 'low']);
export type NotificationPriority = z.infer<typeof NotificationPriority>;

// ── DB Row Type (inferred from Drizzle schema) ───────────────────

export type NotificationRow = InferSelectModel<typeof notifications>;

// ── Notification List Item (subset for list views) ───────────────
// Lightweight type used in NotificationList, NotificationBell components

export interface NotificationListItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  // Context references
  projectId: string | null;
  taskId: string | null;
  handoverId: string | null;
  documentId: string | null;
  actorId: string | null;
  // Read state
  isRead: boolean;
  readAt: Date | null;
  // Action
  actionUrl: string | null;
  // Timestamps
  createdAt: Date;
  expiresAt: Date | null;
}

// ── Unread Count ─────────────────────────────────────────────────

export interface UnreadCount {
  total: number;
  urgent: number;
  high: number;
}

// ── Notification Filters ─────────────────────────────────────────

export const NotificationSortableColumns = z.enum([
  'created_at',
  'type',
  'priority',
]);
export type NotificationSortableColumn = z.infer<typeof NotificationSortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const NotificationFilterSchema = z.object({
  type: NotificationType.optional(),
  priority: NotificationPriority.optional(),
  isRead: z.boolean().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: NotificationSortableColumns.default('created_at'),
  sortOrder: SortOrder.default('desc'),
});
export type NotificationFilters = z.infer<typeof NotificationFilterSchema>;

// ── Paginated Result ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
