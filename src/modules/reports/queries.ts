import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { db } from '@/db';
import { projects, handovers } from '@/db/schema/core';
import { tasks, financialRecords } from '@/db/schema/operations';
import { users } from '@/db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { isIncomeType } from '@/modules/finance/constants';
import type { FinancialType } from '@/modules/finance/types';
import type {
  ProjectSummaryRow,
  FinanceSummaryRow,
  TaskCompletionRow,
  HandoverStatusRow,
  ReportResult,
} from './types';
import { REPORT_MAX_ROWS } from './constants';

// ── Shared date filter builder ──────────────────────────────────

function buildDateConditions(
  dateColumn: Parameters<typeof gte>[0],
  dateFrom?: string,
  dateTo?: string,
) {
  const conditions = [];
  if (dateFrom) {
    conditions.push(gte(dateColumn, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(dateColumn, new Date(dateTo)));
  }
  return conditions;
}

// ── getProjectSummaryReport ─────────────────────────────────────
// Projects with stage, budget, task counts.

export async function getProjectSummaryReport(
  dateFrom?: string,
  dateTo?: string,
  projectId?: string,
): Promise<ReportResult<ProjectSummaryRow>> {
  const conditions = [eq(projects.isArchived, false)];

  if (projectId) {
    conditions.push(eq(projects.id, projectId));
  }
  conditions.push(...buildDateConditions(projects.createdAt, dateFrom, dateTo));

  const rows = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      projectCode: projects.code,
      stage: projects.stage,
      priority: projects.priority,
      healthStatus: projects.healthStatus,
      progressPercentage: projects.progressPercentage,
      budget: projects.budget,
      budgetSpent: projects.budgetSpent,
      currency: projects.currency,
      startDate: projects.startDate,
      endDate: projects.endDate,
    })
    .from(projects)
    .where(and(...conditions))
    .limit(REPORT_MAX_ROWS);

  // Batch task counts per project
  const projectIds = rows.map((r) => r.projectId);
  let taskCounts: Record<string, number> = {};

  if (projectIds.length > 0) {
    const taskCountRows = await db
      .select({
        projectId: tasks.projectId,
        cnt: count(),
      })
      .from(tasks)
      .where(
        and(
          sql`${tasks.projectId} IN (${sql.join(projectIds.map((id) => sql`${id}`), sql`, `)})`,
          sql`${tasks.deletedAt} IS NULL`,
        ),
      )
      .groupBy(tasks.projectId);

    taskCounts = Object.fromEntries(taskCountRows.map((r) => [r.projectId, r.cnt]));
  }

  const data: ProjectSummaryRow[] = rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName,
    projectCode: row.projectCode,
    stage: row.stage,
    priority: row.priority,
    healthStatus: row.healthStatus,
    progressPercentage: row.progressPercentage,
    budget: row.budget,
    budgetSpent: row.budgetSpent,
    currency: row.currency ?? 'VND',
    taskCount: taskCounts[row.projectId] ?? 0,
    startDate: row.startDate,
    endDate: row.endDate,
  }));

  return {
    type: 'project_summary',
    generatedAt: new Date().toISOString(),
    rowCount: data.length,
    rows: data,
  };
}

// ── getFinanceSummaryReport ─────────────────────────────────────
// Income/expense breakdown grouped by project + type + category.

