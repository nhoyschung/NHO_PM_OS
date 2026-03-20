import { eq, and, or, ilike, gte, lte, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  handovers,
  handoverChecklistItems,
  documents,
  projects,
} from '@/db/schema';
import { users } from '@/db/schema';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

import type {
  HandoverListItem,
  HandoverDetail,
  HandoverFilters,
  PaginatedResult,
} from './types';
import { HandoverFilterSchema } from './types';
import { DEFAULT_PER_PAGE } from './constants';

// ── Column sort map ─────────────────────────────────────────────

const SORT_COLUMN_MAP = {
  title: handovers.title,
  type: handovers.type,
  status: handovers.status,
  created_at: handovers.createdAt,
  updated_at: handovers.updatedAt,
  due_date: handovers.dueDate,
} as const;

// ── Alias tables for from/to user joins ─────────────────────────

import { alias } from 'drizzle-orm/pg-core';

const fromUsers = alias(users, 'from_users');
const toUsers = alias(users, 'to_users');

// ── getHandovers ────────────────────────────────────────────────
// Paginated handover list with filtering, search, and sorting.

export async function getHandovers(
  rawFilters: Partial<HandoverFilters>,
): Promise<PaginatedResult<HandoverListItem>> {
  const filters = HandoverFilterSchema.parse(rawFilters);

  // Build dynamic where conditions
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(handovers.title, `%${escapeLikePattern(filters.search)}%`),
        ilike(handovers.description, `%${escapeLikePattern(filters.search)}%`),
      ),
    );
  }
  if (filters.status) {
    conditions.push(eq(handovers.status, filters.status));
  }
  if (filters.type) {
    conditions.push(eq(handovers.type, filters.type));
  }
  if (filters.projectId) {
    conditions.push(eq(handovers.projectId, filters.projectId));
  }
  if (filters.fromUserId) {
    conditions.push(eq(handovers.fromUserId, filters.fromUserId));
  }
  if (filters.toUserId) {
    conditions.push(eq(handovers.toUserId, filters.toUserId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(handovers.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(handovers.createdAt, new Date(filters.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: handovers.id,
        title: handovers.title,
        type: handovers.type,
        status: handovers.status,
        projectId: handovers.projectId,
        fromUserId: handovers.fromUserId,
        toUserId: handovers.toUserId,
        dueDate: handovers.dueDate,
        initiatedAt: handovers.initiatedAt,
        completedAt: handovers.completedAt,
        createdAt: handovers.createdAt,
        updatedAt: handovers.updatedAt,
        projectName: projects.name,
        fromUserName: fromUsers.fullName,
        toUserName: toUsers.fullName,
      })
      .from(handovers)
      .leftJoin(projects, eq(handovers.projectId, projects.id))
      .leftJoin(fromUsers, eq(handovers.fromUserId, fromUsers.id))
      .leftJoin(toUsers, eq(handovers.toUserId, toUsers.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(handovers)
      .where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  // Enrich with checklist item counts per handover
  const handoverIds = rows.map((r) => r.id);
  let checklistCounts: Record<string, { total: number; completed: number }> = {};

  if (handoverIds.length > 0) {
    const checklistCountRows = await db
      .select({
        handoverId: handoverChecklistItems.handoverId,
        total: count(),
        completed: sql<number>`SUM(CASE WHEN ${handoverChecklistItems.isCompleted} = true THEN 1 ELSE 0 END)`,
      })
      .from(handoverChecklistItems)
      .where(inArray(handoverChecklistItems.handoverId, handoverIds))
      .groupBy(handoverChecklistItems.handoverId);

    checklistCounts = Object.fromEntries(
      checklistCountRows.map((r) => [
        r.handoverId,
        { total: r.total, completed: Number(r.completed) },
      ]),
    );
  }

  const data: HandoverListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type as HandoverListItem['type'],
    status: row.status as HandoverListItem['status'],
    projectId: row.projectId,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    dueDate: row.dueDate,
    initiatedAt: row.initiatedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName,
    fromUserName: row.fromUserName,
    toUserName: row.toUserName,
    checklistItemCount: checklistCounts[row.id]?.total ?? 0,
    checklistCompletedCount: checklistCounts[row.id]?.completed ?? 0,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getHandoverById ─────────────────────────────────────────────
// Single handover with full relations.

export async function getHandoverById(id: string): Promise<HandoverDetail | null> {
  const result = await db.query.handovers.findFirst({
    where: eq(handovers.id, id),
    with: {
      project: {
        columns: { id: true, name: true, code: true, slug: true },
      },
      fromUser: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      toUser: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      approvedByUser: {
        columns: { id: true, fullName: true, email: true },
      },
      fromDepartment: {
        columns: { id: true, name: true, code: true },
      },
      toDepartment: {
        columns: { id: true, name: true, code: true },
      },
      checklistItems: {
        with: {
          completedByUser: {
            columns: { id: true, fullName: true, email: true },
          },
        },
        orderBy: (items, { asc: ascFn }) => [ascFn(items.sortOrder)],
      },
      documents: {
        columns: { id: true, title: true, type: true, status: true, createdAt: true },
      },
    },
  });

  if (!result) {
    return null;
  }

  // Compute counts
  const checklistCompleted = result.checklistItems.filter((item) => item.isCompleted).length;

  return {
    ...result,
    _count: {
      checklistItems: result.checklistItems.length,
      checklistCompleted,
      documents: result.documents.length,
    },
  } as HandoverDetail;
}

// ── getHandoversByProject ───────────────────────────────────────
// All handovers for a given project.

export async function getHandoversByProject(
  projectId: string,
): Promise<PaginatedResult<HandoverListItem>> {
  return getHandovers({ projectId });
}
