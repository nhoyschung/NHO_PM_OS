import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { financialRecords } from '@/db/schema/operations';

// ── Enum Zod Schemas (SOT — values match enums.ts) ───────────────

export const FinancialType = z.enum([
  'budget_allocation',
  'expense',
  'invoice',
  'payment',
  'refund',
  'adjustment',
]);
export type FinancialType = z.infer<typeof FinancialType>;

export const FinancialCategory = z.enum([
  'labor',
  'software',
  'hardware',
  'infrastructure',
  'consulting',
  'training',
  'travel',
  'other',
]);
export type FinancialCategory = z.infer<typeof FinancialCategory>;

export const FinancialStatus = z.enum(['pending', 'approved', 'rejected', 'processed']);
export type FinancialStatus = z.infer<typeof FinancialStatus>;

// ── DB Row Type ──────────────────────────────────────────────────

export type FinancialRecordRow = InferSelectModel<typeof financialRecords>;

// ── Finance List Item (subset for list views) ────────────────────

export interface FinanceListItem {
  id: string;
  type: FinancialType;
  category: FinancialCategory;
  amount: number;
  currency: string;
  description: string;
  referenceNumber: string | null;
  transactionDate: string;
  status: FinancialStatus;
  projectId: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  projectName: string | null;
  createdByName: string | null;
  approvedByName: string | null;
}

// ── Finance Detail (full entity with relations) ──────────────────

export interface FinanceDetail extends FinancialRecordRow {
  project: { id: string; name: string; code: string } | null;
  createdByUser: { id: string; fullName: string | null; email: string } | null;
  approvedByUser: { id: string; fullName: string | null; email: string } | null;
}

// ── Finance Form Data ────────────────────────────────────────────

export const FinanceFormSchema = z.object({
  projectId: z.string().uuid('ID dự án không hợp lệ'),
  type: FinancialType,
  category: FinancialCategory.default('other'),
  amount: z.number().int().min(1, 'Số tiền phải lớn hơn 0'),
  currency: z.string().length(3).default('VND'),
  description: z.string().min(3, 'Mô tả phải có ít nhất 3 ký tự').max(2000),
  referenceNumber: z.string().max(100).optional(),
  transactionDate: z.string().date('Ngày giao dịch không hợp lệ'),
});
export type FinanceFormData = z.infer<typeof FinanceFormSchema>;

export const FinanceUpdateSchema = FinanceFormSchema.partial();
export type FinanceUpdateData = z.infer<typeof FinanceUpdateSchema>;

// ── Finance Summary ──────────────────────────────────────────────

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalRecords: number;
}

// ── Finance Filters ──────────────────────────────────────────────

export const SortableColumns = z.enum([
  'transaction_date',
  'created_at',
  'updated_at',
  'amount',
  'type',
  'status',
]);
export type SortableColumn = z.infer<typeof SortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const FinanceFilterSchema = z.object({
  search: z.string().optional(),
  type: FinancialType.optional(),
  category: FinancialCategory.optional(),
  status: FinancialStatus.optional(),
  projectId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: SortableColumns.default('transaction_date'),
  sortOrder: SortOrder.default('desc'),
});
export type FinanceFilters = z.infer<typeof FinanceFilterSchema>;

// ── CSV Import Result ────────────────────────────────────────────

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

// ── Project Finance Summary (per-project grouped) ───────────────

export interface ProjectFinanceSummary {
  projectId: string;
  projectName: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recordCount: number;
}

// ── Paginated Result ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
