import type { ProjectStage, ProjectPriority, HealthStatus } from './types';

// ── Stage Labels (Vietnamese) ─────────────────────────────────────
// Source: ref-ux-vietnam.md Section 2 — Project Stages

export const STAGE_LABELS: Record<ProjectStage, string> = {
  initiation: 'Khởi tạo',
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thực hiện',
  review: 'Đánh giá',
  testing: 'Kiểm thử',
  staging: 'Tiền triển khai',
  deployment: 'Triển khai',
  monitoring: 'Giám sát',
  handover: 'Bàn giao',
  completed: 'Hoàn thành',
};

// ── Stage Descriptions (Vietnamese) ───────────────────────────────
// Source: ref-state-machine.md Section 6

export const STAGE_DESCRIPTIONS: Record<ProjectStage, string> = {
  initiation: 'Thiết lập dự án, xác định các bên liên quan',
  planning: 'Lập kế hoạch chi tiết, phân bổ nguồn lực',
  in_progress: 'Đang phát triển và triển khai',
  review: 'Đánh giá mã nguồn, đánh giá chất lượng',
  testing: 'Kiểm thử chức năng, kiểm thử tích hợp',
  staging: 'Xác nhận môi trường tiền triển khai',
  deployment: 'Triển khai lên môi trường production',
  monitoring: 'Giám sát sau triển khai',
  handover: 'Bàn giao dự án, chuyển giao kiến thức',
  completed: 'Dự án hoàn thành, lưu trữ',
};

// ── Stage Colors (Tailwind) ───────────────────────────────────────
// Source: ref-state-machine.md Section 5 — Stage Colors & Icons

