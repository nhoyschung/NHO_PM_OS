'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import {
  handovers,
  handoverChecklistItems,
  auditLogs,
} from '@/db/schema';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import {
  createHandoverSchema,
  updateHandoverSchema,
  transitionStatusSchema,
  approveHandoverSchema,
  checklistItemSchema,
} from './validation';
import { ALLOWED_TRANSITIONS } from './constants';
import type { HandoverFormData, HandoverStatus } from './types';

// ── Audit Log Helper ─────────────────────────────────────────────

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

// ════════════════════════════════════════════════════════════════════
// Server Actions — all wrapped with createAction (auth + error handling)
// ════════════════════════════════════════════════════════════════════

// ── createHandoverAction ────────────────────────────────────────

export const createHandoverAction = createAction(
  async (data: HandoverFormData, userId: string): Promise<ActionResult<{ id: string }>> => {
    const parsed = createHandoverSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const [handover] = await db
      .insert(handovers)
      .values({
        projectId: validated.projectId,
        title: validated.title,
        description: validated.description ?? null,
        type: validated.type,
        fromUserId: userId,
        toUserId: validated.toUserId,
        fromDepartmentId: validated.fromDepartmentId ?? null,
        toDepartmentId: validated.toDepartmentId ?? null,
        status: 'draft',
        fromStage: validated.fromStage ?? null,
        toStage: validated.toStage ?? null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        notes: validated.notes ?? null,
      })
      .returning();

    await createAuditLog({
      userId,
      action: 'handover_initiate',
      entityType: 'handover',
      entityId: handover.id,
      entityName: handover.title,
      projectId: validated.projectId,
      newValues: { title: validated.title, type: validated.type, status: 'draft' },
    });

    revalidatePath('/dashboard/handovers');
    return ok({ id: handover.id });
  },
);

// ── updateHandoverAction ────────────────────────────────────────

export const updateHandoverAction = createAction(
  async (
    input: { handoverId: string; data: Partial<HandoverFormData> },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { handoverId, data } = input;

    const parsed = updateHandoverSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const existing = await db
      .select()
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    // Only allow edits when status is draft
    if (existing[0].status !== 'draft') {
      return err('Chỉ có thể chỉnh sửa bàn giao ở trạng thái bản nháp.');
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

    await db
      .update(handovers)
      .set(updateFields)
      .where(eq(handovers.id, handoverId));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'handover',
      entityId: handoverId,
      entityName: existing[0].title,
      projectId: existing[0].projectId,
      oldValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old])),
      newValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new])),
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);

    return ok({ id: handoverId });
  },
);

// ── submitForApprovalAction ─────────────────────────────────────
// Transitions handover from draft to pending_review

