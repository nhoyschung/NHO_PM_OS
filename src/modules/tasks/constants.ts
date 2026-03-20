import type { TaskStatus, TaskType, TaskPriority } from './types';

// ── Task Status Labels (Vietnamese) ──────────────────────────────
// Source: ref-ux-vietnam.md Section 5 — Task Status

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Tồn đọng',
  todo: 'Cần làm',
  in_progress: 'Đang thực hiện',
  in_review: 'Đang đánh giá',
  testing: 'Đang kiểm thử',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

// ── Task Status Colors (Tailwind) ─────────────────────────────────

export const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  backlog: { bg: 'bg-gray-100', text: 'text-gray-800' },
  todo: { bg: 'bg-blue-100', text: 'text-blue-800' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  in_review: { bg: 'bg-orange-100', text: 'text-orange-800' },
  testing: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  done: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ── Task Status Icons (Lucide) ────────────────────────────────────

export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
  backlog: 'Inbox',
  todo: 'Circle',
  in_progress: 'Loader',
  in_review: 'Eye',
  testing: 'TestTube',
  done: 'CheckCircle2',
  cancelled: 'XCircle',
};

// ── Allowed Task Status Transitions (State Machine) ───────────────
// Kanban flow: backlog → todo → in_progress → in_review → testing → done
// Can cancel from most states; done/cancelled are terminal

export const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  backlog: ['todo', 'cancelled'],
  todo: ['in_progress', 'backlog', 'cancelled'],
  in_progress: ['in_review', 'todo', 'cancelled'],
  in_review: ['testing', 'in_progress', 'cancelled'],
  testing: ['done', 'in_review', 'cancelled'],
  done: [],
  cancelled: ['backlog'],
};

// ── Task Type Labels (Vietnamese) ─────────────────────────────────
// Source: ref-ux-vietnam.md Section 6 — Task Type

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  feature: 'Tính năng',
  bug: 'Lỗi',
  improvement: 'Cải tiến',
  documentation: 'Tài liệu',
  testing: 'Kiểm thử',
  deployment: 'Triển khai',
  research: 'Nghiên cứu',
  other: 'Khác',
};

// ── Task Type Colors (Tailwind) ───────────────────────────────────

export const TASK_TYPE_COLORS: Record<TaskType, { bg: string; text: string }> = {
  feature: { bg: 'bg-blue-100', text: 'text-blue-800' },
  bug: { bg: 'bg-red-100', text: 'text-red-800' },
  improvement: { bg: 'bg-purple-100', text: 'text-purple-800' },
  documentation: { bg: 'bg-gray-100', text: 'text-gray-800' },
  testing: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  deployment: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  research: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  other: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

// ── Task Type Icons (Lucide) ──────────────────────────────────────

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  feature: 'Star',
  bug: 'Bug',
  improvement: 'TrendingUp',
  documentation: 'FileText',
  testing: 'TestTube',
  deployment: 'Rocket',
  research: 'Search',
  other: 'MoreHorizontal',
};

// ── Task Priority Labels (Vietnamese) ─────────────────────────────
// Source: ref-ux-vietnam.md Section 3

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

// ── Task Priority Colors (Tailwind) ───────────────────────────────

export const TASK_PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// ── Kanban Column Order ───────────────────────────────────────────
// The 4 primary Kanban columns displayed in the board view

export const KANBAN_COLUMNS: readonly TaskStatus[] = [
  'todo',
  'in_progress',
  'in_review',
  'done',
] as const;

// ── Validation Rules ──────────────────────────────────────────────

export const VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 300,
  DESCRIPTION_MAX: 5000,
  NOTES_MAX: 1000,
  CODE_PATTERN: /^TSK-\d{3,}$/,
  TAGS_MAX_COUNT: 20,
  TAG_MAX_LENGTH: 50,
  HOURS_MAX: 10000,
} as const;

// ── Pagination ────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Task Code Prefix ──────────────────────────────────────────────

export const TASK_CODE_PREFIX = 'TSK';

// ── Permission Keys (RBAC) ────────────────────────────────────────

export const PERMISSIONS = {
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_TRANSITION: 'task:transition',
  TASK_ASSIGN: 'task:assign',
  TASK_COMMENT: 'task:comment',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  title: true,
  code: true,
  status: true,
  priority: true,
  type: true,
  assignee: true,
  project: true,
  dueDate: true,
  createdAt: false,
  updatedAt: false,
};

// ── Filter Presets ────────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL_ACTIVE: {
    label: 'Tất cả đang hoạt động',
    filters: {},
  },
  MY_TASKS: {
    label: 'Công việc của tôi',
    filters: {},
    // assigneeId set dynamically from session
  },
  OVERDUE: {
    label: 'Quá hạn',
    filters: { isOverdue: true },
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    filters: { status: 'in_progress' as const },
  },
  DONE: {
    label: 'Hoàn thành',
    filters: { status: 'done' as const },
  },
  HIGH_PRIORITY: {
    label: 'Ưu tiên cao',
    filters: { priority: 'high' as const },
  },
} as const;
