import { describe, it, expect } from 'vitest';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  createVersionSchema,
  documentFiltersSchema,
} from '@/modules/documents/validation';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_TYPE_ICONS,
  VALIDATION,
  PERMISSIONS,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
} from '@/modules/documents/constants';
import {
  DocumentType,
  DocumentStatus,
  DocumentFilterSchema,
} from '@/modules/documents/types';

// ────────────────────────────────────────────────────────────────
// Constants — Enum Coverage Tests
// ────────────────────────────────────────────────────────────────

describe('DOCUMENT_TYPE_LABELS', () => {
  const allTypes = DocumentType.options;

  it('should have a label for every DocumentType enum value', () => {
    for (const type of allTypes) {
      expect(DOCUMENT_TYPE_LABELS).toHaveProperty(type);
      expect(typeof DOCUMENT_TYPE_LABELS[type]).toBe('string');
      expect(DOCUMENT_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it('should not have extra keys beyond the enum values', () => {
    const labelKeys = Object.keys(DOCUMENT_TYPE_LABELS);
    expect(labelKeys.sort()).toEqual([...allTypes].sort());
  });

  it('should have Vietnamese labels', () => {
    expect(DOCUMENT_TYPE_LABELS.requirement).toBe('Yêu cầu');
    expect(DOCUMENT_TYPE_LABELS.design).toBe('Thiết kế');
    expect(DOCUMENT_TYPE_LABELS.technical).toBe('Kỹ thuật');
    expect(DOCUMENT_TYPE_LABELS.other).toBe('Khác');
  });
});

describe('DOCUMENT_TYPE_COLORS', () => {
  const allTypes = DocumentType.options;
  const bgPattern = /^bg-[a-z]+-\d{2,3}$/;
  const textPattern = /^text-[a-z]+-\d{2,3}$/;

  it('should have a color entry for every DocumentType', () => {
    for (const type of allTypes) {
      expect(DOCUMENT_TYPE_COLORS).toHaveProperty(type);
    }
  });

  it('should use valid Tailwind bg/text classes', () => {
    for (const type of allTypes) {
      const colors = DOCUMENT_TYPE_COLORS[type];
      expect(colors.bg).toMatch(bgPattern);
      expect(colors.text).toMatch(textPattern);
    }
  });
});

describe('DOCUMENT_TYPE_ICONS', () => {
  const allTypes = DocumentType.options;

  it('should have an icon for every DocumentType', () => {
    for (const type of allTypes) {
      expect(DOCUMENT_TYPE_ICONS).toHaveProperty(type);
      expect(typeof DOCUMENT_TYPE_ICONS[type]).toBe('string');
      expect(DOCUMENT_TYPE_ICONS[type].length).toBeGreaterThan(0);
    }
  });
});

describe('DOCUMENT_STATUS_LABELS', () => {
  const allStatuses = DocumentStatus.options;

  it('should have a label for every DocumentStatus enum value', () => {
    for (const status of allStatuses) {
      expect(DOCUMENT_STATUS_LABELS).toHaveProperty(status);
      expect(typeof DOCUMENT_STATUS_LABELS[status]).toBe('string');
    }
  });

  it('should not have extra keys beyond the enum values', () => {
    const labelKeys = Object.keys(DOCUMENT_STATUS_LABELS);
    expect(labelKeys.sort()).toEqual([...allStatuses].sort());
  });

  it('should have Vietnamese labels', () => {
    expect(DOCUMENT_STATUS_LABELS.draft).toBe('Bản nháp');
    expect(DOCUMENT_STATUS_LABELS.approved).toBe('Đã duyệt');
    expect(DOCUMENT_STATUS_LABELS.archived).toBe('Đã lưu trữ');
    expect(DOCUMENT_STATUS_LABELS.obsolete).toBe('Lỗi thời');
  });
});

describe('DOCUMENT_STATUS_COLORS', () => {
  const allStatuses = DocumentStatus.options;
  const bgPattern = /^bg-[a-z]+-\d{2,3}$/;
  const textPattern = /^text-[a-z]+-\d{2,3}$/;

  it('should have a color entry for every DocumentStatus', () => {
    for (const status of allStatuses) {
      expect(DOCUMENT_STATUS_COLORS).toHaveProperty(status);
    }
  });

  it('should use valid Tailwind bg/text classes', () => {
    for (const status of allStatuses) {
      const colors = DOCUMENT_STATUS_COLORS[status];
      expect(colors.bg).toMatch(bgPattern);
      expect(colors.text).toMatch(textPattern);
    }
  });
});

describe('VALIDATION constants', () => {
  it('should have positive TITLE_MIN', () => {
    expect(VALIDATION.TITLE_MIN).toBeGreaterThanOrEqual(1);
  });

  it('should have TITLE_MAX > TITLE_MIN', () => {
    expect(VALIDATION.TITLE_MAX).toBeGreaterThan(VALIDATION.TITLE_MIN);
  });

  it('should have DESCRIPTION_MAX > 0', () => {
    expect(VALIDATION.DESCRIPTION_MAX).toBeGreaterThan(0);
  });

  it('should have positive TAGS_MAX_COUNT', () => {
    expect(VALIDATION.TAGS_MAX_COUNT).toBeGreaterThan(0);
  });
});

describe('PERMISSIONS', () => {
  const RESOURCE_ACTION_PATTERN = /^[a-z_]+(:[a-z_]+)+$/;

  it('should follow resource:action naming pattern', () => {
    for (const key of Object.keys(PERMISSIONS)) {
      const value = PERMISSIONS[key as keyof typeof PERMISSIONS];
      expect(value).toMatch(RESOURCE_ACTION_PATTERN);
    }
  });

  it('should include core CRUD permissions', () => {
    expect(PERMISSIONS.DOCUMENT_CREATE).toBe('document:create');
    expect(PERMISSIONS.DOCUMENT_READ).toBe('document:read');
    expect(PERMISSIONS.DOCUMENT_UPDATE).toBe('document:update');
    expect(PERMISSIONS.DOCUMENT_DELETE).toBe('document:delete');
  });
});

describe('Pagination constants', () => {
  it('DEFAULT_PER_PAGE should be 20', () => {
    expect(DEFAULT_PER_PAGE).toBe(20);
  });

  it('MAX_PER_PAGE should be 100', () => {
    expect(MAX_PER_PAGE).toBe(100);
  });

  it('MAX_PER_PAGE should be >= DEFAULT_PER_PAGE', () => {
    expect(MAX_PER_PAGE).toBeGreaterThanOrEqual(DEFAULT_PER_PAGE);
  });
});

// ────────────────────────────────────────────────────────────────
// uploadDocumentSchema — Zod Boundary Tests
// ────────────────────────────────────────────────────────────────

describe('uploadDocumentSchema', () => {
  const validInput = {
    title: 'Tài liệu Yêu cầu Hệ thống',
    description: 'Mô tả chi tiết yêu cầu.',
    type: 'requirement' as const,
    status: 'draft' as const,
    tags: ['yêu cầu', 'hệ thống'],
  };

  it('should accept valid data', () => {
    const result = uploadDocumentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default type=other when not provided', () => {
    const { type, ...without } = validInput;
    const result = uploadDocumentSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('other');
    }
  });

  it('should apply default status=draft when not provided', () => {
    const { status, ...without } = validInput;
    const result = uploadDocumentSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });

  it('should apply default tags=[] when not provided', () => {
    const { tags, ...without } = validInput;
    const result = uploadDocumentSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('should reject empty title', () => {
    const result = uploadDocumentSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject title exceeding TITLE_MAX', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(VALIDATION.TITLE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('should accept title at exact TITLE_MAX boundary', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(VALIDATION.TITLE_MAX),
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type enum value', () => {
    const result = uploadDocumentSchema.safeParse({ ...validInput, type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid status enum value', () => {
    const result = uploadDocumentSchema.safeParse({ ...validInput, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID for projectId', () => {
    const result = uploadDocumentSchema.safeParse({ ...validInput, projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should accept valid UUID for projectId', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject description exceeding DESCRIPTION_MAX', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      description: 'a'.repeat(VALIDATION.DESCRIPTION_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('should reject tags array exceeding TAGS_MAX_COUNT', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      tags: Array.from({ length: VALIDATION.TAGS_MAX_COUNT + 1 }, (_, i) => `tag-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid document types', () => {
    const types = DocumentType.options;
    for (const type of types) {
      const result = uploadDocumentSchema.safeParse({ ...validInput, type });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid document statuses', () => {
    const statuses = DocumentStatus.options;
    for (const status of statuses) {
      const result = uploadDocumentSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });
});

// ────────────────────────────────────────────────────────────────
// updateDocumentSchema — Partial Update Tests
// ────────────────────────────────────────────────────────────────

describe('updateDocumentSchema', () => {
  it('should accept empty object (no changes)', () => {
    const result = updateDocumentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial update with only title', () => {
    const result = updateDocumentSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('should reject title exceeding TITLE_MAX even in partial update', () => {
    const result = updateDocumentSchema.safeParse({
      title: 'a'.repeat(VALIDATION.TITLE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('should accept nullable description', () => {
    const result = updateDocumentSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type enum value', () => {
    const result = updateDocumentSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should accept status update', () => {
    const result = updateDocumentSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// createVersionSchema — Version Creation Tests
// ────────────────────────────────────────────────────────────────

describe('createVersionSchema', () => {
  const validInput = {
    documentId: '550e8400-e29b-41d4-a716-446655440000',
    changeSummary: 'Cập nhật phần 3.2',
    content: 'Nội dung phiên bản mới...',
  };

  it('should accept valid data', () => {
    const result = createVersionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid documentId (not UUID)', () => {
    const result = createVersionSchema.safeParse({ ...validInput, documentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should accept without changeSummary', () => {
    const { changeSummary, ...without } = validInput;
    const result = createVersionSchema.safeParse(without);
    expect(result.success).toBe(true);
  });

  it('should accept without content', () => {
    const { content, ...without } = validInput;
    const result = createVersionSchema.safeParse(without);
    expect(result.success).toBe(true);
  });

  it('should reject changeSummary exceeding CHANGE_SUMMARY_MAX', () => {
    const result = createVersionSchema.safeParse({
      ...validInput,
      changeSummary: 'a'.repeat(VALIDATION.CHANGE_SUMMARY_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing documentId', () => {
    const { documentId, ...without } = validInput;
    const result = createVersionSchema.safeParse(without);
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// documentFiltersSchema — Filter Defaults and Validation
// ────────────────────────────────────────────────────────────────

describe('documentFiltersSchema', () => {
  it('should apply default page=1', () => {
    const result = documentFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it('should apply default perPage=20', () => {
    const result = documentFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perPage).toBe(20);
    }
  });

  it('should apply default sortBy=updated_at', () => {
    const result = documentFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('updated_at');
    }
  });

  it('should apply default sortOrder=desc', () => {
    const result = documentFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should reject page < 1', () => {
    const result = documentFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > MAX_PER_PAGE', () => {
    const result = documentFiltersSchema.safeParse({ perPage: MAX_PER_PAGE + 1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortBy', () => {
    const result = documentFiltersSchema.safeParse({ sortBy: 'invalid_column' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortOrder', () => {
    const result = documentFiltersSchema.safeParse({ sortOrder: 'random' });
    expect(result.success).toBe(false);
  });

  it('should accept valid type filter', () => {
    const result = documentFiltersSchema.safeParse({ type: 'technical' });
    expect(result.success).toBe(true);
  });

  it('should accept valid status filter', () => {
    const result = documentFiltersSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type enum', () => {
    const result = documentFiltersSchema.safeParse({ type: 'invoice' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid status enum', () => {
    const result = documentFiltersSchema.safeParse({ status: 'in_progress' });
    expect(result.success).toBe(false);
  });

  it('should accept valid projectId UUID', () => {
    const result = documentFiltersSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid projectId (not UUID)', () => {
    const result = documentFiltersSchema.safeParse({ projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// Type-level tests — Shape verification
// ────────────────────────────────────────────────────────────────

describe('DocumentType enum', () => {
  it('should contain all expected type values', () => {
    const expected = [
      'requirement',
      'design',
      'technical',
      'test_plan',
      'user_guide',
      'handover',
      'report',
      'meeting_notes',
      'other',
    ];
    expect(DocumentType.options.sort()).toEqual(expected.sort());
  });
});

describe('DocumentStatus enum', () => {
  it('should contain all expected status values', () => {
    const expected = ['draft', 'review', 'approved', 'archived', 'obsolete'];
    expect(DocumentStatus.options.sort()).toEqual(expected.sort());
  });
});