export async function getFinanceSummaryReport(
  dateFrom?: string,
  dateTo?: string,
  projectId?: string,
): Promise<ReportResult<FinanceSummaryRow>> {
  const conditions = [];

  if (projectId) {
    conditions.push(eq(financialRecords.projectId, projectId));
  }
  if (dateFrom) {
    conditions.push(gte(financialRecords.transactionDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(financialRecords.transactionDate, dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      projectId: financialRecords.projectId,
      projectName: projects.name,
      type: financialRecords.type,
      category: financialRecords.category,
      totalAmount: sql<number>`COALESCE(SUM(${financialRecords.amount}), 0)`,
      recordCount: count(),
      currency: financialRecords.currency,
    })
    .from(financialRecords)
    .leftJoin(projects, eq(financialRecords.projectId, projects.id))
    .where(where)
    .groupBy(
      financialRecords.projectId,
      projects.name,
      financialRecords.type,
      financialRecords.category,
      financialRecords.currency,
    )
    .limit(REPORT_MAX_ROWS);

  const data: FinanceSummaryRow[] = rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName ?? 'Không xác định',
    type: row.type,
    category: row.category,
    totalAmount: Number(row.totalAmount),
    recordCount: row.recordCount,
    currency: row.currency,
  }));

  return {
    type: 'finance_summary',
    generatedAt: new Date().toISOString(),
    rowCount: data.length,
    rows: data,
  };
}

// ── getTaskCompletionReport ─────────────────────────────────────
// Task completion rates grouped by project.

export async function getTaskCompletionReport(
  dateFrom?: string,
  dateTo?: string,
  projectId?: string,
): Promise<ReportResult<TaskCompletionRow>> {
  const conditions = [sql`${tasks.deletedAt} IS NULL`];

  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  conditions.push(...buildDateConditions(tasks.createdAt, dateFrom, dateTo));

  const where = and(...conditions);

  const today = new Date().toISOString().split('T')[0];

  const rows = await db
    .select({
      projectId: tasks.projectId,
      projectName: projects.name,
      totalTasks: count(),
      doneTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
      inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.dueDate} IS NOT NULL AND ${tasks.dueDate} < ${today} AND ${tasks.status} NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END)`,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(where)
    .groupBy(tasks.projectId, projects.name)
    .limit(REPORT_MAX_ROWS);

  const data: TaskCompletionRow[] = rows.map((row) => {
    const total = row.totalTasks;
    const done = Number(row.doneTasks);
    return {
      projectId: row.projectId,
      projectName: row.projectName ?? 'Không xác định',
      totalTasks: total,
      doneTasks: done,
      inProgressTasks: Number(row.inProgressTasks),
      overdueTasks: Number(row.overdueTasks),
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    type: 'task_completion',
    generatedAt: new Date().toISOString(),
    rowCount: data.length,
    rows: data,
  };
}

// ── getHandoverStatusReport ─────────────────────────────────────
// Handover status breakdown.

const fromUsers = alias(users, 'from_users');
const toUsers = alias(users, 'to_users');

export async function getHandoverStatusReport(
  dateFrom?: string,
  dateTo?: string,
  projectId?: string,
): Promise<ReportResult<HandoverStatusRow>> {
  const conditions = [];

  if (projectId) {
    conditions.push(eq(handovers.projectId, projectId));
  }
  conditions.push(...buildDateConditions(handovers.createdAt, dateFrom, dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      projectId: handovers.projectId,
      projectName: projects.name,
      handoverId: handovers.id,
      handoverTitle: handovers.title,
      type: handovers.type,
      status: handovers.status,
      fromUserName: fromUsers.fullName,
      toUserName: toUsers.fullName,
      dueDate: handovers.dueDate,
      createdAt: handovers.createdAt,
    })
    .from(handovers)
    .leftJoin(projects, eq(handovers.projectId, projects.id))
    .leftJoin(fromUsers, eq(handovers.fromUserId, fromUsers.id))
    .leftJoin(toUsers, eq(handovers.toUserId, toUsers.id))
    .where(where)
    .orderBy(handovers.createdAt)
    .limit(REPORT_MAX_ROWS);

  const data: HandoverStatusRow[] = rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName ?? 'Không xác định',
    handoverId: row.handoverId,
    handoverTitle: row.handoverTitle,
    type: row.type,
    status: row.status,
    fromUserName: row.fromUserName,
    toUserName: row.toUserName,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
  }));

  return {
    type: 'handover_status',
    generatedAt: new Date().toISOString(),
    rowCount: data.length,
    rows: data,
  };
}
