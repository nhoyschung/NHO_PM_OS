'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import {
  projects,
  projectMembers,
  projectStageHistory,
  auditLogs,
} from '@/db/schema';
import { createAction, ok, err, type ActionResult } from '@/lib/action';
import { createProjectSchema, updateProjectSchema, transitionStageSchema } from './validation';
import { ALLOWED_TRANSITIONS, TRANSITION_META, PROJECT_CODE_PREFIX } from './constants';
import type { ProjectFormData, ProjectStage, ProjectMemberRole } from './types';

// ── Audit Log Helper ─────────────────────────────────────────────
// Inserts an immutable audit trail record for every mutation.

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

// ── Slug Generator ───────────────────────────────────────────────
// Converts project name to URL-friendly slug with collision avoidance.

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/đ/g, 'd') // Vietnamese đ before NFD
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = toSlug(name);
  const existing = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(sql`${projects.slug} = ${base} OR ${projects.slug} LIKE ${base + '-%'}`)
    .limit(100);

  if (existing.length === 0) return base;

  const slugs = new Set(existing.map((r) => r.slug));
  let counter = 1;
  while (slugs.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

// ── Project Code Generator ───────────────────────────────────────
// Generates sequential codes: PRJ-001, PRJ-002, etc.

async function generateProjectCode(): Promise<string> {
  const result = await db
    .select({ maxCode: sql<string>`MAX(${projects.code})` })
    .from(projects);

  const maxCode = result[0]?.maxCode;
  if (!maxCode) return `${PROJECT_CODE_PREFIX}-001`;

  const numericPart = maxCode.replace(`${PROJECT_CODE_PREFIX}-`, '');
  const nextNumber = parseInt(numericPart, 10) + 1;
  return `${PROJECT_CODE_PREFIX}-${String(nextNumber).padStart(3, '0')}`;
}

// ── Transition Direction ─────────────────────────────────────────

const STAGE_ORDER: Record<ProjectStage, number> = {
  initiation: 0,
  planning: 1,
  in_progress: 2,
  review: 3,
  testing: 4,
  staging: 5,
  deployment: 6,
  monitoring: 7,
  handover: 8,
  completed: 9,
};

function getTransitionDirection(from: ProjectStage, to: ProjectStage): 'forward' | 'backward' {
  return STAGE_ORDER[to] > STAGE_ORDER[from] ? 'forward' : 'backward';
}

// ════════════════════════════════════════════════════════════════════
// Server Actions — all wrapped with createAction (auth + error handling)
// ════════════════════════════════════════════════════════════════════

// ── createProjectAction ──────────────────────────────────────────

export const createProjectAction = createAction(
  async (data: ProjectFormData, userId: string): Promise<ActionResult<{ slug: string }>> => {
    const parsed = createProjectSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const [code, slug] = await Promise.all([
      generateProjectCode(),
      generateUniqueSlug(validated.name),
    ]);

    const [project] = await db
      .insert(projects)
      .values({
        name: validated.name,
        code,
        slug,
        description: validated.description ?? null,
        category: validated.category ?? null,
        priority: validated.priority,
        province: validated.province ?? null,
        district: validated.district ?? null,
        stage: 'initiation',
        managerId: userId,
        createdById: userId,
        departmentId: validated.departmentId ?? null,
        teamLeadId: validated.teamLeadId ?? null,
        startDate: validated.startDate ?? null,
        endDate: validated.endDate ?? null,
        budget: validated.budget ?? null,
        currency: validated.currency,
        tags: validated.tags,
      })
      .returning();

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: 'owner',
    });

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'project',
      entityId: project.id,
      entityName: project.name,
      projectId: project.id,
      newValues: { name: validated.name, code, priority: validated.priority, stage: 'initiation' },
    });

    revalidatePath('/dashboard/projects');
    return ok({ slug: project.slug });
  },
);

// ── updateProjectAction ──────────────────────────────────────────

