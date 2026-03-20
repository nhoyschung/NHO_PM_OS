import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { auditLogs } from '@/db/schema/operations';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────

export const AuditAction = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'login_failed',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'stage_change',
  'status_change',
  'handover_initiate',
  'handover_complete',
  'permission_grant',
  'permission_revoke',
  'settings_change',
  'billing_change',
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditEntityType = z.enum([
  'project',
  'task',
  'handover',
  'document',
  'user',
  'role',
  'department',
  'settings',
  'billing',
  'notification',
]);
export type AuditEntityType = z.infer<typeof AuditEntityType>;

export const AuditSeverity = z.enum(['info', 'warning', 'critical']);
export type AuditSeverity = z.infer<typeof AuditSeverity>;

// ── DB Row Type (inferred from Drizzle schema) ───────────────────

export type AuditLogRow = InferSelectModel<typeof auditLogs>;

// ── Audit Log List Item (subset for list views) ───────────────────

export interface AuditLogListItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  entityName: string | null;
  projectId: string | null;
  description: string | null;
  severity: AuditSeverity;
  ipAddress: string | null;
  createdAt: Date;
}

// ── Audit Log Detail (full entity) ────────────────────────────────

export interface AuditLogDetail extends AuditLogRow {
  // oldValues and newValues are already jsonb, exposed as unknown
}

// ── Filter Schema ─────────────────────────────────────────────────

export const AuditLogSortableColumns = z.enum([
  'created_at',
  'action',
  'entity_type',
  'severity',
]);
export type AuditLogSortableColumn = z.infer<typeof AuditLogSortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const AuditLogFilterSchema = z.object({
  search: z.string().optional(),
  action: AuditAction.optional(),
  entityType: AuditEntityType.optional(),
  severity: AuditSeverity.optional(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: AuditLogSortableColumns.default('created_at'),
  sortOrder: SortOrder.default('desc'),
});
export type AuditLogFilters = z.infer<typeof AuditLogFilterSchema>;

// ── Paginated Result ──────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
