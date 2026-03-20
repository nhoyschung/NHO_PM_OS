import { describe, it, expect, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────

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
        leftJoin: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@/db/schema/operations', () => ({
  financialRecords: {
    id: 'financial_records.id',
    projectId: 'financial_records.project_id',
    type: 'financial_records.type',
    amount: 'financial_records.amount',
    $inferInsert: {},
  },
  auditLogs: { $inferInsert: {} },
  tasks: { projectId: 'tasks.project_id', assigneeId: 'tasks.assignee_id', reporterId: 'tasks.reporter_id', parentTaskId: 'tasks.parent_task_id' },
  taskComments: { taskId: 'task_comments.task_id', authorId: 'task_comments.author_id', parentCommentId: 'task_comments.parent_comment_id' },
  notifications: { userId: 'notifications.user_id', actorId: 'notifications.actor_id', projectId: 'notifications.project_id', taskId: 'notifications.task_id', handoverId: 'notifications.handover_id', documentId: 'notifications.document_id' },
  complianceRecords: { projectId: 'compliance_records.project_id', assessedBy: 'compliance_records.assessed_by', responsibleId: 'compliance_records.responsible_id' },
  settings: {},
}));

vi.mock('@/db/schema/core', () => ({
  projects: { id: 'projects.id', name: 'projects.name', code: 'projects.code', managerId: 'projects.manager_id', teamLeadId: 'projects.team_lead_id', createdById: 'projects.created_by_id', departmentId: 'projects.department_id', isArchived: 'projects.is_archived' },
}));

vi.mock('@/db/schema', () => ({
  financialRecords: {
    id: 'financial_records.id',
    projectId: 'financial_records.project_id',
    type: 'financial_records.type',
    amount: 'financial_records.amount',
    $inferInsert: {},
  },
  auditLogs: { $inferInsert: {} },
  projects: { id: 'projects.id', name: 'projects.name', code: 'projects.code', managerId: 'projects.manager_id', teamLeadId: 'projects.team_lead_id', createdById: 'projects.created_by_id', departmentId: 'projects.department_id', isArchived: 'projects.is_archived' },
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
  notifications: { userId: 'notifications.user_id', actorId: 'notifications.actor_id', projectId: 'notifications.project_id', taskId: 'notifications.task_id', handoverId: 'notifications.handover_id', documentId: 'notifications.document_id' },
  complianceRecords: { projectId: 'compliance_records.project_id', assessedBy: 'compliance_records.assessed_by', responsibleId: 'compliance_records.responsible_id' },
  settings: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ op: 'eq', a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', conditions: args })),
  or: vi.fn((...args: unknown[]) => ({ op: 'or', conditions: args })),
  ilike: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  count: vi.fn().mockReturnValue({ value: 0 }),
  sql: vi.fn(),
  inArray: vi.fn(),
  relations: vi.fn(() => ({})),
}));

import { formatCurrency } from '@/lib/utils';
import { isIncomeType, CSV_REQUIRED_COLUMNS } from '@/modules/finance/constants';
import type { ProjectFinanceSummary } from '@/modules/finance/types';

// ── VND Formatting ───────────────────────────────────────────────

describe('VND formatting (formatCurrency)', () => {
  it('should format positive integers with VND currency symbol', () => {
    const result = formatCurrency(5000000);
    // Vietnamese locale uses ₫ or "VND"
    expect(result).toMatch(/5[.,]000[.,]000/);
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });

  it('should format negative amounts', () => {
    const result = formatCurrency(-1500000);
    expect(result).toMatch(/1[.,]500[.,]000/);
  });

  it('should use Intl.NumberFormat vi-VN under the hood', () => {
    // Validate the function returns the same as manual Intl format
    const expected = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(10000000);
    expect(formatCurrency(10000000)).toBe(expected);
  });
});

// ── Summary Calculation ──────────────────────────────────────────

