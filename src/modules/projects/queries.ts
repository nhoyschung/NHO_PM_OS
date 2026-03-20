import { eq, and, or, ilike, gte, lte, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  projects,
  projectMembers,
  handovers,
  documents,
  tasks,
} from '@/db/schema';
import { users, departments } from '@/db/schema';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}
import type {
  ProjectListItem,
  ProjectDetail,
  ProjectFilters,
  PaginatedResult,
  ProjectStage,
} from './types';
import { ProjectFilterSchema } from './types';
import { DEFAULT_PER_PAGE } from './constants';

// ── Column sort map ─────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  name: projects.name,
  code: projects.code,
  created_at: projects.createdAt,
  updated_at: projects.updatedAt,
  priority: projects.priority,
  stage: projects.stage,
  progress_percentage: projects.progressPercentage,
} as const;

// ── getProjects ─────────────────────────────────────────────────
// Paginated project list with filtering, search, and sorting.

export async function getProjects(
  rawFilters: Partial<ProjectFilters>,
): Promise<PaginatedResult<ProjectListItem>> {
  const filters = ProjectFilterSchema.parse(rawFilters);

  // Build dynamic where conditions
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(projects.name, `%${escapeLikePattern(filters.search)}%`),
        ilike(projects.code, `%${escapeLikePattern(filters.search)}%`),
      ),
    );
  }
  if (filters.stage) {
    conditions.push(eq(projects.stage, filters.stage));
  }
  if (filters.priority) {
    conditions.push(eq(projects.priority, filters.priority));
  }
  if (filters.healthStatus) {
    conditions.push(eq(projects.healthStatus, filters.healthStatus));
  }
  if (filters.departmentId) {
    conditions.push(eq(projects.departmentId, filters.departmentId));
  }
  if (filters.managerId) {
    conditions.push(eq(projects.managerId, filters.managerId));
  }
  if (filters.province) {
    conditions.push(eq(projects.province, filters.province));
  }
  if (filters.isArchived !== undefined) {
    conditions.push(eq(projects.isArchived, filters.isArchived));
  }
  if (filters.dateFrom) {
    conditions.push(gte(projects.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(projects.createdAt, new Date(filters.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        slug: projects.slug,
        category: projects.category,
        priority: projects.priority,
        stage: projects.stage,
        province: projects.province,
        healthStatus: projects.healthStatus,
        progressPercentage: projects.progressPercentage,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        budgetSpent: projects.budgetSpent,
        currency: projects.currency,
        isArchived: projects.isArchived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        managerName: users.fullName,
        departmentName: departments.name,
      })
      .from(projects)
      .leftJoin(users, eq(projects.managerId, users.id))
      .leftJoin(departments, eq(projects.departmentId, departments.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(projects)
      .where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  // Enrich with member count per project
  const projectIds = rows.map((r) => r.id);
  let memberCounts: Record<string, number> = {};

  if (projectIds.length > 0) {
    const memberCountRows = await db
      .select({
        projectId: projectMembers.projectId,
        count: count(),
      })
      .from(projectMembers)
      .where(
        and(
          inArray(projectMembers.projectId, projectIds),
          eq(projectMembers.isActive, true),
        ),
      )
      .groupBy(projectMembers.projectId);

    memberCounts = Object.fromEntries(
      memberCountRows.map((r) => [r.projectId, r.count]),
    );
  }

  const data: ProjectListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    slug: row.slug,
    category: row.category,
    priority: row.priority as ProjectListItem['priority'],
    stage: row.stage as ProjectListItem['stage'],
    province: row.province,
    healthStatus: row.healthStatus,
    progressPercentage: row.progressPercentage,
    startDate: row.startDate,
    endDate: row.endDate,
    budget: row.budget,
    budgetSpent: row.budgetSpent,
    currency: row.currency,
    isArchived: row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    managerName: row.managerName,
    departmentName: row.departmentName,
    memberCount: memberCounts[row.id] ?? 0,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getProjectById ──────────────────────────────────────────────
// Single project with full relations (manager, team lead, members, etc.)

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const result = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      manager: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      teamLead: {
        columns: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      createdBy: {
        columns: { id: true, fullName: true, email: true },
      },
      department: {
        columns: { id: true, name: true, code: true },
      },
      members: {
        with: {
          user: {
            columns: { id: true, fullName: true, email: true, avatarUrl: true },
          },
        },
      },
      handovers: true,
      documents: true,
      stageHistory: {
        orderBy: (history, { desc: descFn }) => [descFn(history.createdAt)],
      },
    },
  });

  if (!result) {
    return null;
  }

  // Compute counts for _count field
  const [taskCountResult, handoverCountResult, documentCountResult] = await Promise.all([
    db.select({ value: count() }).from(tasks).where(eq(tasks.projectId, id)),
    db.select({ value: count() }).from(handovers).where(eq(handovers.projectId, id)),
    db.select({ value: count() }).from(documents).where(eq(documents.projectId, id)),
  ]);

  return {
    ...result,
    _count: {
      tasks: taskCountResult[0]?.value ?? 0,
      handovers: handoverCountResult[0]?.value ?? 0,
      documents: documentCountResult[0]?.value ?? 0,
    },
  } as ProjectDetail;
}

// ── getProjectBySlug ─────────────────────────────────────────────
// Single project by slug, delegates to getProjectById after slug lookup.

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const row = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!row[0]) return null;
  return getProjectById(row[0].id);
}

