'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { tasks, auditLogs } from '@/db/schema';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import { createTaskSchema, updateTaskSchema, transitionTaskStatusSchema } from './validation';
import { ALLOWED_TASK_TRANSITIONS, TASK_CODE_PREFIX } from './constants';
import type { TaskFormData, TaskStatus } from './types';

// ── Audit Log Helper ──────────────────────────────────────────────

async function createAuditLog(params: {
  userId: string;
  action: (typeof auditLogs.$inferInsert)['action'];
  entityType: (typeof auditLogs.$inferInsert)['entityType'];
  entityId: string;
  entityName?: string;
  projectId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    projectId: params.projectId,
    oldValues: params.oldValues,
    newValues: params.newValues,
    description: params.description,
    severity: 'info',
  });
}

// ── Task Code Generator ───────────────────────────────────────────
// Generates sequential codes: TSK-001, TSK-002, etc.

async function generateTaskCode(): Promise<string> {
  const result = await db
    .select({ maxCode: sql<string>`MAX(${tasks.code})` })
    .from(tasks);

  const maxCode = result[0]?.maxCode;
  if (!maxCode) return `${TASK_CODE_PREFIX}-001`;

  const numericPart = maxCode.replace(`${TASK_CODE_PREFIX}-`, '');
  const nextNumber = parseInt(numericPart, 10) + 1;
  return `${TASK_CODE_PREFIX}-${String(nextNumber).padStart(3, '0')}`;
}

// ════════════════════════════════════════════════════════════════════
// Server Actions — all wrapped with createAction (auth + error handling)
// ════════════════════════════════════════════════════════════════════

// ── createTask ───────────────────────────────────────────────────

export const createTask = createAction(
  async (data: TaskFormData, userId: string): Promise<ActionResult<{ id: string }>> => {
    const parsed = createTaskSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;
    const code = await generateTaskCode();

    const [task] = await db
      .insert(tasks)
      .values({
        title: validated.title,
        code,
        description: validated.description ?? null,
        projectId: validated.projectId,
        type: validated.type,
        priority: validated.priority,
        status: validated.status,
        assigneeId: validated.assigneeId ?? null,
        reporterId: userId,
        projectStage: validated.projectStage ?? null,
        startDate: validated.startDate ?? null,
        dueDate: validated.dueDate ?? null,
        estimatedHours: validated.estimatedHours ?? null,
        parentTaskId: validated.parentTaskId ?? null,
        tags: validated.tags,
      })
      .returning();

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'task',
      entityId: task.id,
      entityName: task.title,
      projectId: task.projectId,
      newValues: {
        title: validated.title,
        code,
        type: validated.type,
        priority: validated.priority,
        status: validated.status,
      },
    });

    revalidatePath('/dashboard/tasks');
    revalidatePath(`/dashboard/projects/${validated.projectId}`);
    return ok({ id: task.id });
  },
);

// ── updateTask ───────────────────────────────────────────────────

export const updateTask = createAction(
  async (
    input: { taskId: string; data: Partial<TaskFormData> },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { taskId, data } = input;

    const parsed = updateTaskSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), sql`${tasks.deletedAt} IS NULL`))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy công việc.');
    }

    const updateFields: Record<string, unknown> = {};
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};

    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) {
        const existingValue = (existing[0] as Record<string, unknown>)[key];
        if (JSON.stringify(existingValue) !== JSON.stringify(value)) {
          updateFields[key] = value;
          changedFields[key] = { old: existingValue, new: value };
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return ok({ id: existing[0].id });
    }

    updateFields.updatedAt = new Date();

    const [updated] = await db
      .update(tasks)
      .set(updateFields)
      .where(eq(tasks.id, taskId))
      .returning();

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'task',
      entityId: taskId,
      entityName: updated.title,
      projectId: updated.projectId,
      oldValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old])),
      newValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new])),
    });

    revalidatePath('/dashboard/tasks');
    revalidatePath(`/dashboard/tasks/${taskId}`);
    revalidatePath(`/dashboard/projects/${updated.projectId}`);

    return ok({ id: updated.id });
  },
);

// ── transitionTaskStatus ─────────────────────────────────────────
// TOCTOU: re-reads DB FIRST, then validates against actual state.

export const transitionTaskStatus = createAction(
  async (
    input: { taskId: string; fromStatus: TaskStatus; toStatus: TaskStatus; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: TaskStatus }>> => {
    const { taskId, fromStatus, toStatus, notes } = input;

    const parsed = transitionTaskStatusSchema.safeParse({
      taskId,
      fromStatus,
      toStatus,
      notes,
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    // TOCTOU: re-read current status from DB
    const current = await db
      .select({ id: tasks.id, status: tasks.status, title: tasks.title, projectId: tasks.projectId })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), sql`${tasks.deletedAt} IS NULL`))
      .limit(1);

    if (!current[0]) {
      return err('Không tìm thấy công việc.');
    }

    const actualStatus = current[0].status as TaskStatus;

    if (actualStatus !== fromStatus) {
      return err(
        `Trạng thái hiện tại đã thay đổi thành "${actualStatus}". Vui lòng tải lại trang.`,
      );
    }

    const allowed = ALLOWED_TASK_TRANSITIONS[actualStatus];
    if (!allowed.includes(toStatus)) {
      return err(`Không thể chuyển từ "${actualStatus}" sang "${toStatus}".`);
    }

    // Atomic update with WHERE clause for TOCTOU safety
    const updated = await db
      .update(tasks)
      .set({
        status: toStatus,
        completedAt: toStatus === 'done' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'status_change',
      entityType: 'task',
      entityId: taskId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: toStatus },
      description: notes,
    });

    revalidatePath('/dashboard/tasks');
    revalidatePath(`/dashboard/tasks/${taskId}`);
    revalidatePath(`/dashboard/projects/${current[0].projectId}`);

    return ok({ newStatus: toStatus });
  },
);

// ── assignTask ───────────────────────────────────────────────────

export const assignTask = createAction(
  async (
    input: { taskId: string; assigneeId: string | null },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const { taskId, assigneeId } = input;

    const existing = await db
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, assigneeId: tasks.assigneeId })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), sql`${tasks.deletedAt} IS NULL`))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy công việc.');
    }

    await db
      .update(tasks)
      .set({ assigneeId, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await createAuditLog({
      userId,
      action: 'assign',
      entityType: 'task',
      entityId: taskId,
      entityName: existing[0].title,
      projectId: existing[0].projectId,
      oldValues: { assigneeId: existing[0].assigneeId },
      newValues: { assigneeId },
    });

    revalidatePath('/dashboard/tasks');
    revalidatePath(`/dashboard/tasks/${taskId}`);

    return ok(undefined as void);
  },
);

// ── deleteTask ───────────────────────────────────────────────────
// Soft delete: sets deletedAt timestamp.

export const deleteTask = createAction(
  async (input: { taskId: string }, userId: string): Promise<ActionResult<void>> => {
    const { taskId } = input;

    const existing = await db
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), sql`${tasks.deletedAt} IS NULL`))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy công việc.');
    }

    await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'task',
      entityId: taskId,
      entityName: existing[0].title,
      projectId: existing[0].projectId,
    });

    revalidatePath('/dashboard/tasks');
    revalidatePath(`/dashboard/projects/${existing[0].projectId}`);

    return ok(undefined as void);
  },
);
