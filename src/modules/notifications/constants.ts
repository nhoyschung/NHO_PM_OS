import type { NotificationType, NotificationPriority } from './types';

// ── Notification Type Labels (Vietnamese) ─────────────────────────
// Source: ref-ux-vietnam.md Section 12 — Notification Types

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: 'Được giao công việc',
  task_status_changed: 'Trạng thái công việc thay đổi',
  task_comment: 'Bình luận mới',
  handover_initiated: 'Bàn giao được khởi tạo',
  handover_approved: 'Bàn giao được duyệt',
  handover_rejected: 'Bàn giao bị từ chối',
  project_stage_changed: 'Giai đoạn dự án thay đổi',
  document_shared: 'Tài liệu được chia sẻ',
  document_approved: 'Tài liệu được duyệt',
  mention: 'Được nhắc đến',
  deadline_approaching: 'Sắp đến hạn',
  deadline_overdue: 'Quá hạn',
  system_alert: 'Cảnh báo hệ thống',
  report_generated: 'Báo cáo đã tạo',
};

// ── Notification Type Icons (Lucide) ──────────────────────────────

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  task_assigned: 'ClipboardList',
  task_status_changed: 'RefreshCw',
  task_comment: 'MessageSquare',
  handover_initiated: 'ArrowRightLeft',
  handover_approved: 'CheckCircle',
  handover_rejected: 'XCircle',
  project_stage_changed: 'Layers',
  document_shared: 'Share2',
  document_approved: 'FileCheck',
  mention: 'AtSign',
  deadline_approaching: 'Clock',
  deadline_overdue: 'AlertTriangle',
  system_alert: 'AlertCircle',
  report_generated: 'BarChart2',
};

// ── Notification Type Colors (Tailwind) ───────────────────────────

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, { bg: string; text: string }> = {
  task_assigned: { bg: 'bg-blue-100', text: 'text-blue-800' },
  task_status_changed: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  task_comment: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  handover_initiated: { bg: 'bg-amber-100', text: 'text-amber-800' },
  handover_approved: { bg: 'bg-green-100', text: 'text-green-800' },
  handover_rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  project_stage_changed: { bg: 'bg-purple-100', text: 'text-purple-800' },
  document_shared: { bg: 'bg-sky-100', text: 'text-sky-800' },
  document_approved: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  mention: { bg: 'bg-violet-100', text: 'text-violet-800' },
  deadline_approaching: { bg: 'bg-orange-100', text: 'text-orange-800' },
  deadline_overdue: { bg: 'bg-red-100', text: 'text-red-800' },
  system_alert: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  report_generated: { bg: 'bg-teal-100', text: 'text-teal-800' },
};

// ── Notification Priority Labels (Vietnamese) ─────────────────────

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  normal: 'Bình thường',
  low: 'Thấp',
};

// ── Notification Priority Colors (Tailwind) ───────────────────────

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, { bg: string; text: string }> = {
  urgent: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  normal: { bg: 'bg-gray-100', text: 'text-gray-700' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

// ── SWR Polling Interval ──────────────────────────────────────────
// Poll every 30 seconds for unread count refresh

export const POLL_INTERVAL_MS = 30_000;

// ── Validation Rules ──────────────────────────────────────────────

export const VALIDATION = {
  TITLE_MIN: 1,
  TITLE_MAX: 300,
  MESSAGE_MAX: 2000,
  ACTION_URL_MAX: 500,
} as const;

// ── Pagination ────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Permission Keys (RBAC) ────────────────────────────────────────

export const PERMISSIONS = {
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CREATE: 'notification:create',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_DELETE: 'notification:delete',
  NOTIFICATION_MARK_READ: 'notification:mark_read',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  type: true,
  priority: true,
  title: true,
  message: true,
  isRead: true,
  createdAt: true,
  actionUrl: false,
};

// ── Filter Presets ────────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL: {
    label: 'Tất cả',
    filters: {},
  },
  UNREAD: {
    label: 'Chưa đọc',
    filters: { isRead: false },
  },
  URGENT: {
    label: 'Khẩn cấp',
    filters: { priority: 'urgent' as const, isRead: false },
  },
  MENTIONS: {
    label: 'Được nhắc đến',
    filters: { type: 'mention' as const },
  },
  TASKS: {
    label: 'Công việc',
    filters: { type: 'task_assigned' as const },
  },
  SYSTEM: {
    label: 'Hệ thống',
    filters: { type: 'system_alert' as const },
  },
} as const;
