import { z } from 'zod';
import { DocumentType, DocumentStatus, DocumentFilterSchema } from './types';
import { VALIDATION } from './constants';

// ── Upload Document Schema ──────────────────────────────────────
// Used when creating a new document (uploading for the first time).

export const uploadDocumentSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, 'Tiêu đề tài liệu là bắt buộc')
    .max(VALIDATION.TITLE_MAX, `Tiêu đề không được vượt quá ${VALIDATION.TITLE_MAX} ký tự`),
  description: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX, `Mô tả không được vượt quá ${VALIDATION.DESCRIPTION_MAX} ký tự`)
    .optional(),
  type: DocumentType.default('other'),
  status: DocumentStatus.default('draft'),
  projectId: z.string().uuid('ID dự án không hợp lệ').optional(),
  handoverId: z.string().uuid('ID bàn giao không hợp lệ').optional(),
  content: z.string().optional(),
  tags: z
    .array(z.string().max(VALIDATION.TAG_MAX_LENGTH))
    .max(VALIDATION.TAGS_MAX_COUNT)
    .default([]),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ── Update Document Metadata Schema ────────────────────────────
// All fields optional — only supplied fields are persisted.

const updateDocumentBase = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, 'Tiêu đề tài liệu là bắt buộc')
    .max(VALIDATION.TITLE_MAX, `Tiêu đề không được vượt quá ${VALIDATION.TITLE_MAX} ký tự`),
  description: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX, `Mô tả không được vượt quá ${VALIDATION.DESCRIPTION_MAX} ký tự`)
    .nullable(),
  type: DocumentType,
  status: DocumentStatus,
  projectId: z.string().uuid('ID dự án không hợp lệ').nullable(),
  handoverId: z.string().uuid('ID bàn giao không hợp lệ').nullable(),
  content: z.string().nullable(),
  tags: z.array(z.string().max(VALIDATION.TAG_MAX_LENGTH)).max(VALIDATION.TAGS_MAX_COUNT),
});

export const updateDocumentSchema = updateDocumentBase.partial();
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ── Create Version Schema ───────────────────────────────────────
// When uploading a new version of an existing document.

export const createVersionSchema = z.object({
  documentId: z.string().uuid('ID tài liệu không hợp lệ'),
  changeSummary: z
    .string()
    .max(VALIDATION.CHANGE_SUMMARY_MAX, `Tóm tắt thay đổi không được vượt quá ${VALIDATION.CHANGE_SUMMARY_MAX} ký tự`)
    .optional(),
  content: z.string().optional(),
});
export type CreateVersionInput = z.infer<typeof createVersionSchema>;

// ── Document Filters Schema ────────────────────────────────────
// Re-export from types.ts for co-location convenience.

export const documentFiltersSchema = DocumentFilterSchema;
export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;
