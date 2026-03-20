import { db } from '@/db';
import { notifications } from '@/db/schema/operations';
import { STAGE_LABELS } from '@/modules/projects/constants';
import { STATUS_LABELS as HANDOVER_STATUS_LABELS } from '@/modules/handovers/constants';
import { FINANCE_STATUS_LABELS } from '@/modules/finance/constants';
import type { NotificationType, NotificationPriority } from '@/modules/notifications/types';

// ── Internal helper: insert a single notification row ────────────

async function insertNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  projectId?: string;
  taskId?: string;
  handoverId?: string;
  actorId?: string;
  actionUrl?: string;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      priority: params.priority,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      handoverId: params.handoverId ?? null,
      actorId: params.actorId ?? null,
      actionUrl: params.actionUrl ?? null,
    })
    .returning({ id: notifications.id });
  return { id: row.id };
}

// ════════════════════════════════════════════════════════════════════
// Notification Trigger Functions
// Internal helpers — NOT server actions. Call from within actions.
// ════════════════════════════════════════════════════════════════════

// ── notifyProjectStageChange ────────────────────────────────────

/**
 * Notify project team members about a stage transition.
 * Called after transitionStageAction succeeds.
 */
export async function notifyProjectStageChange(params: {
  projectId: string;
  projectName: string;
  fromStage: string;
  toStage: string;
  triggeredBy: string;
  memberUserIds: string[];
}): Promise<void> {
  const { projectId, projectName, fromStage, toStage, triggeredBy, memberUserIds } = params;

  const fromLabel = STAGE_LABELS[fromStage as keyof typeof STAGE_LABELS] ?? fromStage;
  const toLabel = STAGE_LABELS[toStage as keyof typeof STAGE_LABELS] ?? toStage;

  const title = 'Giai đoạn dự án thay đổi';
  const message = `Dự án "${projectName}" đã chuyển từ "${fromLabel}" sang "${toLabel}".`;
  const actionUrl = `/dashboard/projects`;

  const inserts = memberUserIds
    .filter((uid) => uid !== triggeredBy)
    .map((userId) =>
      insertNotification({
        userId,
        title,
        message,
        type: 'project_stage_changed',
        priority: 'normal',
        projectId,
        actorId: triggeredBy,
        actionUrl,
      }),
    );

  await Promise.all(inserts);
}

// ── notifyHandoverStatusChange ──────────────────────────────────

/**
 * Notify handover parties about status changes (approved, rejected, etc.).
 */
export async function notifyHandoverStatusChange(params: {
  handoverId: string;
  handoverTitle: string;
  status: string;
  triggeredBy: string;
  fromUserId: string;
  toUserId: string;
  projectId?: string;
}): Promise<void> {
  const { handoverId, handoverTitle, status, triggeredBy, fromUserId, toUserId, projectId } =
    params;

  const statusLabel =
    HANDOVER_STATUS_LABELS[status as keyof typeof HANDOVER_STATUS_LABELS] ?? status;

  const typeMap: Record<string, NotificationType> = {
    pending_review: 'handover_initiated',
    in_review: 'handover_initiated',
    approved: 'handover_approved',
    rejected: 'handover_rejected',
    completed: 'handover_approved',
  };
  const notifType: NotificationType = typeMap[status] ?? 'handover_initiated';

  const priorityMap: Record<string, NotificationPriority> = {
    rejected: 'high',
    approved: 'normal',
  };
  const priority: NotificationPriority = priorityMap[status] ?? 'normal';

  const title = `Bàn giao: ${statusLabel}`;
  const message = `Bàn giao "${handoverTitle}" đã được cập nhật trạng thái thành "${statusLabel}".`;
  const actionUrl = `/dashboard/handovers/${handoverId}`;

  const recipientIds = [fromUserId, toUserId].filter(
    (uid, idx, arr) => uid !== triggeredBy && arr.indexOf(uid) === idx,
  );

  const inserts = recipientIds.map((userId) =>
    insertNotification({
      userId,
      title,
      message,
      type: notifType,
      priority,
      handoverId,
      projectId,
      actorId: triggeredBy,
      actionUrl,
    }),
  );

  await Promise.all(inserts);
}

// ── notifyTaskAssigned ──────────────────────────────────────────

/**
 * Notify assignee when a task is assigned to them.
 */
export async function notifyTaskAssigned(params: {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  assignedBy: string;
  projectId: string;
}): Promise<void> {
  const { taskId, taskTitle, assigneeId, assignedBy, projectId } = params;

  if (assigneeId === assignedBy) return;

  await insertNotification({
    userId: assigneeId,
    title: 'Được giao công việc',
    message: `Bạn được giao công việc "${taskTitle}".`,
    type: 'task_assigned',
    priority: 'normal',
    taskId,
    projectId,
    actorId: assignedBy,
    actionUrl: `/dashboard/tasks/${taskId}`,
  });
}

// ── notifyTaskOverdue ───────────────────────────────────────────

/**
 * Notify assignee when their task is overdue.
 * Typically called by a scheduled job / cron.
 */
export async function notifyTaskOverdue(params: {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  projectId: string;
}): Promise<void> {
  const { taskId, taskTitle, assigneeId, projectId } = params;

  await insertNotification({
    userId: assigneeId,
    title: 'Công việc quá hạn',
    message: `Công việc "${taskTitle}" đã quá hạn. Vui lòng cập nhật tiến độ.`,
    type: 'deadline_overdue',
    priority: 'high',
    taskId,
    projectId,
    actionUrl: `/dashboard/tasks/${taskId}`,
  });
}

// ── notifyFinanceApproval ───────────────────────────────────────

/**
 * Notify the record creator when a financial record is approved/rejected.
 */
export async function notifyFinanceApproval(params: {
  recordId: string;
  description: string;
  status: string;
  triggeredBy: string;
  creatorId: string;
  projectId: string;
}): Promise<void> {
  const { recordId, description, status, triggeredBy, creatorId, projectId } = params;

  if (creatorId === triggeredBy) return;

  const statusLabel =
    FINANCE_STATUS_LABELS[status as keyof typeof FINANCE_STATUS_LABELS] ?? status;

  const isRejected = status === 'rejected';

  await insertNotification({
    userId: creatorId,
    title: isRejected ? 'Bản ghi tài chính bị từ chối' : 'Bản ghi tài chính được duyệt',
    message: `Bản ghi "${description}" đã được cập nhật: ${statusLabel}.`,
    type: 'system_alert',
    priority: isRejected ? 'high' : 'normal',
    projectId,
    actorId: triggeredBy,
    actionUrl: `/dashboard/financials/${recordId}`,
  });
}
