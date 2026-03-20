import type { FinancialType, FinancialCategory, FinancialStatus } from './types';

// ── Finance Type Labels (Vietnamese) ─────────────────────────────
// Source: ref-ux-vietnam.md Section 16 — Financial Record Types

export const FINANCE_TYPE_LABELS: Record<FinancialType, string> = {
  budget_allocation: 'Phân bổ ngân sách',
  expense: 'Chi phí',
  invoice: 'Hóa đơn',
  payment: 'Thanh toán',
  refund: 'Hoàn tiền',
  adjustment: 'Điều chỉnh',
};

// ── Finance Type Colors (Tailwind) ────────────────────────────────
// Thu types (income-like): budget_allocation, refund
// Chi types (expense-like): expense, invoice, payment, adjustment

export const FINANCE_TYPE_COLORS: Record<FinancialType, { bg: string; text: string }> = {
  budget_allocation: { bg: 'bg-blue-100', text: 'text-blue-800' },
  expense: { bg: 'bg-red-100', text: 'text-red-800' },
  invoice: { bg: 'bg-orange-100', text: 'text-orange-800' },
  payment: { bg: 'bg-purple-100', text: 'text-purple-800' },
  refund: { bg: 'bg-green-100', text: 'text-green-800' },
  adjustment: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

// ── Finance Category Labels (Vietnamese) ─────────────────────────
// Source: ref-ux-vietnam.md Section 17 — Financial Categories

export const FINANCE_CATEGORY_LABELS: Record<FinancialCategory, string> = {
  labor: 'Nhân công',
  software: 'Phần mềm',
  hardware: 'Phần cứng',
  infrastructure: 'Hạ tầng',
  consulting: 'Tư vấn',
  training: 'Đào tạo',
  travel: 'Đi lại',
  other: 'Khác',
};

// ── Finance Status Labels (Vietnamese) ───────────────────────────

export const FINANCE_STATUS_LABELS: Record<FinancialStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  processed: 'Đã xử lý',
};

// ── Finance Status Colors (Tailwind) ─────────────────────────────

export const FINANCE_STATUS_COLORS: Record<FinancialStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  processed: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

// ── Income vs Expense Classification ─────────────────────────────
// Thu (income): budget_allocation, refund
// Chi (expense): expense, invoice, payment, adjustment

export const INCOME_TYPES: readonly FinancialType[] = ['budget_allocation', 'refund'] as const;
export const EXPENSE_TYPES: readonly FinancialType[] = [
  'expense',
  'invoice',
  'payment',
  'adjustment',
] as const;

export function isIncomeType(type: FinancialType): boolean {
  return (INCOME_TYPES as readonly string[]).includes(type);
}

// Vietnamese shorthand: Thu / Chi
export const FINANCE_CLASS_LABELS = {
  income: 'Thu',
  expense: 'Chi',
} as const;

export const FINANCE_CLASS_COLORS = {
  income: { bg: 'bg-green-100', text: 'text-green-800' },
  expense: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

// ── CSV Import Required Columns ───────────────────────────────────

export const CSV_REQUIRED_COLUMNS = [
  'type',
  'category',
  'amount',
  'description',
  'transaction_date',
  'project_id',
] as const;

// ── Validation Rules ─────────────────────────────────────────────

export const VALIDATION = {
  DESCRIPTION_MIN: 3,
  DESCRIPTION_MAX: 2000,
  REFERENCE_NUMBER_MAX: 100,
  AMOUNT_MIN: 1,
  CURRENCY_LENGTH: 3,
} as const;

// ── Pagination ───────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Permission Keys (RBAC) ───────────────────────────────────────

export const PERMISSIONS = {
  FINANCE_CREATE: 'finance:create',
  FINANCE_READ: 'finance:read',
  FINANCE_UPDATE: 'finance:update',
  FINANCE_DELETE: 'finance:delete',
  FINANCE_APPROVE: 'finance:approve',
  FINANCE_IMPORT: 'finance:import',
  FINANCE_EXPORT: 'finance:export',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  type: true,
  category: true,
  amount: true,
  description: true,
  transactionDate: true,
  status: true,
  project: true,
  createdBy: false,
  referenceNumber: false,
  createdAt: false,
};

// ── Filter Presets ────────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL: {
    label: 'Tất cả',
    filters: {},
  },
  PENDING: {
    label: 'Chờ duyệt',
    filters: { status: 'pending' as const },
  },
  APPROVED: {
    label: 'Đã duyệt',
    filters: { status: 'approved' as const },
  },
  INCOME: {
    label: 'Thu',
    filters: { type: 'budget_allocation' as const },
  },
  EXPENSE: {
    label: 'Chi phí',
    filters: { type: 'expense' as const },
  },
} as const;
