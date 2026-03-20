import { eq, and, or, ilike, gte, lte, desc, asc, count, sql, isNotNull, lt } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema/operations';
import { users, projects } from '@/db/schema';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

import type {
  TaskListItem,
  TaskDetail,
  TaskFilters,
  PaginatedResult,
  TaskStatus,
  KanbanColumn,
} from './types';
import { TaskFilterSchema } from './types';
import { DEFAULT_PER_PAGE, KANBAN_COLUMNS, TASK_STATUS_LABELS } from './constants';

// ── Column sort map ───────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  title: tasks.title,
  code: tasks.code,
  created_at: tasks.createdAt,
  updated_at: tasks.updatedAt,
  priority: tasks.priority,
  status: tasks.status,
  due_date: tasks.dueDate,
  sort_order: tasks.sortOrder,
} as const;

// ── getTasks ─────────────────────────────────────────────────────
// Paginated task list with filtering, search, and sorting.

export async function getTasks(
  rawFilters: Partial<TaskFilters>,
): Promise<PaginatedResult<TaskListItem>> {
  const filters = TaskFilterSchema.parse(rawFilters);

  // Build dynamic where conditions
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(tasks.title, `%${escapeLikePattern(filters.search)}%`),
        ilike(tasks.code, `%${escapeLikePattern(filters.search)}%`),
      ),
    );
  }
  if (filters.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }
  if (filters.status) {
    conditions.push(eq(tasks.status, filters.status));
  }
  if (filters.type) {
    conditions.push(eq(tasks.type, filters.type));
  }
  if (filters.priority) {
    conditions.push(eq(tasks.priority, filters.priority));
  }
  if (filters.assigneeId) {
    conditions.push(eq(tasks.assigneeId, filters.assigneeId));
  }
  if (filters.reporterId) {
    conditions.push(eq(tasks.reporterId, filters.reporterId));
  }
  if (filters.isOverdue) {
    // Overdue = has a dueDate, dueDate < today, and not done/cancelled
    const today = new Date().toISOString().split('T')[0];
    conditions.push(
      and(
        isNotNull(tasks.dueDate),
        lt(tasks.dueDate, today),
        sql`${tasks.status} NOT IN ('done', 'cancelled')`,
      ),
    );
  }
  if (filters.dateFrom) {
    conditions.push(gte(tasks.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(tasks.createdAt, new Date(filters.dateTo)));
  }

  // Exclude soft-deleted tasks
  conditions.push(sql`${tasks.deletedAt} IS NULL`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        code: tasks.code,
        type: tasks.type,
        priority: tasks.priority,
        status: tasks.status,
        projectId: tasks.projectId,
        projectStage: tasks.projectStage,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        sortOrder: tasks.sortOrder,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        projectCode: projects.code,
        assigneeName: users.fullName,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(tasks).where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  // Fetch reporter names separately via batch query to avoid multi-join complexity
  // (assignee and reporter could theoretically be the same row alias)
  // For simplicity, reporter name is omitted from list view (available in detail)

  const data: TaskListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    code: row.code,
    type: row.type as TaskListItem['type'],
    priority: row.priority as TaskListItem['priority'],
    status: row.status as TaskListItem['status'],
    projectId: row.projectId,
    projectStage: row.projectStage,
    startDate: row.startDate,
    dueDate: row.dueDate,
    estimatedHours: row.estimatedHours,
    actualHours: row.actualHours,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName ?? null,
    projectCode: row.projectCode ?? null,
    assigneeName: row.assigneeName ?? null,
    assigneeEmail: row.assigneeEmail ?? null,
    reporterName: null,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getTaskById ──────────────────────────────────────────────────
// Single task with full relations (project, assignee, reporter, subtasks, comments)

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const result = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), sql`${tasks.deletedAt} IS NULL`),
    with: {
      project: {
        columns: { id: true, name: true, code: true, slug: true, stage: true },
      },
      assignee: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      reporter: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      parentTask: {
        columns: { id: true, title: true, code: true },
      },
      subtasks: {
        columns: { id: true, title: true, code: true, status: true },
        where: sql`${tasks.deletedAt} IS NULL`,
      },
      comments: {
        orderBy: (comments, { asc: ascFn }) => [ascFn(comments.createdAt)],
        where: sql`${tasks.deletedAt} IS NULL`,
      },
    },
  });

  if (!result) {
    return null;
  }

  return {
    ...result,
    _count: {
      subtasks: result.subtasks?.length ?? 0,
      comments: result.comments?.length ?? 0,
    },
  } as TaskDetail;
}

// ── getTasksByProject ─────────────────────────────────────────────
// All tasks for a specific project (paginated)

