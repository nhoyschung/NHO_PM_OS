import { eq, and, or, ilike, gte, lte, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { financialRecords } from '@/db/schema/operations';
import { projects } from '@/db/schema/core';
import { users } from '@/db/schema';
import type {
  FinanceListItem,
  FinanceDetail,
  FinanceFilters,
  FinanceSummary,
  ProjectFinanceSummary,
  PaginatedResult,
} from './types';
import { FinanceFilterSchema } from './types';
import { DEFAULT_PER_PAGE, isIncomeType } from './constants';

/** Escape LIKE wildcard metacharacters to prevent pattern injection. */
function escapeLikePattern(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

// ── Column sort map ──────────────────────────────────────────────
// Maps sortBy filter values to actual Drizzle column references

const SORT_COLUMN_MAP = {
  transaction_date: financialRecords.transactionDate,
  created_at: financialRecords.createdAt,
  updated_at: financialRecords.updatedAt,
  amount: financialRecords.amount,
  type: financialRecords.type,
  status: financialRecords.status,
} as const;

// ── getFinanceRecords ────────────────────────────────────────────
// Paginated finance record list with filtering, search, and sorting.

export async function getFinanceRecords(
  rawFilters: Partial<FinanceFilters>,
): Promise<PaginatedResult<FinanceListItem>> {
  const filters = FinanceFilterSchema.parse(rawFilters);

  const conditions = [];

  if (filters.search) {
    const escaped = escapeLikePattern(filters.search);
    conditions.push(
      or(
        ilike(financialRecords.description, `%${escaped}%`),
        ilike(financialRecords.referenceNumber, `%${escaped}%`),
      ),
    );
  }
  if (filters.type) {
    conditions.push(eq(financialRecords.type, filters.type));
  }
  if (filters.category) {
    conditions.push(eq(financialRecords.category, filters.category));
  }
  if (filters.status) {
    conditions.push(eq(financialRecords.status, filters.status));
  }
  if (filters.projectId) {
    conditions.push(eq(financialRecords.projectId, filters.projectId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(financialRecords.transactionDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(financialRecords.transactionDate, filters.dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy];
  const orderBy = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute data + count queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: financialRecords.id,
        type: financialRecords.type,
        category: financialRecords.category,
        amount: financialRecords.amount,
        currency: financialRecords.currency,
        description: financialRecords.description,
        referenceNumber: financialRecords.referenceNumber,
        transactionDate: financialRecords.transactionDate,
        status: financialRecords.status,
        projectId: financialRecords.projectId,
        createdBy: financialRecords.createdBy,
        approvedBy: financialRecords.approvedBy,
        approvedAt: financialRecords.approvedAt,
        createdAt: financialRecords.createdAt,
        updatedAt: financialRecords.updatedAt,
        projectName: projects.name,
      })
      .from(financialRecords)
      .leftJoin(projects, eq(financialRecords.projectId, projects.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(financialRecords).where(where),
  ]);

  const total = countResult[0]?.value ?? 0;

  // Enrich with creator names via batch query
  const creatorIds = [...new Set(rows.map((r) => r.createdBy).filter(Boolean))] as string[];
  const approverIds = [
    ...new Set(rows.map((r) => r.approvedBy).filter((id): id is string => id !== null)),
  ];

  let creatorNames: Record<string, string | null> = {};
  let approverNames: Record<string, string | null> = {};

  if (creatorIds.length > 0) {
    const nameRows = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, creatorIds));
    creatorNames = Object.fromEntries(nameRows.map((r) => [r.id, r.fullName]));
  }

  if (approverIds.length > 0) {
    const nameRows = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, approverIds));
    approverNames = Object.fromEntries(nameRows.map((r) => [r.id, r.fullName]));
  }

  const data: FinanceListItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type as FinanceListItem['type'],
    category: row.category as FinanceListItem['category'],
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    referenceNumber: row.referenceNumber,
    transactionDate: row.transactionDate,
    status: row.status as FinanceListItem['status'],
    projectId: row.projectId,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName ?? null,
    createdByName: creatorNames[row.createdBy] ?? null,
    approvedByName: row.approvedBy ? (approverNames[row.approvedBy] ?? null) : null,
  }));

  return {
    data,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
  };
}

// ── getFinanceRecordById ─────────────────────────────────────────
// Single record with full relations.

export async function getFinanceRecordById(id: string): Promise<FinanceDetail | null> {
  const result = await db.query.financialRecords.findFirst({
    where: eq(financialRecords.id, id),
    with: {
      project: {
        columns: { id: true, name: true, code: true },
      },
      createdByUser: {
        columns: { id: true, fullName: true, email: true },
      },
      approvedByUser: {
        columns: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!result) return null;
  return result as unknown as FinanceDetail;
}

// ── getFinanceByProject ──────────────────────────────────────────
// Finance records filtered by project ID.

export async function getFinanceByProject(
  projectId: string,
  rawFilters: Partial<FinanceFilters> = {},
): Promise<PaginatedResult<FinanceListItem>> {
  return getFinanceRecords({ ...rawFilters, projectId });
}

// ── getFinanceSummary ────────────────────────────────────────────
// Summary statistics: total income, total expense, balance, total records.

export async function getFinanceSummary(projectId?: string): Promise<FinanceSummary> {
  const baseWhere = projectId ? eq(financialRecords.projectId, projectId) : undefined;

  const [totalResult, allRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(financialRecords)
      .where(baseWhere),
    db
      .select({ type: financialRecords.type, amount: financialRecords.amount })
      .from(financialRecords)
      .where(baseWhere),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of allRows) {
    if (isIncomeType(row.type as FinanceListItem['type'])) {
      totalIncome += row.amount;
    } else {
      totalExpense += row.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalRecords: totalResult[0]?.value ?? 0,
  };
}

// ── getFinanceSummaryByProject ────────────────────────────────────
// Per-project financial summary: income, expense, balance, record count.
// Sorted by balance ascending (deficit projects first).

export async function getFinanceSummaryByProject(): Promise<ProjectFinanceSummary[]> {
  const rows = await db
    .select({
      projectId: financialRecords.projectId,
      projectName: projects.name,
      type: financialRecords.type,
      amount: financialRecords.amount,
    })
    .from(financialRecords)
    .leftJoin(projects, eq(financialRecords.projectId, projects.id));

  // Aggregate in-memory per project
  const map = new Map<
    string,
    { projectName: string; totalIncome: number; totalExpense: number; recordCount: number }
  >();

  for (const row of rows) {
    const existing = map.get(row.projectId) ?? {
      projectName: row.projectName ?? 'Không xác định',
      totalIncome: 0,
      totalExpense: 0,
      recordCount: 0,
    };

    if (isIncomeType(row.type as FinanceListItem['type'])) {
      existing.totalIncome += row.amount;
    } else {
      existing.totalExpense += row.amount;
    }
    existing.recordCount++;

    map.set(row.projectId, existing);
  }

  const summaries: ProjectFinanceSummary[] = Array.from(map.entries()).map(
    ([projectId, data]) => ({
      projectId,
      projectName: data.projectName,
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense,
      balance: data.totalIncome - data.totalExpense,
      recordCount: data.recordCount,
    }),
  );

  // Sort by balance ascending — deficit projects first
  summaries.sort((a, b) => a.balance - b.balance);

  return summaries;
}

// Re-export for convenience
export { DEFAULT_PER_PAGE };
