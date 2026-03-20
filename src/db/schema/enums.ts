import { pgEnum } from 'drizzle-orm/pg-core';

// ── Foundation Enums ──────────────────────────────────────────────

/** User subscription status */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
]);

/** User subscription tier */
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'pro',
  'team',
  'enterprise',
]);

/** Device type for user sessions */
export const deviceTypeEnum = pgEnum('device_type', [
  'desktop',
  'mobile',
  'tablet',
  'unknown',
]);

/** Invitation status */
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);

// ── Core Enums ────────────────────────────────────────────────────

/**
 * Project stage — 10 Vietnamese stages (Giai đoạn dự án)
 * 1. Khởi tạo  2. Lập kế hoạch  3. Đang thực hiện  4. Đánh giá
 * 5. Kiểm thử  6. Tiền triển khai  7. Triển khai  8. Giám sát
 * 9. Bàn giao  10. Hoàn thành
 */
export const projectStageEnum = pgEnum('project_stage', [
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

/** Project priority (Mức độ ưu tiên) */
export const projectPriorityEnum = pgEnum('project_priority', [
  'critical',
  'high',
  'medium',
  'low',
]);

/** Project health status (Tình trạng sức khỏe dự án) */
export const healthStatusEnum = pgEnum('health_status', [
  'on_track',
  'at_risk',
  'delayed',
  'blocked',
]);

/** Project member role (Vai trò thành viên dự án) */
export const projectMemberRoleEnum = pgEnum('project_member_role', [
  'owner',
  'lead',
  'member',
  'reviewer',
  'observer',
]);

/** Handover type (Loại bàn giao) */
export const handoverTypeEnum = pgEnum('handover_type', [
  'project_transfer',
  'stage_transition',
  'team_change',
  'department_transfer',
  'role_change',
]);

/** Handover status (Trạng thái bàn giao) */
export const handoverStatusEnum = pgEnum('handover_status', [
  'draft',
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
]);

/** Checklist item category (Danh mục mục kiểm tra) */
export const checklistCategoryEnum = pgEnum('checklist_category', [
  'documentation',
  'access_transfer',
  'knowledge_transfer',
  'tool_setup',
  'review',
  'signoff',
  'other',
]);

/** Checklist item priority */
export const checklistPriorityEnum = pgEnum('checklist_priority', [
  'required',
  'recommended',
  'optional',
]);

/** Document type (Loại tài liệu) */
export const documentTypeEnum = pgEnum('document_type', [
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

/** Document status (Trạng thái tài liệu) */
export const documentStatusEnum = pgEnum('document_status', [
  'draft',
  'review',
  'approved',
  'archived',
  'obsolete',
]);

// ── Operations Enums ──────────────────────────────────────────────

/** Task type (Loại công việc) */
export const taskTypeEnum = pgEnum('task_type', [
  'feature',
  'bug',
  'improvement',
  'documentation',
  'testing',
  'deployment',
  'research',
  'other',
]);

/** Task status (Trạng thái công việc) */
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'testing',
  'done',
  'cancelled',
]);

/** Task priority (Mức độ ưu tiên công việc) */
export const taskPriorityEnum = pgEnum('task_priority', [
  'critical',
  'high',
  'medium',
  'low',
]);

/** Notification type (Loại thông báo) */
export const notificationTypeEnum = pgEnum('notification_type', [
  'task_assigned',
  'task_status_changed',
  'task_comment',
  'handover_initiated',
  'handover_approved',
  'handover_rejected',
  'project_stage_changed',
  'document_shared',
  'document_approved',
  'mention',
  'deadline_approaching',
  'deadline_overdue',
  'system_alert',
  'report_generated',
]);

/** Notification priority (Mức ưu tiên thông báo) */
export const notificationPriorityEnum = pgEnum('notification_priority', [
  'urgent',
  'high',
  'normal',
  'low',
]);

/** Audit log action (Hành động nhật ký) */
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'login_failed',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'stage_change',
  'status_change',
  'handover_initiate',
  'handover_complete',
  'permission_grant',
  'permission_revoke',
  'settings_change',
  'billing_change',
]);

/** Audit log entity type (Loại thực thể) */
export const auditEntityTypeEnum = pgEnum('audit_entity_type', [
  'project',
  'task',
  'handover',
  'document',
  'user',
  'role',
  'department',
  'settings',
  'billing',
  'notification',
]);

/** Audit log severity (Mức độ nghiêm trọng) */
export const auditSeverityEnum = pgEnum('audit_severity', [
  'info',
  'warning',
  'critical',
]);

/** Financial record type (Loại bản ghi tài chính) */
export const financialTypeEnum = pgEnum('financial_type', [
  'budget_allocation',
  'expense',
  'invoice',
  'payment',
  'refund',
  'adjustment',
]);

/** Financial record category (Danh mục tài chính) */
export const financialCategoryEnum = pgEnum('financial_category', [
  'labor',
  'software',
  'hardware',
  'infrastructure',
  'consulting',
  'training',
  'travel',
  'other',
]);

/** Financial record status (Trạng thái bản ghi tài chính) */
export const financialStatusEnum = pgEnum('financial_status', [
  'pending',
  'approved',
  'rejected',
  'processed',
]);

/** Compliance framework (Khung tuân thủ) */
export const complianceFrameworkEnum = pgEnum('compliance_framework', [
  'iso_27001',
  'soc2',
  'gdpr',
  'hipaa',
  'pci_dss',
  'nist',
  'custom',
]);

/** Compliance status (Trạng thái tuân thủ) */
export const complianceStatusEnum = pgEnum('compliance_status', [
  'not_started',
  'in_progress',
  'implemented',
  'verified',
  'non_compliant',
  'not_applicable',
]);

/** Risk level (Mức độ rủi ro) */
export const riskLevelEnum = pgEnum('risk_level', [
  'critical',
  'high',
  'medium',
  'low',
  'none',
]);

/** Stage transition direction */
export const transitionDirectionEnum = pgEnum('transition_direction', [
  'forward',
  'backward',
]);

/** Setting scope (Phạm vi cài đặt) */
export const settingScopeEnum = pgEnum('setting_scope', [
  'system',
  'organization',
  'user',
]);
