import type { AuditAction, AuditEntityType, AuditSeverity } from './types';

// ── Audit Action Labels (Vietnamese) ─────────────────────────────
// Source: ref-ux-vietnam.md Section 13 — Audit Log Actions

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Tạo mới',
  read: 'Xem',
  update: 'Cập nhật',
  delete: 'Xóa',
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
  login_failed: 'Đăng nhập thất bại',
  export: 'Xuất dữ liệu',
  import: 'Nhập dữ liệu',
  approve: 'Phê duyệt',
  reject: 'Từ chối',
  assign: 'Giao việc',
  unassign: 'Hủy giao việc',
  stage_change: 'Chuyển giai đoạn',
  status_change: 'Thay đổi trạng thái',
  handover_initiate: 'Khởi tạo bàn giao',
  handover_complete: 'Hoàn thành bàn giao',
  permission_grant: 'Cấp quyền',
  permission_revoke: 'Thu hồi quyền',
  settings_change: 'Thay đổi cài đặt',
  billing_change: 'Thay đổi thanh toán',
};

// ── Audit Action Colors (Tailwind) ────────────────────────────────

export const AUDIT_ACTION_COLORS: Record<AuditAction, { bg: string; text: string }> = {
  create: { bg: 'bg-green-100', text: 'text-green-800' },
  read: { bg: 'bg-gray-100', text: 'text-gray-700' },
  update: { bg: 'bg-blue-100', text: 'text-blue-800' },
  delete: { bg: 'bg-red-100', text: 'text-red-800' },
  login: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  logout: { bg: 'bg-slate-100', text: 'text-slate-700' },
  login_failed: { bg: 'bg-red-100', text: 'text-red-800' },
  export: { bg: 'bg-purple-100', text: 'text-purple-800' },
  import: { bg: 'bg-violet-100', text: 'text-violet-800' },
  approve: { bg: 'bg-green-100', text: 'text-green-800' },
  reject: { bg: 'bg-red-100', text: 'text-red-800' },
  assign: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  unassign: { bg: 'bg-orange-100', text: 'text-orange-800' },
  stage_change: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  status_change: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  handover_initiate: { bg: 'bg-amber-100', text: 'text-amber-800' },
  handover_complete: { bg: 'bg-teal-100', text: 'text-teal-800' },
  permission_grant: { bg: 'bg-lime-100', text: 'text-lime-800' },
  permission_revoke: { bg: 'bg-rose-100', text: 'text-rose-800' },
  settings_change: { bg: 'bg-sky-100', text: 'text-sky-800' },
  billing_change: { bg: 'bg-pink-100', text: 'text-pink-800' },
};

// ── Entity Type Labels (Vietnamese) ──────────────────────────────

export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  project: 'Dự án',
  task: 'Công việc',
  handover: 'Bàn giao',
  document: 'Tài liệu',
  user: 'Người dùng',
  role: 'Vai trò',
  department: 'Phòng ban',
  settings: 'Cài đặt',
  billing: 'Thanh toán',
  notification: 'Thông báo',
};

// ── Severity Labels (Vietnamese) ──────────────────────────────────

export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: 'Thông tin',
  warning: 'Cảnh báo',
  critical: 'Nghiêm trọng',
};

// ── Severity Colors (Tailwind) ────────────────────────────────────

export const SEVERITY_COLORS: Record<AuditSeverity, { bg: string; text: string }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-800' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ── Validation Rules ──────────────────────────────────────────────

export const VALIDATION = {
  DESCRIPTION_MAX: 2000,
} as const;

// ── Pagination ────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Permission Keys (RBAC) ────────────────────────────────────────

export const PERMISSIONS = {
  AUDIT_LOG_READ: 'audit_log:read',
  AUDIT_LOG_EXPORT: 'audit_log:export',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  action: true,
  entityType: true,
  entityName: true,
  user: true,
  severity: true,
  projectId: false,
  ipAddress: false,
  createdAt: true,
};

// ── Filter Presets ────────────────────────────────────────────────

export const FILTER_PRESETS = {
  ALL: {
    label: 'Tất cả',
    filters: {},
  },
  CRITICAL: {
    label: 'Nghiêm trọng',
    filters: { severity: 'critical' as const },
  },
  WARNINGS: {
    label: 'Cảnh báo',
    filters: { severity: 'warning' as const },
  },
  AUTH_EVENTS: {
    label: 'Xác thực',
    filters: { action: 'login' as const },
  },
  MUTATIONS: {
    label: 'Thay đổi dữ liệu',
    filters: { action: 'create' as const },
  },
  SECURITY: {
    label: 'Bảo mật',
    filters: { action: 'permission_grant' as const },
  },
} as const;

// ── Entity Type Route Map ─────────────────────────────────────────
// Maps entity types to dashboard route prefixes for entity links

export const ENTITY_ROUTE_MAP: Partial<Record<AuditEntityType, string>> = {
  project: '/dashboard/projects',
  task: '/dashboard/tasks',
  handover: '/dashboard/handovers',
  document: '/dashboard/documents',
};