export const STAGE_COLORS: Record<ProjectStage, { bg: string; text: string }> = {
  initiation: { bg: 'bg-blue-100', text: 'text-blue-800' },
  planning: { bg: 'bg-purple-100', text: 'text-purple-800' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  review: { bg: 'bg-orange-100', text: 'text-orange-800' },
  testing: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  staging: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  deployment: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  monitoring: { bg: 'bg-teal-100', text: 'text-teal-800' },
  handover: { bg: 'bg-amber-100', text: 'text-amber-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
};

// ── Stage Icons (Lucide) ─────────────────────────────────────────
// Source: ref-state-machine.md Section 5

export const STAGE_ICONS: Record<ProjectStage, string> = {
  initiation: 'FileText',
  planning: 'Calendar',
  in_progress: 'Loader',
  review: 'Eye',
  testing: 'TestTube',
  staging: 'Server',
  deployment: 'Rocket',
  monitoring: 'Activity',
  handover: 'ArrowRightLeft',
  completed: 'CheckCircle',
};

// ── Allowed Transitions (State Machine) ───────────────────────────
// Source: ref-state-machine.md Section 3 — EXACTLY 15 transitions
// 9 forward + 6 backward

export const ALLOWED_TRANSITIONS: Record<ProjectStage, readonly ProjectStage[]> = {
  initiation: ['planning'],
  planning: ['in_progress'],
  in_progress: ['review'],
  review: ['testing', 'in_progress'],
  testing: ['staging', 'in_progress'],
  staging: ['deployment', 'in_progress'],
  deployment: ['monitoring', 'staging'],
  monitoring: ['handover', 'in_progress'],
  handover: ['completed', 'monitoring'],
  completed: [],
};

// ── Transition Metadata ──────────────────────────────────────────
// Source: ref-state-machine.md Section 3 — trigger names + required roles

export interface TransitionMeta {
  readonly trigger: string;
  readonly guard: string;
  readonly requiredRoles: readonly string[];
  readonly requiresHandover: boolean;
}

export const TRANSITION_META: Record<string, TransitionMeta> = {
  'initiation->planning': {
    trigger: 'approve_charter',
    guard: 'project has owner and at least one team member',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'planning->in_progress': {
    trigger: 'approve_plan',
    guard: 'project has start_date and target_end_date and at least one task',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'in_progress->review': {
    trigger: 'submit_for_review',
    guard: 'all critical and high priority tasks are done or in_review',
    requiredRoles: ['admin', 'manager', 'lead', 'member'],
    requiresHandover: false,
  },
  'review->testing': {
    trigger: 'approve_review',
    guard: 'review checklist completed',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'review->in_progress': {
    trigger: 'request_changes',
    guard: 'review comments documented',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'testing->staging': {
    trigger: 'tests_passed',
    guard: 'all test cases passed, no critical bugs open',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'testing->in_progress': {
    trigger: 'tests_failed',
    guard: 'failed test cases documented as tasks',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'staging->deployment': {
    trigger: 'staging_approved',
    guard: 'staging environment validated, deployment checklist ready',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: false,
  },
  'staging->in_progress': {
    trigger: 'staging_issues',
    guard: 'staging issues documented as tasks',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'deployment->monitoring': {
    trigger: 'deployment_complete',
    guard: 'deployment successful, health checks passing',
    requiredRoles: ['admin', 'manager', 'lead'],
    requiresHandover: false,
  },
  'deployment->staging': {
    trigger: 'deployment_rollback',
    guard: 'rollback reason documented',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: false,
  },
  'monitoring->handover': {
    trigger: 'monitoring_complete',
    guard: 'monitoring period elapsed (default 48h), no critical issues',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: true,
  },
  'monitoring->in_progress': {
    trigger: 'issues_detected',
    guard: 'production issues documented as tasks',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: false,
  },
  'handover->completed': {
    trigger: 'handover_accepted',
    guard: 'all handover checklist items completed, receiving party confirmed',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: false,
  },
  'handover->monitoring': {
    trigger: 'handover_rejected',
    guard: 'rejection reason documented',
    requiredRoles: ['admin', 'manager'],
    requiresHandover: false,
  },
};

// ── Priority Labels (Vietnamese) ──────────────────────────────────
// Source: ref-ux-vietnam.md Section 3

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

// ── Priority Colors (Tailwind) ────────────────────────────────────

export const PRIORITY_COLORS: Record<ProjectPriority, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// ── Health Status Labels (Vietnamese) ─────────────────────────────
// Source: ref-ux-vietnam.md Section 4

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  on_track: 'Đúng tiến độ',
  at_risk: 'Có rủi ro',
  delayed: 'Trễ tiến độ',
  blocked: 'Bị chặn',
};

// ── Health Status Colors (Tailwind) ───────────────────────────────

export const HEALTH_COLORS: Record<HealthStatus, { bg: string; text: string }> = {
  on_track: { bg: 'bg-green-100', text: 'text-green-800' },
  at_risk: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  delayed: { bg: 'bg-orange-100', text: 'text-orange-800' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ── Vietnamese Provinces ─────────────────────────────────────────
// 63 provinces/municipalities of Vietnam
// Assumption: PRD specifies a province text field; standard province list added for form selects.

export const PROVINCES = [
  { value: 'HN', label: 'Hà Nội' },
  { value: 'HCM', label: 'TP. Hồ Chí Minh' },
  { value: 'HP', label: 'Hải Phòng' },
  { value: 'DN', label: 'Đà Nẵng' },
  { value: 'CT', label: 'Cần Thơ' },
  { value: 'AG', label: 'An Giang' },
  { value: 'BRV', label: 'Bà Rịa - Vũng Tàu' },
  { value: 'BG', label: 'Bắc Giang' },
  { value: 'BK', label: 'Bắc Kạn' },
  { value: 'BL', label: 'Bạc Liêu' },
  { value: 'BN', label: 'Bắc Ninh' },
  { value: 'BTr', label: 'Bến Tre' },
  { value: 'BD', label: 'Bình Dương' },
  { value: 'BDi', label: 'Bình Định' },
  { value: 'BP', label: 'Bình Phước' },
  { value: 'BTh', label: 'Bình Thuận' },
  { value: 'CM', label: 'Cà Mau' },
  { value: 'CB', label: 'Cao Bằng' },
  { value: 'DL', label: 'Đắk Lắk' },
  { value: 'DN2', label: 'Đắk Nông' },
  { value: 'DB', label: 'Điện Biên' },
  { value: 'DNo', label: 'Đồng Nai' },
  { value: 'DT', label: 'Đồng Tháp' },
  { value: 'GL', label: 'Gia Lai' },
  { value: 'HGi', label: 'Hà Giang' },
  { value: 'HNa', label: 'Hà Nam' },
  { value: 'HTi', label: 'Hà Tĩnh' },
  { value: 'HD', label: 'Hải Dương' },
  { value: 'HaG', label: 'Hậu Giang' },
  { value: 'HB', label: 'Hòa Bình' },
  { value: 'HY', label: 'Hưng Yên' },
  { value: 'KH', label: 'Khánh Hòa' },
  { value: 'KG', label: 'Kiên Giang' },
  { value: 'KT', label: 'Kon Tum' },
  { value: 'LC', label: 'Lai Châu' },
  { value: 'LD', label: 'Lâm Đồng' },
  { value: 'LS', label: 'Lạng Sơn' },
  { value: 'LCa', label: 'Lào Cai' },
  { value: 'LA', label: 'Long An' },
  { value: 'ND', label: 'Nam Định' },
  { value: 'NA', label: 'Nghệ An' },
  { value: 'NB', label: 'Ninh Bình' },
  { value: 'NT', label: 'Ninh Thuận' },
  { value: 'PT', label: 'Phú Thọ' },
  { value: 'PY', label: 'Phú Yên' },
  { value: 'QB', label: 'Quảng Bình' },
  { value: 'QNa', label: 'Quảng Nam' },
  { value: 'QNg', label: 'Quảng Ngãi' },
  { value: 'QN', label: 'Quảng Ninh' },
  { value: 'QTr', label: 'Quảng Trị' },
  { value: 'ST', label: 'Sóc Trăng' },
  { value: 'SL', label: 'Sơn La' },
  { value: 'TN', label: 'Tây Ninh' },
  { value: 'TB', label: 'Thái Bình' },
  { value: 'TNo', label: 'Thái Nguyên' },
  { value: 'TH', label: 'Thanh Hóa' },
  { value: 'TTH', label: 'Thừa Thiên Huế' },
  { value: 'TG', label: 'Tiền Giang' },
  { value: 'TV', label: 'Trà Vinh' },
  { value: 'TQ', label: 'Tuyên Quang' },
  { value: 'VL', label: 'Vĩnh Long' },
  { value: 'VP', label: 'Vĩnh Phúc' },
  { value: 'YB', label: 'Yên Bái' },
] as const;

// ── Validation Rules ──────────────────────────────────────────────
// Source: ref-schema-core.md Section 9 — Zod Validation Schemas

export const VALIDATION = {
  NAME_MIN: 3,
  NAME_MAX: 200,
  DESCRIPTION_MAX: 2000,
  CATEGORY_MAX: 100,
  CURRENCY_LENGTH: 3,
  CODE_PATTERN: /^PRJ-\d{3,}$/,
  TAGS_MAX_COUNT: 20,
  TAG_MAX_LENGTH: 50,
} as const;

// ── Pagination ────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

// ── Project Code ──────────────────────────────────────────────────

export const PROJECT_CODE_PREFIX = 'PRJ';

// ── Permission Keys (RBAC) ────────────────────────────────────────
// Used to check permissions in actions and components

export const PERMISSIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_TRANSITION: 'project:transition',
  PROJECT_MEMBER_MANAGE: 'project:member:manage',
  PROJECT_ARCHIVE: 'project:archive',
} as const;

// ── Column Visibility Defaults ────────────────────────────────────
// Default visible columns in the project list table

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  name: true,
  code: true,
  stage: true,
  priority: true,
  healthStatus: true,
  manager: true,
  department: false,
  startDate: false,
  endDate: true,
  progressPercentage: true,
  budget: false,
  createdAt: false,
  updatedAt: false,
};

// ── Filter Presets ────────────────────────────────────────────────
// Predefined filter configurations for common use cases

export const FILTER_PRESETS = {
  ALL_ACTIVE: {
    label: 'Tất cả đang hoạt động',
    filters: { isArchived: false },
  },
  MY_PROJECTS: {
    label: 'Dự án của tôi',
    filters: { isArchived: false },
    // managerId is set dynamically from session
  },
  AT_RISK: {
    label: 'Có rủi ro',
    filters: { healthStatus: 'at_risk' as const, isArchived: false },
  },
  BLOCKED: {
    label: 'Bị chặn',
    filters: { healthStatus: 'blocked' as const, isArchived: false },
  },
  COMPLETED: {
    label: 'Hoàn thành',
    filters: { stage: 'completed' as const },
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    filters: { isArchived: true },
  },
} as const;
