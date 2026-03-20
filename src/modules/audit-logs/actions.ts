'use server';

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import { createAuditLogSchema } from './validation';
import type { CreateAuditLogInput } from './validation';

// ── APPEND-ONLY enforcement ───────────────────────────────────────
// Audit logs are IMMUTABLE. Only createAuditLog is exported.
// NO update or delete actions exist by design.

// ── createAuditLogAction ──────────────────────────────────────────
// Shared helper exposed as a server action for external callers.
// Internal use: call createAuditLog() directly from other actions.ts files.

export const createAuditLogAction = createAction(
  async (
    data: CreateAuditLogInput,
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createAuditLogSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const [log] = await db
      .insert(auditLogs)
      .values({
        userId: validated.userId ?? userId,
        userEmail: validated.userEmail ?? null,
        userRole: validated.userRole ?? null,
        action: validated.action,
        entityType: validated.entityType,
        entityId: validated.entityId ?? null,
        entityName: validated.entityName ?? null,
        projectId: validated.projectId ?? null,
        oldValues: validated.oldValues ?? null,
        newValues: validated.newValues ?? null,
        description: validated.description ?? null,
        ipAddress: validated.ipAddress ?? null,
        userAgent: validated.userAgent ?? null,
        requestId: validated.requestId ?? null,
        severity: validated.severity,
      })
      .returning({ id: auditLogs.id });

    return ok({ id: log.id });
  },
);

// ── createAuditLog (direct helper for other actions.ts files) ─────
// This is NOT a server action. Import and call directly within action files.

export async function createAuditLog(params: {
  userId: string;
  userEmail?: string;
  userRole?: string;
  action: (typeof auditLogs.$inferInsert)['action'];
  entityType: (typeof auditLogs.$inferInsert)['entityType'];
  entityId?: string;
  entityName?: string;
  projectId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  severity?: (typeof auditLogs.$inferInsert)['severity'];
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: params.userId,
    userEmail: params.userEmail ?? null,
    userRole: params.userRole ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    entityName: params.entityName ?? null,
    projectId: params.projectId ?? null,
    oldValues: params.oldValues ?? null,
    newValues: params.newValues ?? null,
    description: params.description ?? null,
    severity: params.severity ?? 'info',
  });
}
