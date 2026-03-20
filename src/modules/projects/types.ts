import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type {
  projects,
  projectMembers,
  handovers,
  documents,
  projectStageHistory,
} from '@/db/schema/core';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────
// Source: ref-state-machine.md Section 1, ref-schema-core.md Section 1

export const ProjectStage = z.enum([
  'initiation',
  'planning',
  'in_progress',
  'review',
  'testing',
  'staging',
  'deployment',
  'monitoring',
  'handover',
  'completed',
]);
export type ProjectStage = z.infer<typeof ProjectStage>;

export const ProjectPriority = z.enum(['critical', 'high', 'medium', 'low']);
export type ProjectPriority = z.infer<typeof ProjectPriority>;

export const HealthStatus = z.enum(['on_track', 'at_risk', 'delayed', 'blocked']);
export type HealthStatus = z.infer<typeof HealthStatus>;

export const ProjectMemberRole = z.enum(['owner', 'lead', 'member', 'reviewer', 'observer']);
export type ProjectMemberRole = z.infer<typeof ProjectMemberRole>;

// ── DB Row Types (inferred from Drizzle schema) ──────────────────

export type ProjectRow = InferSelectModel<typeof projects>;
export type ProjectMemberRow = InferSelectModel<typeof projectMembers>;
export type HandoverRow = InferSelectModel<typeof handovers>;
export type DocumentRow = InferSelectModel<typeof documents>;
export type StageHistoryRow = InferSelectModel<typeof projectStageHistory>;

// ── Project List Item (subset for list views) ─────────────────────
// Lightweight type used in ProjectList, ProjectCard components

export interface ProjectListItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  category: string | null;
  priority: ProjectPriority;
  stage: ProjectStage;
  province: string | null;
  healthStatus: string | null;
  progressPercentage: number | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  budgetSpent: number | null;
  currency: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  managerName: string | null;
  departmentName: string | null;
  memberCount: number;
}

// ── Project Detail (full entity with relations) ───────────────────
// Used in ProjectDetail, ProjectForm for detail views

export interface ProjectDetail extends ProjectRow {
  manager: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  teamLead: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  createdBy: { id: string; fullName: string | null; email: string } | null;
  department: { id: string; name: string; code: string } | null;
  members: Array<{
    id: string;
    userId: string;
    role: ProjectMemberRole;
    isActive: boolean;
    joinedAt: Date;
    user: { id: string; fullName: string | null; email: string; avatarUrl: string | null };
  }>;
  handovers: HandoverRow[];
  documents: DocumentRow[];
  stageHistory: StageHistoryRow[];
  _count: {
    tasks: number;
    handovers: number;
    documents: number;
  };
}

// ── Project Form Data ─────────────────────────────────────────────
// Source: ref-schema-core.md Section 9 — CreateProjectSchema / UpdateProjectSchema

export const ProjectFormSchema = z.object({
  name: z.string().min(3, 'Tên dự án phải có ít nhất 3 ký tự').max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  priority: ProjectPriority.default('medium'),
  province: z.string().optional(),
  district: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  teamLeadId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  budget: z.number().int().min(0).optional(),
  currency: z.string().length(3).default('VND'),
  tags: z.array(z.string()).default([]),
});
export type ProjectFormData = z.infer<typeof ProjectFormSchema>;

export const ProjectUpdateSchema = ProjectFormSchema.partial();
export type ProjectUpdateData = z.infer<typeof ProjectUpdateSchema>;

// ── Stage Transition ──────────────────────────────────────────────
// Source: ref-state-machine.md Section 3

export interface StageTransition {
  projectId: string;
  fromStage: ProjectStage;
  toStage: ProjectStage;
  trigger: string;
  triggeredBy: string;
  notes?: string;
}

export const StageTransitionInputSchema = z.object({
  projectId: z.string().uuid(),
  targetStage: ProjectStage,
  notes: z.string().max(1000).optional(),
});
export type StageTransitionInput = z.infer<typeof StageTransitionInputSchema>;

// ── Project Filters ───────────────────────────────────────────────
// Source: ref-golden-module.md Section 3.1 — ProjectFilterSchema

export const SortableColumns = z.enum([
  'name',
  'code',
  'created_at',
  'updated_at',
  'priority',
  'stage',
  'progress_percentage',
]);
export type SortableColumn = z.infer<typeof SortableColumns>;

export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrder>;

export const ProjectFilterSchema = z.object({
  search: z.string().optional(),
  stage: ProjectStage.optional(),
  priority: ProjectPriority.optional(),
  healthStatus: HealthStatus.optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  province: z.string().optional(),
  isArchived: z.boolean().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: SortableColumns.default('updated_at'),
  sortOrder: SortOrder.default('desc'),
});
export type ProjectFilters = z.infer<typeof ProjectFilterSchema>;

// ── Paginated Result ──────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