export async function getTasksByProject(
  projectId: string,
  rawFilters: Partial<TaskFilters> = {},
): Promise<PaginatedResult<TaskListItem>> {
  return getTasks({ ...rawFilters, projectId, perPage: rawFilters.perPage ?? DEFAULT_PER_PAGE });
}

// ── getTasksKanban ────────────────────────────────────────────────
// Returns tasks grouped into 4 Kanban columns (todo, in_progress, in_review, done)

export async function getTasksKanban(
  projectId?: string,
  assigneeId?: string,
): Promise<KanbanColumn[]> {
  const conditions = [sql`${tasks.deletedAt} IS NULL`];

  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (assigneeId) {
    conditions.push(eq(tasks.assigneeId, assigneeId));
  }

  // Only fetch tasks in the 4 Kanban columns
  conditions.push(sql`${tasks.status} IN ('todo', 'in_progress', 'in_review', 'done')`);

  const where = and(...conditions);

  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      code: tasks.code,
      type: tasks.type,
      priority: tasks.priority,
      status: tasks.status,
      projectId: tasks.projectId,
      projectStage: tasks.projectStage,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      sortOrder: tasks.sortOrder,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      projectName: projects.name,
      projectCode: projects.code,
      assigneeName: users.fullName,
      assigneeEmail: users.email,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(where)
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));

  // Group by status into Kanban columns
  const grouped: Record<string, TaskListItem[]> = {};
  for (const status of KANBAN_COLUMNS) {
    grouped[status] = [];
  }

  for (const row of rows) {
    const status = row.status as TaskStatus;
    if (grouped[status] !== undefined) {
      grouped[status].push({
        id: row.id,
        title: row.title,
        code: row.code,
        type: row.type as TaskListItem['type'],
        priority: row.priority as TaskListItem['priority'],
        status,
        projectId: row.projectId,
        projectStage: row.projectStage,
        startDate: row.startDate,
        dueDate: row.dueDate,
        estimatedHours: row.estimatedHours,
        actualHours: row.actualHours,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        projectName: row.projectName ?? null,
        projectCode: row.projectCode ?? null,
        assigneeName: row.assigneeName ?? null,
        assigneeEmail: row.assigneeEmail ?? null,
        reporterName: null,
      });
    }
  }

  return KANBAN_COLUMNS.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    tasks: grouped[status] ?? [],
    count: grouped[status]?.length ?? 0,
  }));
}

// ── getOverdueTasks ───────────────────────────────────────────────
// Tasks past their due date that are not done or cancelled

export async function getOverdueTasks(
  assigneeId?: string,
): Promise<PaginatedResult<TaskListItem>> {
  const filters: Partial<TaskFilters> = {
    isOverdue: true,
    sortBy: 'due_date',
    sortOrder: 'asc',
  };
  if (assigneeId) {
    filters.assigneeId = assigneeId;
  }
  return getTasks(filters);
}

// ── getTaskStats ─────────────────────────────────────────────────
// Dashboard statistics: count per status/priority/type

export interface TaskStats {
  totalTasks: number;
  countByStatus: Record<string, number>;
  countByPriority: Record<string, number>;
  countByType: Record<string, number>;
  overdueCount: number;
}

export async function getTaskStats(projectId?: string): Promise<TaskStats> {
  const baseConditions = [sql`${tasks.deletedAt} IS NULL`];
  if (projectId) {
    baseConditions.push(eq(tasks.projectId, projectId));
  }

  const today = new Date().toISOString().split('T')[0];

  const [
    totalResult,
    statusRows,
    priorityRows,
    typeRows,
    overdueResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(tasks).where(and(...baseConditions)),
    db
      .select({ status: tasks.status, cnt: count() })
      .from(tasks)
      .where(and(...baseConditions))
      .groupBy(tasks.status),
    db
      .select({ priority: tasks.priority, cnt: count() })
      .from(tasks)
      .where(and(...baseConditions))
      .groupBy(tasks.priority),
    db
      .select({ type: tasks.type, cnt: count() })
      .from(tasks)
      .where(and(...baseConditions))
      .groupBy(tasks.type),
    db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(
          ...baseConditions,
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, today),
          sql`${tasks.status} NOT IN ('done', 'cancelled')`,
        ),
      ),
  ]);

  const countByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    if (row.status) countByStatus[row.status] = row.cnt;
  }

  const countByPriority: Record<string, number> = {};
  for (const row of priorityRows) {
    if (row.priority) countByPriority[row.priority] = row.cnt;
  }

  const countByType: Record<string, number> = {};
  for (const row of typeRows) {
    if (row.type) countByType[row.type] = row.cnt;
  }

  return {
    totalTasks: totalResult[0]?.value ?? 0,
    countByStatus,
    countByPriority,
    countByType,
    overdueCount: overdueResult[0]?.value ?? 0,
  };
}