export const submitForApprovalAction = createAction(
  async (
    input: { handoverId: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: HandoverStatus }>> => {
    const { handoverId, notes } = input;

    const current = await db
      .select()
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!current[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    const actualStatus = current[0].status as HandoverStatus;

    if (actualStatus !== 'draft') {
      return err('Chỉ có thể gửi đánh giá từ trạng thái bản nháp.');
    }

    const allowed = ALLOWED_TRANSITIONS[actualStatus];
    if (!allowed.includes('pending_review')) {
      return err('Không thể chuyển sang trạng thái chờ đánh giá.');
    }

    // Atomic update with status check
    const updated = await db
      .update(handovers)
      .set({ status: 'pending_review', updatedAt: new Date() })
      .where(and(eq(handovers.id, handoverId), eq(handovers.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'status_change',
      entityType: 'handover',
      entityId: handoverId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: 'pending_review' },
      description: notes,
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);

    return ok({ newStatus: 'pending_review' });
  },
);

// ── approveHandoverAction ───────────────────────────────────────

export const approveHandoverAction = createAction(
  async (
    input: { handoverId: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: HandoverStatus }>> => {
    const { handoverId, notes } = input;

    const parsed = approveHandoverSchema.safeParse({ handoverId, notes });
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const current = await db
      .select()
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!current[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    const actualStatus = current[0].status as HandoverStatus;

    if (actualStatus !== 'in_review') {
      return err('Chỉ có thể phê duyệt bàn giao ở trạng thái đang đánh giá.');
    }

    // Check that all required checklist items are completed
    const requiredItems = await db
      .select({ id: handoverChecklistItems.id, isCompleted: handoverChecklistItems.isCompleted })
      .from(handoverChecklistItems)
      .where(
        and(
          eq(handoverChecklistItems.handoverId, handoverId),
          eq(handoverChecklistItems.priority, 'required'),
        ),
      );

    const incompleteRequired = requiredItems.filter((item) => !item.isCompleted);
    if (incompleteRequired.length > 0) {
      return err(
        `Còn ${incompleteRequired.length} mục kiểm tra bắt buộc chưa hoàn thành.`,
      );
    }

    const updated = await db
      .update(handovers)
      .set({
        status: 'approved',
        approvedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(handovers.id, handoverId), eq(handovers.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'approve',
      entityType: 'handover',
      entityId: handoverId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: 'approved', approvedBy: userId },
      description: notes,
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);

    return ok({ newStatus: 'approved' });
  },
);

// ── rejectHandoverAction ────────────────────────────────────────

export const rejectHandoverAction = createAction(
  async (
    input: { handoverId: string; rejectionReason: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: HandoverStatus }>> => {
    const { handoverId, rejectionReason, notes } = input;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return err('Lý do từ chối là bắt buộc.');
    }

    const current = await db
      .select()
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!current[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    const actualStatus = current[0].status as HandoverStatus;

    if (actualStatus !== 'in_review') {
      return err('Chỉ có thể từ chối bàn giao ở trạng thái đang đánh giá.');
    }

    const updated = await db
      .update(handovers)
      .set({
        status: 'rejected',
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(and(eq(handovers.id, handoverId), eq(handovers.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'reject',
      entityType: 'handover',
      entityId: handoverId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: 'rejected', rejectionReason },
      description: notes,
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);

    return ok({ newStatus: 'rejected' });
  },
);

// ── startReviewAction ─────────────────────────────────────────
// Transitions pending_review → in_review

export const startReviewAction = createAction(
  async (
    input: { handoverId: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: HandoverStatus }>> => {
    const { handoverId, notes } = input;

    const current = await db
      .select({ id: handovers.id, title: handovers.title, status: handovers.status, projectId: handovers.projectId })
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!current[0]) return err('Không tìm thấy bàn giao.');

    const actualStatus = current[0].status as HandoverStatus;
    if (actualStatus !== 'pending_review') {
      return err('Chỉ có thể bắt đầu đánh giá từ trạng thái chờ đánh giá.');
    }

    const allowed = ALLOWED_TRANSITIONS[actualStatus];
    if (!allowed.includes('in_review')) {
      return err('Chuyển trạng thái không hợp lệ.');
    }

    const updated = await db
      .update(handovers)
      .set({ status: 'in_review', updatedAt: new Date() })
      .where(and(eq(handovers.id, handoverId), eq(handovers.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'status_change',
      entityType: 'handover',
      entityId: handoverId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: 'in_review' },
      description: notes,
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);
    return ok({ newStatus: 'in_review' as HandoverStatus });
  },
);

// ── completeHandoverAction ────────────────────────────────────
// Transitions approved → completed

export const completeHandoverAction = createAction(
  async (
    input: { handoverId: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStatus: HandoverStatus }>> => {
    const { handoverId, notes } = input;

    const current = await db
      .select({ id: handovers.id, title: handovers.title, status: handovers.status, projectId: handovers.projectId })
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!current[0]) return err('Không tìm thấy bàn giao.');

    const actualStatus = current[0].status as HandoverStatus;
    if (actualStatus !== 'approved') {
      return err('Chỉ có thể hoàn thành bàn giao đã được phê duyệt.');
    }

    const updated = await db
      .update(handovers)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(handovers.id, handoverId), eq(handovers.status, actualStatus)))
      .returning();

    if (updated.length === 0) {
      return err('Trạng thái đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    await createAuditLog({
      userId,
      action: 'status_change',
      entityType: 'handover',
      entityId: handoverId,
      entityName: current[0].title,
      projectId: current[0].projectId,
      oldValues: { status: actualStatus },
      newValues: { status: 'completed' },
      description: notes,
    });

    revalidatePath('/dashboard/handovers');
    revalidatePath(`/dashboard/handovers/${handoverId}`);
    return ok({ newStatus: 'completed' as HandoverStatus });
  },
);

// ── deleteHandoverAction ──────────────────────────────────────
// Soft delete: sets status to cancelled

export const deleteHandoverAction = createAction(
  async (
    input: { handoverId: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const { handoverId } = input;

    const existing = await db
      .select({ id: handovers.id, title: handovers.title, status: handovers.status, projectId: handovers.projectId })
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!existing[0]) return err('Không tìm thấy bàn giao.');

    const status = existing[0].status as HandoverStatus;
    if (status === 'completed' || status === 'cancelled') {
      return err('Không thể xoá bàn giao đã hoàn thành hoặc đã hủy.');
    }

    await db
      .update(handovers)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(handovers.id, handoverId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'handover',
      entityId: handoverId,
      entityName: existing[0].title,
      projectId: existing[0].projectId,
    });

    revalidatePath('/dashboard/handovers');
    return ok(undefined as void);
  },
);

// ── addChecklistItemAction ──────────────────────────────────────

export const addChecklistItemAction = createAction(
  async (
    input: { handoverId: string; data: { title: string; description?: string; category?: string; priority?: string; sortOrder?: number; requiresEvidence?: boolean } },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { handoverId, data } = input;

    const parsed = checklistItemSchema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const handover = await db
      .select({ id: handovers.id, title: handovers.title, status: handovers.status, projectId: handovers.projectId })
      .from(handovers)
      .where(eq(handovers.id, handoverId))
      .limit(1);

    if (!handover[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    if (handover[0].status === 'completed' || handover[0].status === 'cancelled') {
      return err('Không thể thêm mục kiểm tra cho bàn giao đã hoàn thành hoặc đã hủy.');
    }

    const validated = parsed.data;

    const [item] = await db
      .insert(handoverChecklistItems)
      .values({
        handoverId,
        title: validated.title,
        description: validated.description ?? null,
        category: validated.category,
        priority: validated.priority,
        sortOrder: validated.sortOrder,
        requiresEvidence: validated.requiresEvidence,
      })
      .returning();

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'handover',
      entityId: handoverId,
      entityName: handover[0].title,
      projectId: handover[0].projectId,
      newValues: { checklistItemId: item.id, title: validated.title },
      description: `Thêm mục kiểm tra: ${validated.title}`,
    });

    revalidatePath(`/dashboard/handovers/${handoverId}`);
    return ok({ id: item.id });
  },
);

// ── toggleChecklistItemAction ───────────────────────────────────

export const toggleChecklistItemAction = createAction(
  async (
    input: { itemId: string; isCompleted: boolean; evidenceUrl?: string; evidenceNotes?: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const { itemId, isCompleted, evidenceUrl, evidenceNotes } = input;

    const item = await db
      .select()
      .from(handoverChecklistItems)
      .where(eq(handoverChecklistItems.id, itemId))
      .limit(1);

    if (!item[0]) {
      return err('Không tìm thấy mục kiểm tra.');
    }

    const handover = await db
      .select({ id: handovers.id, title: handovers.title, status: handovers.status, projectId: handovers.projectId })
      .from(handovers)
      .where(eq(handovers.id, item[0].handoverId))
      .limit(1);

    if (!handover[0]) {
      return err('Không tìm thấy bàn giao.');
    }

    if (handover[0].status === 'completed' || handover[0].status === 'cancelled') {
      return err('Không thể cập nhật mục kiểm tra cho bàn giao đã hoàn thành hoặc đã hủy.');
    }

    // If requires evidence and completing, check evidence is provided
    if (isCompleted && item[0].requiresEvidence && !evidenceUrl && !evidenceNotes) {
      return err('Mục kiểm tra này yêu cầu bằng chứng xác minh.');
    }

    await db
      .update(handoverChecklistItems)
      .set({
        isCompleted,
        completedBy: isCompleted ? userId : null,
        completedAt: isCompleted ? new Date() : null,
        evidenceUrl: evidenceUrl ?? item[0].evidenceUrl,
        evidenceNotes: evidenceNotes ?? item[0].evidenceNotes,
        updatedAt: new Date(),
      })
      .where(eq(handoverChecklistItems.id, itemId));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'handover',
      entityId: handover[0].id,
      entityName: handover[0].title,
      projectId: handover[0].projectId,
      oldValues: { checklistItemId: itemId, isCompleted: item[0].isCompleted },
      newValues: { checklistItemId: itemId, isCompleted },
      description: `${isCompleted ? 'Hoàn thành' : 'Bỏ hoàn thành'} mục: ${item[0].title}`,
    });

    revalidatePath(`/dashboard/handovers/${item[0].handoverId}`);
    return ok(undefined as void);
  },
);