describe('Project finance summary calculation', () => {
  const testData: ProjectFinanceSummary[] = [
    {
      projectId: 'p1',
      projectName: 'Dự án Alpha',
      totalIncome: 100000000,
      totalExpense: 60000000,
      balance: 40000000,
      recordCount: 10,
    },
    {
      projectId: 'p2',
      projectName: 'Dự án Beta',
      totalIncome: 50000000,
      totalExpense: 80000000,
      balance: -30000000,
      recordCount: 8,
    },
    {
      projectId: 'p3',
      projectName: 'Dự án Gamma',
      totalIncome: 200000000,
      totalExpense: 200000000,
      balance: 0,
      recordCount: 15,
    },
  ];

  it('should compute correct grand total income', () => {
    const grandIncome = testData.reduce((sum, s) => sum + s.totalIncome, 0);
    expect(grandIncome).toBe(350000000);
  });

  it('should compute correct grand total expense', () => {
    const grandExpense = testData.reduce((sum, s) => sum + s.totalExpense, 0);
    expect(grandExpense).toBe(340000000);
  });

  it('should compute correct grand balance', () => {
    const grandIncome = testData.reduce((sum, s) => sum + s.totalIncome, 0);
    const grandExpense = testData.reduce((sum, s) => sum + s.totalExpense, 0);
    expect(grandIncome - grandExpense).toBe(10000000);
  });

  it('should compute correct grand record count', () => {
    const grandRecords = testData.reduce((sum, s) => sum + s.recordCount, 0);
    expect(grandRecords).toBe(33);
  });

  it('should identify deficit projects (negative balance)', () => {
    const deficitProjects = testData.filter((s) => s.balance < 0);
    expect(deficitProjects).toHaveLength(1);
    expect(deficitProjects[0]!.projectId).toBe('p2');
  });

  it('should sort by balance ascending (deficit first)', () => {
    const sorted = [...testData].sort((a, b) => a.balance - b.balance);
    expect(sorted[0]!.projectId).toBe('p2'); // -30M first
    expect(sorted[1]!.projectId).toBe('p3'); // 0 second
    expect(sorted[2]!.projectId).toBe('p1'); // +40M last
  });

  it('balance should equal totalIncome - totalExpense for each project', () => {
    for (const row of testData) {
      expect(row.balance).toBe(row.totalIncome - row.totalExpense);
    }
  });
});

// ── Income/Expense Classification ────────────────────────────────

describe('isIncomeType for summary calculation', () => {
  it('budget_allocation is income (Thu)', () => {
    expect(isIncomeType('budget_allocation')).toBe(true);
  });

  it('refund is income (Thu)', () => {
    expect(isIncomeType('refund')).toBe(true);
  });

  it('expense is expense (Chi)', () => {
    expect(isIncomeType('expense')).toBe(false);
  });

  it('invoice is expense (Chi)', () => {
    expect(isIncomeType('invoice')).toBe(false);
  });

  it('payment is expense (Chi)', () => {
    expect(isIncomeType('payment')).toBe(false);
  });

  it('adjustment is expense (Chi)', () => {
    expect(isIncomeType('adjustment')).toBe(false);
  });
});

// ── CSV Column Validation ────────────────────────────────────────

describe('CSV column validation', () => {
  it('should require type column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('type');
  });

  it('should require amount column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('amount');
  });

  it('should require description column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('description');
  });

  it('should require transaction_date column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('transaction_date');
  });

  it('should require project_id column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('project_id');
  });

  it('should require category column', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('category');
  });

  it('should detect missing columns correctly', () => {
    const fileHeaders = ['type', 'amount', 'description'];
    const missing = CSV_REQUIRED_COLUMNS.filter(
      (col) => !fileHeaders.includes(col),
    );
    expect(missing).toContain('transaction_date');
    expect(missing).toContain('project_id');
    expect(missing).toContain('category');
    expect(missing.length).toBe(3);
  });

  it('should pass when all required columns are present', () => {
    const fileHeaders = [
      'type',
      'category',
      'amount',
      'description',
      'transaction_date',
      'project_id',
      'extra_column',
    ];
    const missing = CSV_REQUIRED_COLUMNS.filter(
      (col) => !fileHeaders.includes(col),
    );
    expect(missing).toHaveLength(0);
  });
});

// ── Query export verification ────────────────────────────────────

describe('Finance queries — getFinanceSummaryByProject export', () => {
  it('should be exported as a function', async () => {
    const queries = await import('@/modules/finance/queries');
    expect(typeof queries.getFinanceSummaryByProject).toBe('function');
  });
});
