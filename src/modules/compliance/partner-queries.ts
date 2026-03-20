import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { projects, projectMembers } from '@/db/schema';
import type { ProjectListItem } from '@/modules/projects/types';

// ── getProjectsByMember ─────────────────────────────────────────────
// Returns projects where the given user is an active member.
// Used by partner portal — read-only, no mutations.

export async function getProjectsByMember(userId: string): Promise<ProjectListItem[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      code: projects.code,
      slug: projects.slug,
      category: projects.category,
      priority: projects.priority,
      stage: projects.stage,
      province: projects.province,
      healthStatus: projects.healthStatus,
      progressPercentage: projects.progressPercentage,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      budgetSpent: projects.budgetSpent,
      currency: projects.currency,
      isArchived: projects.isArchived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
        eq(projectMembers.isActive, true),
      ),
    )
    .where(eq(projects.isArchived, false));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    slug: row.slug,
    category: row.category,
    priority: row.priority as ProjectListItem['priority'],
    stage: row.stage as ProjectListItem['stage'],
    province: row.province,
    healthStatus: row.healthStatus,
    progressPercentage: row.progressPercentage,
    startDate: row.startDate,
    endDate: row.endDate,
    budget: row.budget,
    budgetSpent: row.budgetSpent,
    currency: row.currency,
    isArchived: row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    managerName: null,
    departmentName: null,
    memberCount: 0,
  }));
}

// ── isProjectMember ─────────────────────────────────────────────────
// Check if a user is an active member of a project.

export async function isProjectMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.isActive, true),
      ),
    )
    .limit(1);

  return result.length > 0;
}
