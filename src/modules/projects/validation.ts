import { z } from 'zod';
import {
  ProjectStage,
  ProjectPriority,
  HealthStatus,
  ProjectFilterSchema,
  SortableColumns,
  SortOrder,
} from './types';
import { ALLOWED_TRANSITIONS, VALIDATION } from './constants';

// ── Create Project Schema ───────────────────────────────────────
// Source: ref-schema-core.md Section 9, ref-golden-module.md Section 3.3

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(VALIDATION.NAME_MIN, `Tên dự án phải có ít nhất ${VALIDATION.NAME_MIN} ký tự`)
      .max(VALIDATION.NAME_MAX),
    description: z.string().max(VALIDATION.DESCRIPTION_MAX).optional(),
    category: z.string().max(VALIDATION.CATEGORY_MAX).optional(),
    priority: ProjectPriority.default('medium'),
    province: z.string().optional(),
    district: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    teamLeadId: z.string().uuid().optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    budget: z.number().int().min(0, 'Ngân sách phải >= 0').optional(),
    currency: z.string().length(VALIDATION.CURRENCY_LENGTH).default('VND'),
    tags: z
      .array(z.string().max(VALIDATION.TAG_MAX_LENGTH))
      .max(VALIDATION.TAGS_MAX_COUNT)
      .default([]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc dự kiến',
      path: ['endDate'],
    },
  );
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ── Update Project Schema ───────────────────────────────────────
// All fields optional via .partial() on the inner object, then same cross-field refinement

const updateProjectBase = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN, `Tên dự án phải có ít nhất ${VALIDATION.NAME_MIN} ký tự`)
    .max(VALIDATION.NAME_MAX),
  description: z.string().max(VALIDATION.DESCRIPTION_MAX).nullable(),
  category: z.string().max(VALIDATION.CATEGORY_MAX).nullable(),
  priority: ProjectPriority,
  province: z.string().nullable(),
  district: z.string().nullable(),
  departmentId: z.string().uuid().nullable(),
  teamLeadId: z.string().uuid().nullable(),
  startDate: z.string().date().nullable(),
  endDate: z.string().date().nullable(),
  budget: z.number().int().min(0, 'Ngân sách phải >= 0').nullable(),
  currency: z.string().length(VALIDATION.CURRENCY_LENGTH),
  tags: z.array(z.string().max(VALIDATION.TAG_MAX_LENGTH)).max(VALIDATION.TAGS_MAX_COUNT),
});

export const updateProjectSchema = updateProjectBase.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc dự kiến',
    path: ['endDate'],
  },
);
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ── Transition Stage Schema ─────────────────────────────────────
// Source: ref-state-machine.md Section 3 — validates against ALLOWED_TRANSITIONS

export const transitionStageSchema = z
  .object({
    projectId: z.string().uuid(),
    fromStage: ProjectStage,
    toStage: ProjectStage,
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      const allowed = ALLOWED_TRANSITIONS[data.fromStage];
      return allowed.includes(data.toStage);
    },
    {
      message: 'Chuyển đổi giai đoạn không hợp lệ',
      path: ['toStage'],
    },
  );
export type TransitionStageInput = z.infer<typeof transitionStageSchema>;

// ── Project Filters Schema ──────────────────────────────────────
// Re-export from types.ts for co-location convenience

export const projectFiltersSchema = ProjectFilterSchema;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
