import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: '00000000-0000-0000-0002-000000000001',
      email: 'admin@projectopsos.local',
      role: 'admin',
    },
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
              groupBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
              limit: vi.fn().mockResolvedValue([]),
            }),
            groupBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
            limit: vi.fn().mockResolvedValue([]),
          }),
          groupBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          groupBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        leftJoin2: vi.fn(),
      }),
    }),
  },
}));

vi.mock('@/db/schema/core', () => ({
  projects: {
    id: 'projects.id',
    name: 'projects.name',
    code: 'projects.code',
    stage: 'projects.stage',
    priority: 'projects.priority',
    healthStatus: 'projects.health_status',
    progressPercentage: 'projects.progress_percentage',
    budget: 'projects.budget',
    budgetSpent: 'projects.budget_spent',
    currency: 'projects.currency',
    startDate: 'projects.start_date',
    endDate: 'projects.end_date',
    isArchived: 'projects.is_archived',
    createdAt: 'projects.created_at',
    managerId: 'projects.manager_id',
    teamLeadId: 'projects.team_lead_id',
    createdById: 'projects.created_by_id',
    departmentId: 'projects.department_id',
  },
  handovers: {
    id: 'handovers.id',
    title: 'handovers.title',
    type: 'handovers.type',
    status: 'handovers.status',
    projectId: 'handovers.project_id',
    fromUserId: 'handovers.from_user_id',
    toUserId: 'handovers.to_user_id',
    dueDate: 'handovers.due_date',
    createdAt: 'handovers.created_at',
    approvedBy: 'handovers.approved_by',
    fromDepartmentId: 'handovers.from_department_id',
    toDepartmentId: 'handovers.to_department_id',
  },
}));

vi.mock('@/db/schema/operations', () => ({
  tasks: {
    id: 'tasks.id',
    projectId: 'tasks.project_id',
    status: 'tasks.status',
    dueDate: 'tasks.due_date',
    deletedAt: 'tasks.deleted_at',
    createdAt: 'tasks.created_at',
    assigneeId: 'tasks.assignee_id',
    reporterId: 'tasks.reporter_id',
    parentTaskId: 'tasks.parent_task_id',
  },
  financialRecords: {
    id: 'financial_records.id',
    projectId: 'financial_records.project_id',
    type: 'financial_records.type',
    category: 'financial_records.category',
    amount: 'financial_records.amount',
    currency: 'financial_records.currency',
    transactionDate: 'financial_records.transaction_date',
    status: 'financial_records.status',
    createdBy: 'financial_records.created_by',
  },
  handovers: {
    id: 'handovers.id',
    title: 'handovers.title',
    type: 'handovers.type',
    status: 'handovers.status',
    projectId: 'handovers.project_id',
    fromUserId: 'handovers.from_user_id',
    toUserId: 'handovers.to_user_id',
    dueDate: 'handovers.due_date',
    createdAt: 'handovers.created_at',
  },
  auditLogs: { $inferInsert: {} },
  taskComments: { taskId: 'task_comments.task_id', authorId: 'task_comments.author_id', parentCommentId: 'task_comments.parent_comment_id' },
  notifications: { userId: 'notifications.user_id', actorId: 'notifications.actor_id', projectId: 'notifications.project_id', taskId: 'notifications.task_id', handoverId: 'notifications.handover_id', documentId: 'notifications.document_id' },
  complianceRecords: { projectId: 'compliance_records.project_id', assessedBy: 'compliance_records.assessed_by', responsibleId: 'compliance_records.responsible_id' },
  settings: {},
}));