// ── getProjectsByDepartment ─────────────────────────────────────
// Projects filtered by department ID

export async function getProjectsByDepartment(
  departmentId: string,
): Promise<PaginatedResult<ProjectListItem>> {
  return getProjects({ departmentId, isArchived: false });
}

// ── getProjectStats ─────────────────────────────────────────────
// Dashboard statistics: count per stage, total budget, total projects

export interface ProjectStats {
  totalProjects: number;
  totalBudget: number;
  totalBudgetSpent: number;
  countByStage: Record<string, number>;
  countByPriority: Record<string, number>;
  countByHealth: Record<string, number>;
}

export async function getProjectStats(): Promise<ProjectStats> {
  const [
    totalResult,
    budgetResult,
    stageRows,
    priorityRows,
    healthRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(projects).where(eq(projects.isArchived, false)),
    db
      .select({
        totalBudget: sql<number>`COALESCE(SUM(${projects.budget}), 0)`,
        totalBudgetSpent: sql<number>`COALESCE(SUM(${projects.budgetSpent}), 0)`,
      })
      .from(projects)
      .where(eq(projects.isArchived, false)),
    db
      .select({ stage: projects.stage, count: count() })
      .from(projects)
      .where(eq(projects.isArchived, false))
      .groupBy(projects.stage),
    db
      .select({ priority: projects.priority, count: count() })
      .from(projects)
      .where(eq(projects.isArchived, false))
      .groupBy(projects.priority),
    db
      .select({ health: projects.healthStatus, count: count() })
      .from(projects)
      .where(eq(projects.isArchived, false))
      .groupBy(projects.healthStatus),
  ]);

  const countByStage: Record<string, number> = {};
  for (const row of stageRows) {
    if (row.stage) {
      countByStage[row.stage] = row.count;
    }
  }

  const countByPriority: Record<string, number> = {};
  for (const row of priorityRows) {
    if (row.priority) {
      countByPriority[row.priority] = row.count;
    }
  }

  const countByHealth: Record<string, number> = {};
  for (const row of healthRows) {
    if (row.health) {
      countByHealth[row.health] = row.count;
    }
  }

  return {
    totalProjects: totalResult[0]?.value ?? 0,
    totalBudget: Number(budgetResult[0]?.totalBudget ?? 0),
    totalBudgetSpent: Number(budgetResult[0]?.totalBudgetSpent ?? 0),
    countByStage,
    countByPriority,
    countByHealth,
  };
}
