import type { HandoverStatus, HandoverType, ChecklistCategory, ChecklistPriority } from './types';

// ── Handover Status Labels (Vietnamese) ──────────────────────────
// Source: ref-ux-vietnam.md Section 7

export const STATUS_LABELS: Record<HandoverStatus, string> = {
  draft: 'Bản nháp',
  pending_review: 'Chờ đánh giá',
  in_review: 'Đang đánh giá',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

// ── Handover Status Colors (Tailwind) ────────────────────────────

export const STATUS_COLORS: Record<HandoverStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  in_review: { bg: 'bg-blue-100', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

// ── Handover Status Icons (Lucide) ──────────────────────────────

export const STATUS_ICONS: Record<HandoverStatus, string> = {
  draft: 'FileEdit',
  pending_review: 'Clock',
  in_review: 'Eye',
  approved: 'CheckCircle',
  rejected: 'XCircle',
  completed: 'CheckCheck',
  cancelled: 'Ban',
};

// ── Handover Type Labels (Vietnamese) ────────────────────────────
// Source: ref-ux-vietnam.md Section 8

export const TYPE_LABELS: Record<HandoverType, string> = {
  project_transfer: 'Chuyển giao dự án',
  stage_transition: 'Chuyển giai đoạn',
  team_change: 'Thay đổi nhóm',
  department_transfer: 'Chuyển phòng ban',
  role_change: 'Thay đổi vai trò',
};

// ── Handover Type Colors (Tailwind) ──────────────────────────────

export const TYPE_COLORS: Record<HandoverType, { bg: string; text: string }> = {
  project_transfer: { bg: 'bg-purple-100', text: 'text-purple-800' },
  stage_transition: { bg: 'bg-blue-100', text: 'text-blue-800' },
  team_change: { bg: 'bg-orange-100', text: 'text-orange-800' },
  department_transfer: { bg: 'bg-teal-100', text: 'text-teal-800' },
  role_change: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
};

// ── Checklist Category Labels (Vietnamese) ───────────────────────

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  documentation: 'Tài liệu',
  access_transfer: 'Chuyển quyền truy cập',
  knowledge_transfer: 'Chuyển giao kiến thức',
  tool_setup: 'Cài đặt công cụ',
  review: 'Đánh giá',
  signoff: 'Ký xác nhận',
  other: 'Khác',
};

// ── Checklist Priority Labels (Vietnamese) ───────────────────────

export const CHECKLIST_PRIORITY_LABELS: Record<ChecklistPriority, string> = {
  required: 'Bắt buộc',
  recommended: 'Khuyến nghị',
  optional: 'Tùy chọn',
};

export const CHECKLIST_PRIORITY_COLORS: Record<ChecklistPriority, { bg: string; text: string }> = {
  required: { bg: 'bg-red-100', text: 'text-red-800' },
  recommended: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  optional: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

// ── Allowed Status Transitions (State Machine) ──────────────────
// Source: ref-features-f01-f04.md F02 — Handover Status Workflow

export const ALLOWED_TRANSITIONS: Record<HandoverStatus, readonly HandoverStatus[]> = {
  draft: ['pending_review', 'cancelled'],
  pending_review: ['in_review', 'cancelled'],
  in_review: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: ['draft'],
  completed: [],
  cancelled: [],
};

// ── Validation Rules ────────────────────────────────────────────

export const VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 2000,
  NOTES_MAX: 5000,
  CHECKLIST_TITLE_MIN: 1,
  CHECKLIST_TITLE_MAX: 300,
  CHECKLIST_DESCRIPTION_MAX: 1000,
  REJECTION_REASON_MAX: 2000,
} as const;

// ── Pagination ──────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Permission Keys (RBAC) ──────────────────────────────────────

export const PERMISSIONS = {
  HANDOVER_CREATE: 'handover:create',
  HANDOVER_READ: 'handover:read',
  HANDOVER_UPDATE: 'handover:update',
  HANDOVER_DELETE: 'handover:delete',
  HANDOVER_SUBMIT: 'handover:submit',
  HANDOVER_APPROVE: 'handover:approve',
  HANDOVER_REJECT: 'handover:reject',
} as const;

// ── Column Visibility Defaults ──────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  title: true,
  type: true,
  status: true,
  project: true,
  fromUser: true,
  toUser: true,
  dueDate: true,
  checklist: true,
  createdAt: false,
  updatedAt: false,
};

// ── Filter Presets ──────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL: {
    label: 'Tất cả bàn giao',
    filters: {},
  },
  PENDING: {
    label: 'Chờ đánh giá',
    filters: { status: 'pending_review' as const },
  },
  IN_REVIEW: {
    label: 'Đang đánh giá',
    filters: { status: 'in_review' as const },
  },
  APPROVED: {
    label: 'Đã duyệt',
    filters: { status: 'approved' as const },
  },
  COMPLETED: {
    label: 'Hoàn thành',
    filters: { status: 'completed' as const },
  },
  REJECTED: {
    label: 'Bị từ chối',
    filters: { status: 'rejected' as const },
  },
} as const;