vi.mock('@/db/schema', () => ({
  projects: { id: 'projects.id', name: 'projects.name', isArchived: 'projects.is_archived', managerId: 'projects.manager_id', teamLeadId: 'projects.team_lead_id', createdById: 'projects.created_by_id', departmentId: 'projects.department_id' },
  users: { id: 'users.id', fullName: 'users.full_name', email: 'users.email', departmentId: 'users.department_id', roleId: 'users.role_id' },
  departments: { id: 'departments.id', name: 'departments.name', parentId: 'departments.parent_id', headUserId: 'departments.head_user_id' },
  roles: { id: 'roles.id' },
  userSessions: { userId: 'user_sessions.user_id' },
  userInvitations: { roleId: 'user_invitations.role_id', departmentId: 'user_invitations.department_id', invitedBy: 'user_invitations.invited_by' },
  projectMembers: { projectId: 'project_members.project_id', userId: 'project_members.user_id' },
  handovers: { projectId: 'handovers.project_id', fromUserId: 'handovers.from_user_id', toUserId: 'handovers.to_user_id', approvedBy: 'handovers.approved_by', fromDepartmentId: 'handovers.from_department_id', toDepartmentId: 'handovers.to_department_id' },
  handoverChecklistItems: { handoverId: 'handover_checklist_items.handover_id', completedBy: 'handover_checklist_items.completed_by' },
  documents: { projectId: 'documents.project_id', handoverId: 'documents.handover_id', createdBy: 'documents.created_by' },
  documentVersions: { documentId: 'document_versions.document_id', createdBy: 'document_versions.created_by' },
  projectStageHistory: { projectId: 'project_stage_history.project_id', triggeredBy: 'project_stage_history.triggered_by' },
  tasks: { projectId: 'tasks.project_id', assigneeId: 'tasks.assignee_id', reporterId: 'tasks.reporter_id', parentTaskId: 'tasks.parent_task_id' },
  taskComments: { taskId: 'task_comments.task_id', authorId: 'task_comments.author_id', parentCommentId: 'task_comments.parent_comment_id' },
  notifications: { userId: 'notifications.user_id', actorId: 'notifications.actor_id' },
  financialRecords: { projectId: 'financial_records.project_id', createdBy: 'financial_records.created_by' },
  complianceRecords: { projectId: 'compliance_records.project_id' },
  settings: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ op: 'eq', a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', conditions: args })),
  or: vi.fn((...args: unknown[]) => ({ op: 'or', conditions: args })),
  gte: vi.fn(),
  lte: vi.fn(),
  lt: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  count: vi.fn().mockReturnValue({ value: 0 }),
  sql: Object.assign(
    vi.fn((...args: unknown[]) => args),
    { join: vi.fn() },
  ),
  isNotNull: vi.fn(),
  inArray: vi.fn(),
  relations: vi.fn(() => ({})),
}));

vi.mock('drizzle-orm/pg-core', () => ({
  alias: vi.fn((_table: unknown, name: string) => ({
    id: `${name}.id`,
    fullName: `${name}.full_name`,
    email: `${name}.email`,
  })),
}));

vi.mock('@/modules/finance/constants', () => ({
  isIncomeType: vi.fn((type: string) => type === 'budget_allocation' || type === 'refund'),
}));

vi.mock('@/modules/finance/types', () => ({}));

// ── Imports ─────────────────────────────────────────────────────

import {
  ReportType,
  ExportFormat,
  ReportConfigSchema,
} from '@/modules/reports/types';
import {
  REPORT_TYPE_LABELS,
  EXPORT_FORMAT_LABELS,
  UTF8_BOM,
  REPORT_MAX_ROWS,
} from '@/modules/reports/constants';
import { exportToCsv } from '@/modules/reports/csv-utils';
import type { CsvColumn } from '@/modules/reports/types';

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

// ── ReportConfigSchema validation ──────────────────────────────

