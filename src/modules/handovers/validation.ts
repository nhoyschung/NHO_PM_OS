import { z } from 'zod';
import {
  HandoverStatus,
  HandoverType,
  ChecklistCategory,
  ChecklistPriority,
  HandoverFilterSchema,
} from './types';
import { ALLOWED_TRANSITIONS, VALIDATION } from './constants';

// ── Create Handover Schema ──────────────────────────────────────

export const createHandoverSchema = z.object({
  projectId: z.string().uuid('Dự án là bắt buộc'),
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Tiêu đề phải có ít nhất ${VALIDATION.TITLE_MIN} ký tự`)
    .max(VALIDATION.TITLE_MAX),
  description: z.string().max(VALIDATION.DESCRIPTION_MAX).optional(),
  type: HandoverType,
  toUserId: z.string().uuid('Người nhận là bắt buộc'),
  fromDepartmentId: z.string().uuid().optional(),
  toDepartmentId: z.string().uuid().optional(),
  fromStage: z.string().optional(),
  toStage: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(VALIDATION.NOTES_MAX).optional(),
});
export type CreateHandoverInput = z.infer<typeof createHandoverSchema>;

// ── Update Handover Schema ──────────────────────────────────────

const updateHandoverBase = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Tiêu đề phải có ít nhất ${VALIDATION.TITLE_MIN} ký tự`)
    .max(VALIDATION.TITLE_MAX),
  description: z.string().max(VALIDATION.DESCRIPTION_MAX).nullable(),
  type: HandoverType,
  toUserId: z.string().uuid(),
  fromDepartmentId: z.string().uuid().nullable(),
  toDepartmentId: z.string().uuid().nullable(),
  fromStage: z.string().nullable(),
  toStage: z.string().nullable(),
  dueDate: z.string().datetime().nullable(),
  notes: z.string().max(VALIDATION.NOTES_MAX).nullable(),
});

export const updateHandoverSchema = updateHandoverBase.partial();
export type UpdateHandoverInput = z.infer<typeof updateHandoverSchema>;

// ── Transition Status Schema ────────────────────────────────────
// Validates against ALLOWED_TRANSITIONS state machine

export const transitionStatusSchema = z
  .object({
    handoverId: z.string().uuid(),
    fromStatus: HandoverStatus,
    toStatus: HandoverStatus,
    notes: z.string().max(VALIDATION.NOTES_MAX).optional(),
    rejectionReason: z.string().max(VALIDATION.REJECTION_REASON_MAX).optional(),
  })
  .refine(
    (data) => {
      const allowed = ALLOWED_TRANSITIONS[data.fromStatus];
      return allowed.includes(data.toStatus);
    },
    {
      message: 'Chuyển đổi trạng thái bàn giao không hợp lệ',
      path: ['toStatus'],
    },
  );
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>;

// ── Approve Handover Schema ─────────────────────────────────────

export const approveHandoverSchema = z.object({
  handoverId: z.string().uuid(),
  notes: z.string().max(VALIDATION.NOTES_MAX).optional(),
});
export type ApproveHandoverInput = z.infer<typeof approveHandoverSchema>;

// ── Checklist Item Schema ───────────────────────────────────────

export const checklistItemSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.CHECKLIST_TITLE_MIN, 'Tiêu đề mục kiểm tra là bắt buộc')
    .max(VALIDATION.CHECKLIST_TITLE_MAX),
  description: z.string().max(VALIDATION.CHECKLIST_DESCRIPTION_MAX).optional(),
  category: ChecklistCategory.default('other'),
  priority: ChecklistPriority.default('required'),
  sortOrder: z.number().int().min(0).default(0),
  requiresEvidence: z.boolean().default(false),
});
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;

// ── Handover Filters Schema ─────────────────────────────────────
// Re-export from types.ts for co-location convenience

export const handoverFiltersSchema = HandoverFilterSchema;
export type HandoverFiltersInput = z.infer<typeof handoverFiltersSchema>;
