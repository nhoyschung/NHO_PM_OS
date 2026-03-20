import type { DocumentType, DocumentStatus } from './types';

// ── Document Type Labels (Vietnamese) ─────────────────────────────
// Source: ref-ux-vietnam.md Section 10 — Document Type

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  requirement: 'Yêu cầu',
  design: 'Thiết kế',
  technical: 'Kỹ thuật',
  test_plan: 'Kế hoạch kiểm thử',
  user_guide: 'Hướng dẫn sử dụng',
  handover: 'Bàn giao',
  report: 'Báo cáo',
  meeting_notes: 'Biên bản họp',
  other: 'Khác',
};

// ── Document Type Colors (Tailwind) ───────────────────────────────

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, { bg: string; text: string }> = {
  requirement: { bg: 'bg-blue-100', text: 'text-blue-800' },
  design: { bg: 'bg-purple-100', text: 'text-purple-800' },
  technical: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  test_plan: { bg: 'bg-orange-100', text: 'text-orange-800' },
  user_guide: { bg: 'bg-green-100', text: 'text-green-800' },
  handover: { bg: 'bg-amber-100', text: 'text-amber-800' },
  report: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  meeting_notes: { bg: 'bg-pink-100', text: 'text-pink-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// ── Document Type Icons (Lucide) ──────────────────────────────────

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  requirement: 'ClipboardList',
  design: 'Palette',
  technical: 'Code2',
  test_plan: 'TestTube',
  user_guide: 'BookOpen',
  handover: 'ArrowRightLeft',
  report: 'BarChart3',
  meeting_notes: 'MessageSquare',
  other: 'FileText',
};

// ── Document Status Labels (Vietnamese) ───────────────────────────
// Source: ref-ux-vietnam.md Section 9 — Document Status

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Bản nháp',
  review: 'Đang đánh giá',
  approved: 'Đã duyệt',
  archived: 'Đã lưu trữ',
  obsolete: 'Lỗi thời',
};

// ── Document Status Colors (Tailwind) ────────────────────────────

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  review: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  archived: { bg: 'bg-blue-100', text: 'text-blue-800' },
  obsolete: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ── Validation Rules ──────────────────────────────────────────────

export const VALIDATION = {
  TITLE_MIN: 1,
  TITLE_MAX: 300,
  DESCRIPTION_MAX: 2000,
  CHANGE_SUMMARY_MAX: 500,
  TAGS_MAX_COUNT: 20,
  TAG_MAX_LENGTH: 50,
} as const;

// ── Pagination ────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Permission Keys (RBAC) ────────────────────────────────────────

export const PERMISSIONS = {
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_APPROVE: 'document:approve',
  DOCUMENT_ARCHIVE: 'document:archive',
  DOCUMENT_VERSION_CREATE: 'document:version:create',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  title: true,
  type: true,
  status: true,
  currentVersion: true,
  project: true,
  createdByName: true,
  fileSize: false,
  createdAt: false,
  updatedAt: true,
};

// ── Filter Presets ────────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL_ACTIVE: {
    label: 'Tất cả tài liệu',
    filters: {},
  },
  DRAFTS: {
    label: 'Bản nháp',
    filters: { status: 'draft' as const },
  },
  PENDING_REVIEW: {
    label: 'Chờ đánh giá',
    filters: { status: 'review' as const },
  },
  APPROVED: {
    label: 'Đã duyệt',
    filters: { status: 'approved' as const },
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    filters: { status: 'archived' as const },
  },
  OBSOLETE: {
    label: 'Lỗi thời',
    filters: { status: 'obsolete' as const },
  },
} as const;