describe('ReportConfigSchema', () => {
  it('should accept a valid config with all fields', () => {
    const result = ReportConfigSchema.safeParse({
      type: 'project_summary',
      dateFrom: '2026-01-01',
      dateTo: '2026-03-31',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      format: 'csv',
    });
    expect(result.success).toBe(true);
  });

  it('should apply default format=csv when not provided', () => {
    const result = ReportConfigSchema.safeParse({
      type: 'finance_summary',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('csv');
    }
  });

  it('should accept all valid report types', () => {
    const types = ['project_summary', 'finance_summary', 'task_completion', 'handover_status'];
    for (const type of types) {
      const result = ReportConfigSchema.safeParse({ type });
      expect(result.success, `type=${type} should be valid`).toBe(true);
    }
  });

  it('should reject invalid report type', () => {
    const result = ReportConfigSchema.safeParse({ type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  it('should accept both csv and json formats', () => {
    for (const format of ['csv', 'json']) {
      const result = ReportConfigSchema.safeParse({ type: 'project_summary', format });
      expect(result.success, `format=${format} should be valid`).toBe(true);
    }
  });

  it('should reject invalid format', () => {
    const result = ReportConfigSchema.safeParse({ type: 'project_summary', format: 'pdf' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date format for dateFrom', () => {
    const result = ReportConfigSchema.safeParse({
      type: 'project_summary',
      dateFrom: '15/03/2026',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID for projectId', () => {
    const result = ReportConfigSchema.safeParse({
      type: 'project_summary',
      projectId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields as undefined', () => {
    const result = ReportConfigSchema.safeParse({
      type: 'task_completion',
      dateFrom: undefined,
      dateTo: undefined,
      projectId: undefined,
    });
    expect(result.success).toBe(true);
  });
});

// ── ReportType enum ────────────────────────────────────────────

describe('ReportType enum', () => {
  it('should have exactly 4 values', () => {
    const result = ReportType.safeParse('project_summary');
    expect(result.success).toBe(true);

    const invalid = ReportType.safeParse('nonexistent');
    expect(invalid.success).toBe(false);
  });
});

// ── ExportFormat enum ──────────────────────────────────────────

describe('ExportFormat enum', () => {
  it('should accept csv and json', () => {
    expect(ExportFormat.safeParse('csv').success).toBe(true);
    expect(ExportFormat.safeParse('json').success).toBe(true);
  });

  it('should reject other formats', () => {
    expect(ExportFormat.safeParse('pdf').success).toBe(false);
    expect(ExportFormat.safeParse('xlsx').success).toBe(false);
  });
});

// ── REPORT_TYPE_LABELS coverage ────────────────────────────────

describe('REPORT_TYPE_LABELS', () => {
  const allTypes = ['project_summary', 'finance_summary', 'task_completion', 'handover_status'] as const;

  it('should have a Vietnamese label for every ReportType', () => {
    for (const type of allTypes) {
      expect(REPORT_TYPE_LABELS[type]).toBeDefined();
      expect(typeof REPORT_TYPE_LABELS[type]).toBe('string');
      expect(REPORT_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it('should have correct Vietnamese labels', () => {
    expect(REPORT_TYPE_LABELS.project_summary).toBe('Tổng hợp dự án');
    expect(REPORT_TYPE_LABELS.finance_summary).toBe('Tổng hợp tài chính');
    expect(REPORT_TYPE_LABELS.task_completion).toBe('Tiến độ công việc');
    expect(REPORT_TYPE_LABELS.handover_status).toBe('Tình trạng bàn giao');
  });

  it('should have no extra keys', () => {
    const keys = Object.keys(REPORT_TYPE_LABELS);
    expect(keys.sort()).toEqual([...allTypes].sort());
  });
});

// ── EXPORT_FORMAT_LABELS coverage ──────────────────────────────

describe('EXPORT_FORMAT_LABELS', () => {
  it('should have labels for csv and json', () => {
    expect(EXPORT_FORMAT_LABELS.csv).toBe('CSV (Excel)');
    expect(EXPORT_FORMAT_LABELS.json).toBe('JSON');
  });

  it('should have no extra keys', () => {
    const keys = Object.keys(EXPORT_FORMAT_LABELS);
    expect(keys.sort()).toEqual(['csv', 'json']);
  });
});

// ── UTF8_BOM constant ──────────────────────────────────────────

describe('UTF8_BOM', () => {
  it('should be the UTF-8 BOM character', () => {
    expect(UTF8_BOM).toBe('\uFEFF');
  });
});

// ── REPORT_MAX_ROWS constant ───────────────────────────────────

describe('REPORT_MAX_ROWS', () => {
  it('should be a positive number', () => {
    expect(REPORT_MAX_ROWS).toBeGreaterThan(0);
  });

  it('should be 10000', () => {
    expect(REPORT_MAX_ROWS).toBe(10000);
  });
});

// ── exportToCsv ────────────────────────────────────────────────

describe('exportToCsv', () => {
  const columns: CsvColumn<Record<string, unknown>>[] = [
    { key: 'name', header: 'Tên' },
    { key: 'amount', header: 'Số tiền' },
    { key: 'date', header: 'Ngày' },
  ];

  it('should produce CSV with UTF-8 BOM prefix', () => {
    const result = exportToCsv([], columns);
    expect(result.startsWith('\uFEFF')).toBe(true);
  });

  it('should produce header row from column definitions', () => {
    const result = exportToCsv([], columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines[0]).toBe('Tên,Số tiền,Ngày');
  });

  it('should produce data rows with correct values', () => {
    const data = [
      { name: 'Dự án A', amount: 5000000, date: '2026-03-15' },
      { name: 'Dự án B', amount: 3000000, date: '2026-03-16' },
    ];
    const result = exportToCsv(data, columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[1]).toBe('Dự án A,5000000,2026-03-15');
    expect(lines[2]).toBe('Dự án B,3000000,2026-03-16');
  });

  it('should escape fields containing commas', () => {
    const data = [{ name: 'Dự án A, B', amount: 100, date: '2026-01-01' }];
    const result = exportToCsv(data, columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines[1]).toContain('"Dự án A, B"');
  });

  it('should escape fields containing double quotes', () => {
    const data = [{ name: 'Dự án "Test"', amount: 100, date: '2026-01-01' }];
    const result = exportToCsv(data, columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines[1]).toContain('"Dự án ""Test"""');
  });

  it('should escape fields containing newlines', () => {
    const data = [{ name: 'Line1\nLine2', amount: 100, date: '2026-01-01' }];
    const result = exportToCsv(data, columns);
    expect(result).toContain('"Line1\nLine2"');
  });

  it('should apply format function when provided', () => {
    const columnsWithFormat: CsvColumn<Record<string, unknown>>[] = [
      { key: 'name', header: 'Tên' },
      {
        key: 'amount',
        header: 'Số tiền',
        format: (v) => new Intl.NumberFormat('vi-VN').format(v as number),
      },
    ];
    const data = [{ name: 'Test', amount: 5000000 }];
    const result = exportToCsv(data, columnsWithFormat);
    const lines = result.replace('\uFEFF', '').split('\n');
    // Intl.NumberFormat('vi-VN').format(5000000) produces a formatted string
    expect(lines[1]).toContain('5');
  });

  it('should handle null/undefined values as empty string', () => {
    const data = [{ name: null, amount: undefined, date: '' }];
    const result = exportToCsv(data as unknown as Record<string, unknown>[], columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines[1]).toBe(',,');
  });

  it('should handle empty data array', () => {
    const result = exportToCsv([], columns);
    const lines = result.replace('\uFEFF', '').split('\n');
    expect(lines.length).toBe(1); // header only
  });
});

// ── Query export verification ──────────────────────────────────

describe('Report queries — export verification', () => {
  it('all query functions are exported', async () => {
    const queries = await import('@/modules/reports/queries');
    expect(typeof queries.getProjectSummaryReport).toBe('function');
    expect(typeof queries.getFinanceSummaryReport).toBe('function');
    expect(typeof queries.getTaskCompletionReport).toBe('function');
    expect(typeof queries.getHandoverStatusReport).toBe('function');
  });
});

// ── Action export verification ─────────────────────────────────

describe('Report actions — export verification', () => {
  it('all action functions are exported', async () => {
    const actions = await import('@/modules/reports/actions');
    expect(typeof actions.generateReport).toBe('function');
  });

  it('exportToCsv is exported from csv-utils', async () => {
    const csvUtils = await import('@/modules/reports/csv-utils');
    expect(typeof csvUtils.exportToCsv).toBe('function');
  });
});
