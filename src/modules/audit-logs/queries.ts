import { eq, and, or, ilike, gte, lte, desc, asc, count } from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { users } from '@/db/schema';
import type {
  AuditLogListItem,
  AuditLogFilters,
  PaginatedResult,
} from './types';
import { AuditLogFilterSchema } from './types';
import { DEFAULT_PER_PAGE } from './constants';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

// ── Column sort map ──────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  created_at: auditLogs.createdAt,
  action: auditLogs.action,
  entity_type: auditLogs.entityType,
  severity: auditLogs.severity,
} as const;

// ── getAuditLogs ─────────────────────────────────────────────────
// Paginated audit log list with filtering, search, and sorting.
// THIS IS THE PRIMARY OUTPUT of this module.

export async function getAuditLogs(
  rawFilters: Partial<AuditLogFilters>,
): Promise<PaginatedResult<AuditLogListItem>> {
  const filters = AuditLogFilterSchema.parse(rawFilters);

  // Build dynamic where conditions
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(auditLogs.entityName, `%${escapeLikePattern(filters.search)}%`),
        ilike(auditLogs.userEmail, `%${escapeLikePattern(filters.search)}%`),
        ilike(auditLogs.description, `%${escapeLikePattern(filters.search)}%`),
      ),
    );
  }
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters.severity) {
    conditions.push(eq(auditLogs.severity, filters.severity));
  }
  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters.projectId) {
    conditions.push(eq(auditLogs.projectId, filters.projectId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(auditLogs.createdAt, new Date(filters.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userEmail: auditLogs.userEmail,
        userRole: auditLogs.userRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityName: auditLogs.entityName,
        projectId: auditLogs.projectId,
        description: auditLogs.description,
        severity: auditLogs.severity,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(auditLogs)
      .where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  const data: AuditLogListItem[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userRole: row.userRole,
    action: row.action as AuditLogListItem['action'],
    entityType: row.entityType as AuditLogListItem['entityType'],
    entityId: row.entityId,
    entityName: row.entityName,
    projectId: row.projectId,
    description: row.description,
    severity: row.severity as AuditLogListItem['severity'],
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getAuditLogsByEntity ─────────────────────────────────────────
// All audit logs for a specific entity (entity detail tabs timeline).

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
  limit = DEFAULT_PER_PAGE,
): Promise<AuditLogListItem[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      projectId: auditLogs.projectId,
      description: auditLogs.description,
      severity: auditLogs.severity,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, entityType as AuditLogListItem['entityType']),
        eq(auditLogs.entityId, entityId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userRole: row.userRole,
    action: row.action as AuditLogListItem['action'],
    entityType: row.entityType as AuditLogListItem['entityType'],
    entityId: row.entityId,
    entityName: row.entityName,
    projectId: row.projectId,
    description: row.description,
    severity: row.severity as AuditLogListItem['severity'],
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  }));
}

// ── getAuditLogsByUser ───────────────────────────────────────────
// All audit logs for a specific user.

export async function getAuditLogsByUser(
  userId: string,
  rawFilters: Partial<AuditLogFilters> = {},
): Promise<PaginatedResult<AuditLogListItem>> {
  return getAuditLogs({ ...rawFilters, userId });
}

// ── getRecentActivity ────────────────────────────────────────────
// Most recent audit log entries across the system (dashboard widget).

export async function getRecentActivity(limit = 10): Promise<AuditLogListItem[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      projectId: auditLogs.projectId,
      description: auditLogs.description,
      severity: auditLogs.severity,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userRole: row.userRole,
    action: row.action as AuditLogListItem['action'],
    entityType: row.entityType as AuditLogListItem['entityType'],
    entityId: row.entityId,
    entityName: row.entityName,
    projectId: row.projectId,
    description: row.description,
    severity: row.severity as AuditLogListItem['severity'],
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  }));
}

// ── getAuditLogStats ─────────────────────────────────────────────
// Aggregate statistics for dashboard reporting.

export interface AuditLogStats {
  totalEntries: number;
  countByAction: Record<string, number>;
  countByEntityType: Record<string, number>;
  countBySeverity: Record<string, number>;
}

export async function getAuditLogStats(): Promise<AuditLogStats> {
  const [totalResult, actionRows, entityTypeRows, severityRows] = await Promise.all([
    db.select({ value: count() }).from(auditLogs),
    db
      .select({ action: auditLogs.action, count: count() })
      .from(auditLogs)
      .groupBy(auditLogs.action),
    db
      .select({ entityType: auditLogs.entityType, count: count() })
      .from(auditLogs)
      .groupBy(auditLogs.entityType),
    db
      .select({ severity: auditLogs.severity, count: count() })
      .from(auditLogs)
      .groupBy(auditLogs.severity),
  ]);

  const countByAction: Record<string, number> = {};
  for (const row of actionRows) {
    countByAction[row.action] = row.count;
  }

  const countByEntityType: Record<string, number> = {};
  for (const row of entityTypeRows) {
    countByEntityType[row.entityType] = row.count;
  }

  const countBySeverity: Record<string, number> = {};
  for (const row of severityRows) {
    countBySeverity[row.severity] = row.count;
  }

  return {
    totalEntries: totalResult[0]?.value ?? 0,
    countByAction,
    countByEntityType,
    countBySeverity,
  };
}
