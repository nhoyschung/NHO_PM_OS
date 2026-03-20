import { eq, and, count, sql, lt, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import {
  projects,
  handovers,
  documents,
} from '@/db/schema';
import { financialRecords } from '@/db/schema/operations';
import { auditLogs } from '@/db/schema';
import { projectStageHistory } from '@/db/schema/core';
import type { ComplianceCheck, ComplianceReport } from './types';

// ── Individual Compliance Checks ────────────────────────────────────

/**
 * Check: Every project stage transition has at least one associated handover.
 * Verifies that handover documentation exists for each stage change.
 */
async function checkHandoverPerTransition(
  projectId?: string,
): Promise<ComplianceCheck> {
  const baseWhere = projectId ? eq(projects.id, projectId) : undefined;

  // Count stage transitions
  const stageHistoryCondition = projectId
    ? eq(projectStageHistory.projectId, projectId)
    : undefined;
  const [transitionResult] = await db
    .select({ value: count() })
    .from(projectStageHistory)
    .where(stageHistoryCondition);

  // Count handovers with type 'stage_transition'
  const handoverConditions = [eq(handovers.type, 'stage_transition')];
  if (projectId) {
    handoverConditions.push(eq(handovers.projectId, projectId));
  }
  const [handoverResult] = await db
    .select({ value: count() })
    .from(handovers)
    .where(and(...handoverConditions));

  const transitions = transitionResult?.value ?? 0;
  const handoverCount = handoverResult?.value ?? 0;

  if (transitions === 0) {
    return {
      name: 'Bàn giao theo giai đoạn',
      description: 'Mỗi chuyển giai đoạn dự án phải có ít nhất một bàn giao',
      status: 'pass',
      details: 'Chưa có chuyển giai đoạn nào — không áp dụng.',
    };
  }

  if (handoverCount >= transitions) {
    return {
      name: 'Bàn giao theo giai đoạn',
      description: 'Mỗi chuyển giai đoạn dự án phải có ít nhất một bàn giao',
      status: 'pass',
      details: `${handoverCount}/${transitions} chuyển giai đoạn có bàn giao.`,
    };
  }

  const ratio = handoverCount / transitions;
  return {
    name: 'Bàn giao theo giai đoạn',
    description: 'Mỗi chuyển giai đoạn dự án phải có ít nhất một bàn giao',
    status: ratio >= 0.5 ? 'warning' : 'fail',
    details: `${handoverCount}/${transitions} chuyển giai đoạn có bàn giao. Thiếu ${transitions - handoverCount} bàn giao.`,
  };
}

/**
 * Check: No finance records pending approval for more than 30 days.
 */
async function checkFinanceApproval(
  projectId?: string,
): Promise<ComplianceCheck> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conditions = [
    eq(financialRecords.status, 'pending'),
    lt(financialRecords.createdAt, thirtyDaysAgo),
  ];
  if (projectId) {
    conditions.push(eq(financialRecords.projectId, projectId));
  }

  const [result] = await db
    .select({ value: count() })
    .from(financialRecords)
    .where(and(...conditions));

  const overdue = result?.value ?? 0;

  if (overdue === 0) {
    return {
      name: 'Phê duyệt tài chính',
      description: 'Tất cả bản ghi tài chính phải được duyệt trong 30 ngày',
      status: 'pass',
      details: 'Không có bản ghi tài chính quá hạn phê duyệt.',
    };
  }

  return {
    name: 'Phê duyệt tài chính',
    description: 'Tất cả bản ghi tài chính phải được duyệt trong 30 ngày',
    status: overdue > 5 ? 'fail' : 'warning',
    details: `${overdue} bản ghi tài chính chờ duyệt quá 30 ngày.`,
  };
}

/**
 * Check: All projects have at least one required document uploaded.
 */
async function checkRequiredDocuments(
  projectId?: string,
): Promise<ComplianceCheck> {
  // Get projects and their document counts
  const projectConditions = [eq(projects.isArchived, false)];
  if (projectId) {
    projectConditions.push(eq(projects.id, projectId));
  }

  const [totalProjects] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(...projectConditions));

  // Projects that have at least one document
  const projectsWithDocsQuery = db
    .select({ projectId: documents.projectId })
    .from(documents)
    .where(isNotNull(documents.projectId))
    .groupBy(documents.projectId);

  const projectsWithDocs = await projectsWithDocsQuery;

  const total = totalProjects?.value ?? 0;
  const withDocs = projectId
    ? projectsWithDocs.some((r) => r.projectId === projectId)
      ? 1
      : 0
    : projectsWithDocs.length;

  if (total === 0) {
    return {
      name: 'Tài liệu bắt buộc',
      description: 'Mỗi dự án phải có ít nhất một tài liệu',
      status: 'pass',
      details: 'Không có dự án nào — không áp dụng.',
    };
  }

  if (withDocs >= total) {
    return {
      name: 'Tài liệu bắt buộc',
      description: 'Mỗi dự án phải có ít nhất một tài liệu',
      status: 'pass',
      details: `${withDocs}/${total} dự án có tài liệu đầy đủ.`,
    };
  }

  const missing = total - withDocs;
  return {
    name: 'Tài liệu bắt buộc',
    description: 'Mỗi dự án phải có ít nhất một tài liệu',
    status: missing > total / 2 ? 'fail' : 'warning',
    details: `${withDocs}/${total} dự án có tài liệu. ${missing} dự án thiếu tài liệu.`,
  };
}