export const updateProjectAction = createAction(
  async (
    input: { projectId: string; data: Partial<ProjectFormData> },
    userId: string,
  ): Promise<ActionResult<{ id: string; slug: string }>> => {
    const { projectId, data } = input;

    const parsed = updateProjectSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    const validated = parsed.data;

    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy dự án.');
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
      return ok({ id: existing[0].id, slug: existing[0].slug });
    }

    if (updateFields.name) {
      updateFields.slug = await generateUniqueSlug(updateFields.name as string);
    }

    updateFields.updatedAt = new Date();

    const [updated] = await db
      .update(projects)
      .set(updateFields)
      .where(eq(projects.id, projectId))
      .returning();

    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'project',
      entityId: projectId,
      entityName: updated.name,
      projectId,
      oldValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old])),
      newValues: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new])),
    });

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${updated.slug}`);

    return ok({ id: updated.id, slug: updated.slug });
  },
);

// ── transitionStageAction ────────────────────────────────────────
// TOCTOU: re-reads DB FIRST, then validates against actual state.

export const transitionStageAction = createAction(
  async (
    input: { projectId: string; fromStage: ProjectStage; targetStage: ProjectStage; notes?: string },
    userId: string,
  ): Promise<ActionResult<{ newStage: ProjectStage }>> => {
    const { projectId, fromStage, targetStage, notes } = input;

    // Validate input schema
    const parsed = transitionStageSchema.safeParse({
      projectId,
      fromStage,
      toStage: targetStage,
      notes,
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError?.message ?? 'Dữ liệu không hợp lệ.');
    }

    // TOCTOU: re-read current stage from DB FIRST
    const current = await db
      .select({ id: projects.id, stage: projects.stage, name: projects.name, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!current[0]) {
      return err('Không tìm thấy dự án.');
    }

    const actualStage = current[0].stage as ProjectStage;

    if (actualStage !== fromStage) {
      return err(
        `Giai đoạn hiện tại đã thay đổi thành "${actualStage}". Vui lòng tải lại trang.`,
      );
    }

    // Validate against ACTUAL DB stage (not user-supplied)
    const allowed = ALLOWED_TRANSITIONS[actualStage];
    if (!allowed.includes(targetStage)) {
      return err(`Không thể chuyển từ "${actualStage}" sang "${targetStage}".`);
    }

    // Check role permission using actual stage
    const transitionKey = `${actualStage}->${targetStage}`;
    const meta = TRANSITION_META[transitionKey];

    // Atomic update: WHERE includes stage check for true TOCTOU safety
    const updated = await db
      .update(projects)
      .set({ stage: targetStage, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.stage, actualStage)))
      .returning();

    if (updated.length === 0) {
      return err('Giai đoạn đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    const direction = getTransitionDirection(actualStage, targetStage);
    const trigger = meta?.trigger ?? `${actualStage}_to_${targetStage}`;

    await db.insert(projectStageHistory).values({
      projectId,
      fromStage: actualStage,
      toStage: targetStage,
      direction,
      trigger,
      triggeredBy: userId,
      notes: notes ?? null,
    });

    await createAuditLog({
      userId,
      action: 'stage_change',
      entityType: 'project',
      entityId: projectId,
      entityName: current[0].name,
      projectId,
      oldValues: { stage: actualStage },
      newValues: { stage: targetStage },
      description: notes,
    });

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${current[0].slug}`);

    return ok({ newStage: targetStage });
  },
);

// ── deleteProjectAction ──────────────────────────────────────────
// Soft delete: sets isArchived=true AND deletedAt, no data destruction.

export const deleteProjectAction = createAction(
  async (input: { projectId: string }, userId: string): Promise<ActionResult<void>> => {
    const { projectId } = input;

    const existing = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existing[0]) {
      return err('Không tìm thấy dự án.');
    }

    await db
      .update(projects)
      .set({
        isArchived: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    await createAuditLog({
      userId,
      action: 'delete',
      entityType: 'project',
      entityId: projectId,
      entityName: existing[0].name,
      projectId,
    });

    revalidatePath('/dashboard/projects');
    return ok(undefined as void);
  },
);

// ── addProjectMemberAction ───────────────────────────────────────

export const addProjectMemberAction = createAction(
  async (
    input: { projectId: string; targetUserId: string; role?: ProjectMemberRole },
    userId: string,
  ): Promise<ActionResult<{ id: string }>> => {
    const { projectId, targetUserId, role = 'member' } = input;

    const project = await db
      .select({ id: projects.id, name: projects.name, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project[0]) {
      return err('Không tìm thấy dự án.');
    }

    const existingMember = await db
      .select({ id: projectMembers.id, isActive: projectMembers.isActive })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, targetUserId),
        ),
      )
      .limit(1);

    if (existingMember[0]?.isActive) {
      return err('Thành viên đã tồn tại trong dự án.');
    }

    let memberId: string;

    if (existingMember[0] && !existingMember[0].isActive) {
      const [reactivated] = await db
        .update(projectMembers)
        .set({ isActive: true, role, removedAt: null, joinedAt: new Date() })
        .where(eq(projectMembers.id, existingMember[0].id))
        .returning();
      memberId = reactivated.id;
    } else {
      const [newMember] = await db
        .insert(projectMembers)
        .values({ projectId, userId: targetUserId, role })
        .returning();
      memberId = newMember.id;
    }

    await createAuditLog({
      userId,
      action: 'assign',
      entityType: 'project',
      entityId: projectId,
      entityName: project[0].name,
      projectId,
      newValues: { memberId: targetUserId, role },
    });

    revalidatePath(`/dashboard/projects/${project[0].slug}`);
    return ok({ id: memberId });
  },
);

// ── removeProjectMemberAction ────────────────────────────────────

export const removeProjectMemberAction = createAction(
  async (
    input: { projectId: string; targetUserId: string },
    userId: string,
  ): Promise<ActionResult<void>> => {
    const { projectId, targetUserId } = input;

    const project = await db
      .select({ id: projects.id, name: projects.name, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project[0]) {
      return err('Không tìm thấy dự án.');
    }

    const member = await db
      .select({ id: projectMembers.id, role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, targetUserId),
          eq(projectMembers.isActive, true),
        ),
      )
      .limit(1);

    if (!member[0]) {
      return err('Thành viên không tồn tại trong dự án.');
    }

    if (member[0].role === 'owner') {
      return err('Không thể xoá chủ sở hữu dự án.');
    }

    await db
      .update(projectMembers)
      .set({ isActive: false, removedAt: new Date() })
      .where(eq(projectMembers.id, member[0].id));

    await createAuditLog({
      userId,
      action: 'unassign',
      entityType: 'project',
      entityId: projectId,
      entityName: project[0].name,
      projectId,
      oldValues: { memberId: targetUserId, role: member[0].role },
    });

    revalidatePath(`/dashboard/projects/${project[0].slug}`);
    return ok(undefined as void);
  },
);
