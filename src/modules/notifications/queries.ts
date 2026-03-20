import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema/operations';
import type {
  NotificationListItem,
  NotificationFilters,
  PaginatedResult,
  UnreadCount,
} from './types';
import { NotificationFilterSchema } from './types';
import { DEFAULT_PER_PAGE } from './constants';

// ── Column sort map ──────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  created_at: notifications.createdAt,
  type: notifications.type,
  priority: notifications.priority,
} as const;

// ── getNotifications ─────────────────────────────────────────────
// Paginated notification list for a given user, with filtering and sorting.

export async function getNotifications(
  userId: string,
  rawFilters: Partial<NotificationFilters>,
): Promise<PaginatedResult<NotificationListItem>> {
  const filters = NotificationFilterSchema.parse(rawFilters);

  // Build dynamic where conditions — always scoped to userId
  const conditions = [eq(notifications.userId, userId)];

  if (filters.type) {
    conditions.push(eq(notifications.type, filters.type));
  }
  if (filters.priority) {
    conditions.push(eq(notifications.priority, filters.priority));
  }
  if (filters.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }
  if (filters.dateFrom) {
    conditions.push(gte(notifications.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(notifications.createdAt, new Date(filters.dateTo)));
  }

  const where = and(...conditions);

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        priority: notifications.priority,
        projectId: notifications.projectId,
        taskId: notifications.taskId,
        handoverId: notifications.handoverId,
        documentId: notifications.documentId,
        actorId: notifications.actorId,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        actionUrl: notifications.actionUrl,
        createdAt: notifications.createdAt,
        expiresAt: notifications.expiresAt,
      })
      .from(notifications)
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(notifications).where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  const data: NotificationListItem[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type as NotificationListItem['type'],
    priority: row.priority as NotificationListItem['priority'],
    projectId: row.projectId,
    taskId: row.taskId,
    handoverId: row.handoverId,
    documentId: row.documentId,
    actorId: row.actorId,
    isRead: row.isRead,
    readAt: row.readAt,
    actionUrl: row.actionUrl,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getUnreadCount ────────────────────────────────────────────────
// Returns total unread + breakdown by urgent/high for the bell badge.

export async function getUnreadCount(userId: string): Promise<UnreadCount> {
  const [totalResult, urgentResult, highResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.priority, 'urgent'),
        ),
      ),
    db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.priority, 'high'),
        ),
      ),
  ]);

  return {
    total: totalResult[0]?.value ?? 0,
    urgent: urgentResult[0]?.value ?? 0,
    high: highResult[0]?.value ?? 0,
  };
}

// ── getNotificationById ───────────────────────────────────────────
// Single notification by ID.

export async function getNotificationById(id: string): Promise<NotificationListItem | null> {
  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      priority: notifications.priority,
      projectId: notifications.projectId,
      taskId: notifications.taskId,
      handoverId: notifications.handoverId,
      documentId: notifications.documentId,
      actorId: notifications.actorId,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      actionUrl: notifications.actionUrl,
      createdAt: notifications.createdAt,
      expiresAt: notifications.expiresAt,
    })
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type as NotificationListItem['type'],
    priority: row.priority as NotificationListItem['priority'],
    projectId: row.projectId,
    taskId: row.taskId,
    handoverId: row.handoverId,
    documentId: row.documentId,
    actorId: row.actorId,
    isRead: row.isRead,
    readAt: row.readAt,
    actionUrl: row.actionUrl,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export { DEFAULT_PER_PAGE };
