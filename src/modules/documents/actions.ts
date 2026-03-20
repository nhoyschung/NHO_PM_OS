'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { documents, documentVersions, auditLogs } from '@/db/schema';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  createVersionSchema,
} from './validation';
import type { DocumentFormData, DocumentUpdateData, DocumentVersionFormData } from './types';

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

// ── uploadDocument ───────────────────────────────────────────────
// Create a new document record (metadata only; file upload handled client-side).

export const uploadDocument = createAction(
  async (data: DocumentFormData, userId: string): Promise<ActionResult<{ id: string }>> => {
    const parsed = uploadDocumentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const [doc] = await db
      .insert(documents)
      .values({
        title: validated.title,
        description: validated.description ?? null,
        type: validated.type,
        status: validated.status,
        projectId: validated.projectId ?? null,
        handoverId: validated.handoverId ?? null,
        content: validated.content ?? null,
        currentVersion: 1,
        createdBy: userId,
        tags: validated.tags,
      })
      .returning();

    // Create initial version record (version 1)
    await db.insert(documentVersions).values({
      documentId: doc.id,
      versionNumber: 1,
      changeSummary: 'Phiên bản đầu tiên',
      content: validated.content ?? null,
      filePath: null,
      fileSize: null,
      createdBy: userId,
    });

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'document',
      entityId: doc.id,
      entityName: doc.title,
      projectId: validated.projectId,
      newValues: {
        title: validated.title,
        type: validated.type,
        status: validated.status,
      },
    });

    revalidatePath('/dashboard/documents');
    if (validated.projectId) {
      revalidatePath(`/dashboard/projects`);
    }

    return ok({ id: doc.id });
  },
);

// ── uploadNewVersion ─────────────────────────────────────────────
// Append a new version to an existing document.

export const uploadNewVersion = createAction(
  async (data: DocumentVersionFormData, userId: string): Promise<ActionResult<{ versionNumber: number }>> => {
    const parsed = createVersionSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    // Fetch existing document to get current version number
    const existing = await db
      .select({ id: documents.id, title: documents.title, currentVersion: documents.currentVersion, projectId: documents.projectId })
      .from(documents)
      .where(eq(documents.id, validated.documentId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy tài liệu.');
    }

    const nextVersion = existing[0].currentVersion + 1;

    await db.insert(documentVersions).values({
      documentId: validated.documentId,
      versionNumber: nextVersion,
      changeSummary: validated.changeSummary ?? null,
      content: validated.content ?? null,
      filePath: null,
      fileSize: null,
      createdBy: userId,
    });

    await db
      .update(documents)
      .set({ currentVersion: nextVersion, updatedAt: new Date() })
      .where(eq(documents.id, validated.documentId));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'document',
      entityId: validated.documentId,
      entityName: existing[0].title,
      projectId: existing[0].projectId ?? undefined,
      oldValues: { currentVersion: existing[0].currentVersion },
      newValues: { currentVersion: nextVersion },
      description: validated.changeSummary,
    });

    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${validated.documentId}`);

    return ok({ versionNumber: nextVersion });
  },
);

// ── updateDocumentMetadata ───────────────────────────────────────
// Partial update of document metadata fields.

export const updateDocumentMetadata = createAction(
  async (
    input: { documentId: string; data: DocumentUpdateData },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { documentId, data } = input;

    const parsed = updateDocumentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy tài liệu.');
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
      .update(documents)
      .set(updateFields)
      .where(eq(documents.id, documentId));

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'document',
      entityId: documentId,
      entityName: existing[0].title,
      projectId: existing[0].projectId ?? undefined,
      oldValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old])),
      newValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new])),
    });

    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${documentId}`);

    return ok({ id: existing[0].id });
  },
);

// ── deleteDocument ───────────────────────────────────────────────
// Soft delete: sets deletedAt, does not destroy data.

export const deleteDocument = createAction(
  async (input: { documentId: string }, userId: string): Promise<ActionResult<void>> => {
    const { documentId } = input;

    const existing = await db
      .select({ id: documents.id, title: documents.title, projectId: documents.projectId })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy tài liệu.');
    }

    await db
      .update(documents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'document',
      entityId: documentId,
      entityName: existing[0].title,
      projectId: existing[0].projectId ?? undefined,
    });

    revalidatePath('/dashboard/documents');

    return ok(undefined as void);
  },
);
