'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { notifications, auditLogs } from '@/db/schema/operations';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import { createNotificationSchema, markAsReadSchema } from './validation';
import type { CreateNotificationInput } from './validation';

// ── Audit Log Helper ─────────────────────────────────────────────
// Inserts an immutable audit trail record for every mutation.

async function createAuditLog(params: {
  userId: string;
  action: (typeof auditLogs.$inferInsert)['action'];
  entityType: (typeof auditLogs.$inferInsert)['entityType'];
  entityId: string;
  entityName?: string;
  description?: string;
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    description: params.description,
    severity: 'info',
  });
}

// ════════════════════════════════════════════════════════════════════
// Server Actions — all wrapped with createAction (auth + error handling)
// ════════════════════════════════════════════════════════════════════

// ── createNotification ────────────────────────────────────────────
// Creates a new notification for a target user (system or admin use).

export const createNotification = createAction(
  async (
    data: CreateNotificationInput,
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createNotificationSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu thông báo không hợp lệ.');
    }

    const validated = parsed.data;

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: validated.userId,
        title: validated.title,
        message: validated.message,
        type: validated.type,
        priority: validated.priority,
        projectId: validated.projectId ?? null,
        taskId: validated.taskId ?? null,
        handoverId: validated.handoverId ?? null,
        documentId: validated.documentId ?? null,
        actorId: validated.actorId ?? userId,
        actionUrl: validated.actionUrl ?? null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      })
      .returning();

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'notification',
      entityId: notification.id,
      entityName: validated.title,
      description: `Tạo thông báo loại "${validated.type}" cho người dùng ${validated.userId}`,
    });

    revalidatePath('/dashboard/notifications');
    return ok({ id: notification.id });
  },
);

// ── markAsRead ────────────────────────────────────────────────────
// Marks a single notification as read for the current user.

export const markAsRead = createAction(
  async (
    input: { notificationId: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const parsed = markAsReadSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const { notificationId } = parsed.data;

    // Verify ownership before marking read
    const existing = await db
      .select({ id: notifications.id, title: notifications.title, isRead: notifications.isRead })
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy thông báo.');
    }

    if (existing[0].isRead) {
      return ok(undefined as void);
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));

    revalidatePath('/dashboard/notifications');
    return ok(undefined as void);
  },
);

// ── markAllAsRead ─────────────────────────────────────────────────
// Marks all unread notifications as read for the current user.

export const markAllAsRead = createAction(
  async (_input: Record<string, never>, userId: string): Promise<ActionResult<{ count: number }>> => {
    const unread = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    if (unread.length === 0) {
      return ok({ count: 0 });
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'notification',
      entityId: userId,
      description: `Đánh dấu ${unread.length} thông báo đã đọc`,
    });

    revalidatePath('/dashboard/notifications');
    return ok({ count: unread.length });
  },
);

// ── deleteNotification ────────────────────────────────────────────
// Hard delete a notification (belongs to the current user).

export const deleteNotification = createAction(
  async (
    input: { notificationId: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const parsed = markAsReadSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const { notificationId } = parsed.data;

    const existing = await db
      .select({ id: notifications.id, title: notifications.title })
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy thông báo.');
    }

    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'notification',
      entityId: notificationId,
      entityName: existing[0].title,
    });

    revalidatePath('/dashboard/notifications');
    return ok(undefined as void);
  },
);