/**
 * Check: Audit trail completeness — every mutation entity type has audit logs.
 */
async function checkAuditCompleteness(
  projectId?: string,
): Promise<ComplianceCheck> {
  const mutationActions = ['create', 'update', 'delete', 'approve', 'reject'];

  const conditions = [
    sql`${auditLogs.action} IN (${sql.join(
      mutationActions.map((a) => sql`${a}`),
      sql`, `,
    )})`,
  ];
  if (projectId) {
    conditions.push(eq(auditLogs.projectId, projectId));
  }

  const [mutationResult] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(and(...conditions));

  const mutations = mutationResult?.value ?? 0;

  if (mutations === 0 && !projectId) {
    return {
      name: 'Nhật ký kiểm toán',
      description: 'Mọi thao tác thay đổi dữ liệu phải có nhật ký kiểm toán',
      status: 'warning',
      details: 'Chưa có nhật ký kiểm toán nào cho các thao tác thay đổi dữ liệu.',
    };
  }

  // Check for entity types that have mutations logged
  const entityTypeResult = await db
    .select({ entityType: auditLogs.entityType })
    .from(auditLogs)
    .where(and(...conditions))
    .groupBy(auditLogs.entityType);

  const trackedTypes: string[] = entityTypeResult.map((r) => r.entityType);
  const requiredTypes = ['project', 'task', 'handover', 'document'];
  const missingTypes = requiredTypes.filter((t) => !trackedTypes.includes(t));

  if (missingTypes.length === 0) {
    return {
      name: 'Nhật ký kiểm toán',
      description: 'Mọi thao tác thay đổi dữ liệu phải có nhật ký kiểm toán',
      status: 'pass',
      details: `Tất cả loại thực thể đều được theo dõi. ${mutations} bản ghi kiểm toán.`,
    };
  }

  return {
    name: 'Nhật ký kiểm toán',
    description: 'Mọi thao tác thay đổi dữ liệu phải có nhật ký kiểm toán',
    status: missingTypes.length > 2 ? 'fail' : 'warning',
    details: `Thiếu nhật ký cho: ${missingTypes.join(', ')}. ${mutations} bản ghi hiện có.`,
  };
}

/**
 * Check: RBAC enforcement — no unauthorized actions detected in audit logs.
 * Looks for audit entries by viewer role performing mutation actions.
 */
async function checkRbacEnforcement(
  projectId?: string,
): Promise<ComplianceCheck> {
  const mutationActions = ['create', 'update', 'delete', 'approve', 'reject'];

  const conditions = [
    eq(auditLogs.userRole, 'viewer'),
    sql`${auditLogs.action} IN (${sql.join(
      mutationActions.map((a) => sql`${a}`),
      sql`, `,
    )})`,
  ];
  if (projectId) {
    conditions.push(eq(auditLogs.projectId, projectId));
  }

  const [result] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(and(...conditions));

  const violations = result?.value ?? 0;

  if (violations === 0) {
    return {
      name: 'Kiểm soát RBAC',
      description: 'Không có hành vi vượt quyền trong nhật ký kiểm toán',
      status: 'pass',
      details: 'Không phát hiện hành vi trái phép nào.',
    };
  }

  return {
    name: 'Kiểm soát RBAC',
    description: 'Không có hành vi vượt quyền trong nhật ký kiểm toán',
    status: 'fail',
    details: `Phát hiện ${violations} hành vi nghi vấn vượt quyền bởi vai trò viewer.`,
  };
}

// ── Main Entry Point ────────────────────────────────────────────────

/**
 * Run all compliance checks, optionally scoped to a single project.
 */
export async function runComplianceChecks(
  projectId?: string,
): Promise<ComplianceReport> {
  const checks = await Promise.all([
    checkHandoverPerTransition(projectId),
    checkFinanceApproval(projectId),
    checkRequiredDocuments(projectId),
    checkAuditCompleteness(projectId),
    checkRbacEnforcement(projectId),
  ]);

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const passRate = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 100;

  return {
    checks,
    passRate,
    timestamp: new Date(),
  };
}
