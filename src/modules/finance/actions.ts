'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { financialRecords } from '@/db/schema/operations';
import { auditLogs } from '@/db/schema/operations';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import {
  createFinanceRecordSchema,
  updateFinanceRecordSchema,
  approveFinanceRecordSchema,
  rejectFinanceRecordSchema,
  csvRowSchema,
} from './validation';
import type { FinanceFormData, FinanceUpdateData, CsvImportResult } from './types';

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
    entityType: 'project', // closest entity type — 'finance' not in enum; use project context
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

// ── createFinanceRecord ──────────────────────────────────────────

export const createFinanceRecord = createAction(
  async (data: FinanceFormData, userId: string): Promise<ActionResult<{ id: string }>> => {
    const parsed = createFinanceRecordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const [record] = await db
      .insert(financialRecords)
      .values({
        projectId: validated.projectId,
        type: validated.type,
        category: validated.category,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description,
        referenceNumber: validated.referenceNumber ?? null,
        transactionDate: validated.transactionDate,
        status: 'pending',
        createdBy: userId,
      })
      .returning();

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'project',
      entityId: record.id,
      entityName: validated.description,
      projectId: validated.projectId,
      newValues: {
        type: validated.type,
        amount: validated.amount,
        status: 'pending',
      },
    });

    revalidatePath('/finance');
    return ok({ id: record.id });
  },
);

// ── updateFinanceRecord ──────────────────────────────────────────

export const updateFinanceRecord = createAction(
  async (
    input: { recordId: string; data: FinanceUpdateData },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { recordId, data } = input;

    const parsed = updateFinanceRecordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const existing = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.id, recordId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy bản ghi tài chính.');
    }

    if (existing[0].status !== 'pending') {
      return err('Chỉ có thể chỉnh sửa bản ghi ở trạng thái chờ duyệt.');
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
      return ok({ id: recordId });
    }

    updateFields.updatedAt = new Date();

    await db
      .update(financialRecords)
      .set(updateFields)
      .where(eq(financialRecords.id, recordId));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'project',
      entityId: recordId,
      entityName: existing[0].description,
      projectId: existing[0].projectId,
      oldValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old])),
      newValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new])),
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${recordId}`);
    return ok({ id: recordId });
  },
);

// ── approveFinanceRecord ─────────────────────────────────────────

export const approveFinanceRecord = createAction(
  async (
    input: { recordId: string; notes?: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const parsed = approveFinanceRecordSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const existing = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.id, input.recordId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy bản ghi tài chính.');
    }

    if (existing[0].status !== 'pending') {
      return err('Chỉ có thể duyệt bản ghi ở trạng thái chờ duyệt.');
    }

    await db
      .update(financialRecords)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(financialRecords.id, input.recordId));

    await createAuditLog({
      userId,
      action: 'approve',
      entityType: 'project',
      entityId: input.recordId,
      entityName: existing[0].description,
      projectId: existing[0].projectId,
      oldValues: { status: 'pending' },
      newValues: { status: 'approved' },
      description: input.notes,
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${input.recordId}`);
    return ok(undefined as void);
  },
);

// ── rejectFinanceRecord ──────────────────────────────────────────

export const rejectFinanceRecord = createAction(
  async (
    input: { recordId: string; reason: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const parsed = rejectFinanceRecordSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const existing = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.id, input.recordId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy bản ghi tài chính.');
    }

    if (existing[0].status !== 'pending') {
      return err('Chỉ có thể từ chối bản ghi ở trạng thái chờ duyệt.');
    }

    await db
      .update(financialRecords)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(financialRecords.id, input.recordId));

    await createAuditLog({
      userId,
      action: 'reject',
      entityType: 'project',
      entityId: input.recordId,
      entityName: existing[0].description,
      projectId: existing[0].projectId,
      oldValues: { status: 'pending' },
      newValues: { status: 'rejected' },
      description: input.reason,
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${input.recordId}`);
    return ok(undefined as void);
  },
);

// ── importCsv ────────────────────────────────────────────────────

export const importCsv = createAction(
  async (
    input: { rows: Record<string, unknown>[] },
    userId: string,
  ): Promise<ActionResult<CsvImportResult>> => {
    const { rows } = input;
    const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed, +1 for header row
      const parsed = csvRowSchema.safeParse(rows[i]);

      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        result.errors.push({
          row: rowNum,
          message: firstError?.message ?? 'Dữ liệu không hợp lệ',
        });
        result.skipped++;
        continue;
      }

      const validated = parsed.data;

      try {
        await db.insert(financialRecords).values({
          projectId: validated.project_id,
          type: validated.type,
          category: validated.category,
          amount: validated.amount,
          currency: validated.currency,
          description: validated.description,
          referenceNumber: validated.reference_number ?? null,
          transactionDate: validated.transaction_date,
          status: 'pending',
          createdBy: userId,
        });
        result.imported++;
      } catch {
        result.errors.push({
          row: rowNum,
          message: 'Lỗi khi lưu dữ liệu vào cơ sở dữ liệu',
        });
        result.skipped++;
      }
    }

    if (result.imported > 0) {
      await createAuditLog({
        userId,
        action: 'import',
        entityType: 'project',
        entityId: userId, // no single entity for bulk import
        entityName: 'CSV Import',
        newValues: { imported: result.imported, skipped: result.skipped },
      });

      revalidatePath('/finance');
    }

    return ok(result);
  },
);

// ── deleteFinanceRecord ──────────────────────────────────────────

export const deleteFinanceRecord = createAction(
  async (input: { recordId: string }, userId: string): Promise<ActionResult<void>> => {
    const { recordId } = input;

    const existing = await db
      .select({ id: financialRecords.id, description: financialRecords.description, projectId: financialRecords.projectId, status: financialRecords.status })
      .from(financialRecords)
      .where(eq(financialRecords.id, recordId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy bản ghi tài chính.');
    }

    if (existing[0].status === 'approved' || existing[0].status === 'processed') {
      return err('Không thể xóa bản ghi đã được duyệt hoặc đã xử lý.');
    }

    await db.delete(financialRecords).where(eq(financialRecords.id, recordId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'project',
      entityId: recordId,
      entityName: existing[0].description,
      projectId: existing[0].projectId,
      oldValues: { status: existing[0].status },
    });

    revalidatePath('/finance');
    return ok(undefined as void);
  },
);
