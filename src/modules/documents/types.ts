import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { documents, documentVersions } from '@/db/schema/core';

// ── Enum Zod Schemas (SOT — values match enums.ts) ──────────────
// Source: ref-schema-core.md Section 5, ref-ux-vietnam.md Sections 9-10

export const DocumentType = z.enum([
  'requirement',
  'design',
  'technical',
  'test_plan',
  'user_guide',
  'handover',
  'report',
  'meeting_notes',
  'other',
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const DocumentStatus = z.enum([
  'draft',
  'review',
  'approved',
  'archived',
  'obsolete',
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

// ── DB Row Types (inferred from Drizzle schema) ──────────────────

export type DocumentRow = InferSelectModel<typeof documents>;
export type DocumentVersionRow = InferSelectModel<typeof documentVersions>;

// ── Document List Item (subset for list views) ────────────────────

export interface DocumentListItem {
  id: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  currentVersion: number;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  projectId: string | null;
  handoverId: string | null;
  createdBy: string;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  createdByName: string | null;
  projectName: string | null;
}

// ── Document Detail (full entity with relations) ───────────────────

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  changeSummary: string | null;
  content: string | null;
  filePath: string | null;
  fileSize: number | null;
  createdBy: string;
  createdAt: Date;
  createdByName: string | null;
}

export interface DocumentDetail extends DocumentRow {
  createdByUser: { id: string; fullName: string | null; email: string } | null;
  project: { id: string; name: string; code: string; slug: string } | null;
  handover: { id: string; title: string } | null;
  versions: DocumentVersion[];
  _count: {
    versions: number;
  };
}

// ── Document Form Data ─────────────────────────────────────────────

export const DocumentFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(300),
  description: z.string().max(2000).optional(),
  type: DocumentType.default('other'),
  status: DocumentStatus.default('draft'),
  projectId: z.string().uuid().optional(),
  handoverId: z.string().uuid().optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});
export type DocumentFormData = z.infer<typeof DocumentFormSchema>;

export const DocumentUpdateSchema = DocumentFormSchema.partial();
export type DocumentUpdateData = z.infer<typeof DocumentUpdateSchema>;

// ── Document Version Form ─────────────────────────────────────────

export const DocumentVersionFormSchema = z.object({
  documentId: z.string().uuid(),
  changeSummary: z.string().max(500).optional(),
  content: z.string().optional(),
});
export type DocumentVersionFormData = z.infer<typeof DocumentVersionFormSchema>;

// ── Document Filters ───────────────────────────────────────────────

export const DocumentSortableColumns = z.enum([
  'title',
  'created_at',
  'updated_at',
  'type',
  'status',
  'current_version',
]);
export type DocumentSortableColumn = z.infer<typeof DocumentSortableColumns>;

export const DocumentSortOrder = z.enum(['asc', 'desc']);
export type DocumentSortOrder = z.infer<typeof DocumentSortOrder>;

export const DocumentFilterSchema = z.object({
  search: z.string().optional(),
  type: DocumentType.optional(),
  status: DocumentStatus.optional(),
  projectId: z.string().uuid().optional(),
  handoverId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sortBy: DocumentSortableColumns.default('updated_at'),
  sortOrder: DocumentSortOrder.default('desc'),
});
export type DocumentFilters = z.infer<typeof DocumentFilterSchema>;

// ── Paginated Result ──────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
