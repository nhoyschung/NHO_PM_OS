import { z } from 'zod';
import { TaskStatus, TaskType, TaskPriority, TaskFilterSchema } from './types';
import { ALLOWED_TASK_TRANSITIONS, VALIDATION } from './constants';

// ── Create Task Schema ────────────────────────────────────────────

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .min(VALIDATION.TITLE_MIN, `Tiêu đề phải có ít nhất ${VALIDATION.TITLE_MIN} ký tự`)
      .max(VALIDATION.TITLE_MAX),
    description: z.string().max(VALIDATION.DESCRIPTION_MAX).optional(),
    projectId: z.string().uuid('ID dự án không hợp lệ'),
    type: TaskType.default('feature'),
    priority: TaskPriority.default('medium'),
    status: TaskStatus.default('backlog'),
    assigneeId: z.string().uuid('ID người được giao không hợp lệ').optional(),
    projectStage: z.string().optional(),
    startDate: z.string().date().optional(),
    dueDate: z.string().date().optional(),
    estimatedHours: z
      .number()
      .int()
      .min(0, 'Số giờ ước tính phải >= 0')
      .max(VALIDATION.HOURS_MAX)
      .optional(),
    parentTaskId: z.string().uuid('ID công việc cha không hợp lệ').optional(),
    tags: z
      .array(z.string().max(VALIDATION.TAG_MAX_LENGTH))
      .max(VALIDATION.TAGS_MAX_COUNT)
      .default([]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.startDate <= data.dueDate;
      }
      return true;
    },
    {
      message: 'Ngày bắt đầu phải trước hoặc bằng hạn chót',
      path: ['dueDate'],
    },
  );
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ── Update Task Schema ────────────────────────────────────────────

const updateTaskBase = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Tiêu đề phải có ít nhất ${VALIDATION.TITLE_MIN} ký tự`)
    .max(VALIDATION.TITLE_MAX),
  description: z.string().max(VALIDATION.DESCRIPTION_MAX).nullable(),
  type: TaskType,
  priority: TaskPriority,
  status: TaskStatus,
  assigneeId: z.string().uuid().nullable(),
  projectStage: z.string().nullable(),
  startDate: z.string().date().nullable(),
  dueDate: z.string().date().nullable(),
  estimatedHours: z.number().int().min(0).max(VALIDATION.HOURS_MAX).nullable(),
  actualHours: z.number().int().min(0).max(VALIDATION.HOURS_MAX).nullable(),
  parentTaskId: z.string().uuid().nullable(),
  tags: z.array(z.string().max(VALIDATION.TAG_MAX_LENGTH)).max(VALIDATION.TAGS_MAX_COUNT),
});

export const updateTaskSchema = updateTaskBase.partial().refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return data.startDate <= data.dueDate;
    }
    return true;
  },
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng hạn chót',
    path: ['dueDate'],
  },
);
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ── Transition Task Status Schema ─────────────────────────────────
// Validates against ALLOWED_TASK_TRANSITIONS adjacency list

export const transitionTaskStatusSchema = z
  .object({
    taskId: z.string().uuid(),
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    notes: z.string().max(VALIDATION.NOTES_MAX).optional(),
  })
  .refine(
    (data) => {
      const allowed = ALLOWED_TASK_TRANSITIONS[data.fromStatus];
      return allowed.includes(data.toStatus);
    },
    {
      message: 'Chuyển đổi trạng thái không hợp lệ',
      path: ['toStatus'],
    },
  );
export type TransitionTaskStatusInput = z.infer<typeof transitionTaskStatusSchema>;

// ── Task Filters Schema ───────────────────────────────────────────
// Re-export from types.ts for co-location convenience

export const taskFiltersSchema = TaskFilterSchema;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
