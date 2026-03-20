import { z } from 'zod';
import { NotificationType, NotificationPriority, NotificationFilterSchema } from './types';
import { VALIDATION } from './constants';

// ── Create Notification Schema ────────────────────────────────────
// Used internally (system → user) and by admin actions

export const createNotificationSchema = z.object({
  userId: z.string().uuid('ID người dùng không hợp lệ'),
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, 'Tiêu đề thông báo không được để trống')
    .max(VALIDATION.TITLE_MAX, `Tiêu đề tối đa ${VALIDATION.TITLE_MAX} ký tự`),
  message: z
    .string()
    .max(VALIDATION.MESSAGE_MAX, `Nội dung tối đa ${VALIDATION.MESSAGE_MAX} ký tự`),
  type: NotificationType,
  priority: NotificationPriority.default('normal'),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  handoverId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  actionUrl: z.string().max(VALIDATION.ACTION_URL_MAX).url('URL không hợp lệ').optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// ── Mark As Read Schema ───────────────────────────────────────────

export const markAsReadSchema = z.object({
  notificationId: z.string().uuid('ID thông báo không hợp lệ'),
});
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

// ── Notification Filters Schema ───────────────────────────────────
// Re-export from types for co-location convenience

export const notificationFiltersSchema = NotificationFilterSchema;
export type NotificationFiltersInput = z.infer<typeof notificationFiltersSchema>;
