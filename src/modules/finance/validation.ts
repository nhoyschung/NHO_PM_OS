import { z } from 'zod';
import {
  FinancialType,
  FinancialCategory,
  FinancialStatus,
  FinanceFilterSchema,
} from './types';
import { VALIDATION } from './constants';

// ── Create Finance Record Schema ─────────────────────────────────

export const createFinanceRecordSchema = z.object({
  projectId: z.string().uuid('ID dự án không hợp lệ'),
  type: FinancialType,
  category: FinancialCategory.default('other'),
  amount: z
    .number()
    .int('Số tiền phải là số nguyên')
    .min(VALIDATION.AMOUNT_MIN, `Số tiền phải lớn hơn ${VALIDATION.AMOUNT_MIN}`),
  currency: z.string().length(VALIDATION.CURRENCY_LENGTH).default('VND'),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION_MIN, `Mô tả phải có ít nhất ${VALIDATION.DESCRIPTION_MIN} ký tự`)
    .max(VALIDATION.DESCRIPTION_MAX),
  referenceNumber: z.string().max(VALIDATION.REFERENCE_NUMBER_MAX).optional(),
  transactionDate: z.string().date('Ngày giao dịch không hợp lệ'),
});
export type CreateFinanceRecordInput = z.infer<typeof createFinanceRecordSchema>;

// ── Update Finance Record Schema ─────────────────────────────────

const updateFinanceRecordBase = z.object({
  projectId: z.string().uuid('ID dự án không hợp lệ'),
  type: FinancialType,
  category: FinancialCategory,
  amount: z
    .number()
    .int('Số tiền phải là số nguyên')
    .min(VALIDATION.AMOUNT_MIN, `Số tiền phải lớn hơn ${VALIDATION.AMOUNT_MIN}`),
  currency: z.string().length(VALIDATION.CURRENCY_LENGTH),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION_MIN, `Mô tả phải có ít nhất ${VALIDATION.DESCRIPTION_MIN} ký tự`)
    .max(VALIDATION.DESCRIPTION_MAX),
  referenceNumber: z.string().max(VALIDATION.REFERENCE_NUMBER_MAX).nullable(),
  transactionDate: z.string().date('Ngày giao dịch không hợp lệ'),
});

export const updateFinanceRecordSchema = updateFinanceRecordBase.partial();
export type UpdateFinanceRecordInput = z.infer<typeof updateFinanceRecordSchema>;

// ── Approve Finance Record Schema ────────────────────────────────

export const approveFinanceRecordSchema = z.object({
  recordId: z.string().uuid('ID bản ghi không hợp lệ'),
  notes: z.string().max(500).optional(),
});
export type ApproveFinanceRecordInput = z.infer<typeof approveFinanceRecordSchema>;

// ── Reject Finance Record Schema ─────────────────────────────────

export const rejectFinanceRecordSchema = z.object({
  recordId: z.string().uuid('ID bản ghi không hợp lệ'),
  reason: z.string().min(3, 'Lý do từ chối phải có ít nhất 3 ký tự').max(500),
});
export type RejectFinanceRecordInput = z.infer<typeof rejectFinanceRecordSchema>;

// ── CSV Row Schema ────────────────────────────────────────────────

export const csvRowSchema = z.object({
  type: FinancialType,
  category: FinancialCategory.default('other'),
  amount: z.coerce
    .number()
    .int('Số tiền phải là số nguyên')
    .min(1, 'Số tiền phải lớn hơn 0'),
  description: z.string().min(3).max(2000),
  transaction_date: z.string().date('Ngày không hợp lệ'),
  project_id: z.string().uuid('ID dự án không hợp lệ'),
  reference_number: z.string().max(100).optional(),
  currency: z.string().length(3).default('VND'),
});
export type CsvRowInput = z.infer<typeof csvRowSchema>;

// ── Finance Filters Schema ────────────────────────────────────────
// Re-export from types for co-location convenience

export const financeFiltersSchema = FinanceFilterSchema;
export type FinanceFiltersInput = z.infer<typeof financeFiltersSchema>;

// ── Finance Status Transition Validation ─────────────────────────

const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ['approved', 'rejected'],
  approved: ['processed'],
  rejected: [],
  processed: [],
};

export const financeStatusTransitionSchema = z
  .object({
    recordId: z.string().uuid(),
    fromStatus: FinancialStatus,
    toStatus: FinancialStatus,
  })
  .refine(
    (data) => {
      const allowed = ALLOWED_STATUS_TRANSITIONS[data.fromStatus] ?? [];
      return allowed.includes(data.toStatus);
    },
    {
      message: 'Chuyển đổi trạng thái không hợp lệ',
      path: ['toStatus'],
    },
  );
export type FinanceStatusTransitionInput = z.infer<typeof financeStatusTransitionSchema>;
