import { z } from 'zod';
import { UUID_REGEX } from '@/lib/utils';
import { AuditAction, AuditEntityType, AuditSeverity, AuditLogFilterSchema } from './types';
import { VALIDATION } from './constants';

// ── createAuditLogSchema ──────────────────────────────────────────
// Internal schema for creating audit log records.
// This is an APPEND-ONLY operation — no update or delete schemas exist.

export const createAuditLogSchema = z.object({
  userId: z.string().regex(UUID_REGEX).optional(),
  userEmail: z.string().email('Email không hợp lệ.').optional(),
  userRole: z.string().optional(),
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: z.string().regex(UUID_REGEX).optional(),
  entityName: z.string().optional(),
  projectId: z.string().regex(UUID_REGEX).optional(),
  oldValues: z.record(z.string(), z.unknown()).optional(),
  newValues: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(VALIDATION.DESCRIPTION_MAX).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  severity: AuditSeverity.default('info'),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

// ── auditLogFiltersSchema ─────────────────────────────────────────
// Re-export from types for co-location convenience

export { AuditLogFilterSchema as auditLogFiltersSchema };
export type { AuditLogFilters } from './types';
