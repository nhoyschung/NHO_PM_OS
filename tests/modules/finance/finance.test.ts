import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks for action imports ──────────────────────────────────────

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

const mockInsertChain = {
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([{
      id: '00000000-0000-0000-0003-000000000010',
      description: 'Chi phí test',
      projectId: '00000000-0000-0000-0001-000000000001',
      status: 'pending',
    }]),
  }),
};

const mockSelectChain = {
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([{
        id: '00000000-0000-0000-0003-000000000010',
        description: 'Chi phí test',
        projectId: '00000000-0000-0000-0001-000000000001',
        status: 'pending',
      }]),
    }),
  }),
};

const mockUpdateChain = {
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
};

const mockDeleteChain = {
  where: vi.fn().mockResolvedValue([]),
};

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue(mockInsertChain),
    select: vi.fn().mockReturnValue(mockSelectChain),
    update: vi.fn().mockReturnValue(mockUpdateChain),
    delete: vi.fn().mockReturnValue(mockDeleteChain),
  },
}));

const mockFinancialRecords = {
  id: 'financial_records.id',
  projectId: 'financial_records.project_id',
  type: 'financial_records.type',
  category: 'financial_records.category',
  amount: 'financial_records.amount',
  currency: 'financial_records.currency',
  description: 'financial_records.description',
  referenceNumber: 'financial_records.reference_number',
  transactionDate: 'financial_records.transaction_date',
  status: 'financial_records.status',
  approvedBy: 'financial_records.approved_by',
  approvedAt: 'financial_records.approved_at',
  createdBy: 'financial_records.created_by',
  createdAt: 'financial_records.created_at',
  updatedAt: 'financial_records.updated_at',
  $inferInsert: {},
};

const mockAuditLogs = {
  $inferInsert: {},
  userId: 'audit_logs.user_id',
  action: 'audit_logs.action',
  entityType: 'audit_logs.entity_type',
};

vi.mock('@/db/schema/operations', () => ({
  financialRecords: mockFinancialRecords,
  auditLogs: mockAuditLogs,
  tasks: { projectId: 'tasks.project_id', assigneeId: 'tasks.assignee_id', reporterId: 'tasks.reporter_id', parentTaskId: 'tasks.parent_task_id' },
  taskComments: { taskId: 'task_comments.task_id', authorId: 'task_comments.author_id', parentCommentId: 'task_comments.parent_comment_id' },
  notifications: { userId: 'notifications.user_id', actorId: 'notifications.actor_id', projectId: 'notifications.project_id', taskId: 'notifications.task_id', handoverId: 'notifications.handover_id', documentId: 'notifications.document_id' },
  complianceRecords: { projectId: 'compliance_records.project_id', assessedBy: 'compliance_records.assessed_by', responsibleId: 'compliance_records.responsible_id' },
  settings: {},
}));

vi.mock('@/db/schema', () => ({
  financialRecords: mockFinancialRecords,
  auditLogs: mockAuditLogs,
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

import {
  createFinanceRecordSchema,
  updateFinanceRecordSchema,
  approveFinanceRecordSchema,
  rejectFinanceRecordSchema,
  csvRowSchema,
  financeFiltersSchema,
  financeStatusTransitionSchema,
} from '@/modules/finance/validation';
import {
  FINANCE_TYPE_LABELS,
  FINANCE_STATUS_LABELS,
  FINANCE_STATUS_COLORS,
  FINANCE_CATEGORY_LABELS,
  CSV_REQUIRED_COLUMNS,
  PERMISSIONS,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  isIncomeType,
  INCOME_TYPES,
  EXPENSE_TYPES,
} from '@/modules/finance/constants';
import { FinancialType, FinancialStatus, FinancialCategory } from '@/modules/finance/types';

// ── Validation: createFinanceRecordSchema ────────────────────────

describe('createFinanceRecordSchema', () => {
  const validInput = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'expense' as const,
    category: 'labor' as const,
    amount: 5000000,
    currency: 'VND',
    description: 'Chi phí nhân công tháng 3/2026',
    transactionDate: '2026-03-15',
  };

  it('should accept valid data', () => {
    const result = createFinanceRecordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default category=other when not provided', () => {
    const { category, ...withoutCategory } = validInput;
    const result = createFinanceRecordSchema.safeParse(withoutCategory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('other');
    }
  });

  it('should apply default currency=VND when not provided', () => {
    const { currency, ...withoutCurrency } = validInput;
    const result = createFinanceRecordSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('VND');
    }
  });

  it('should reject amount=0', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, amount: -1000 });
    expect(result.success).toBe(false);
  });

  it('should reject description shorter than 3 chars', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, description: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid projectId UUID', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type enum', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, type: 'unknown_type' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date format', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, transactionDate: '15/03/2026' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid type values', () => {
    const types: FinancialType[] = ['budget_allocation', 'expense', 'invoice', 'payment', 'refund', 'adjustment'];
    for (const type of types) {
      const result = createFinanceRecordSchema.safeParse({ ...validInput, type });
      expect(result.success, `type=${type} should be valid`).toBe(true);
    }
  });

  it('should reject currency length != 3', () => {
    const result = createFinanceRecordSchema.safeParse({ ...validInput, currency: 'US' });
    expect(result.success).toBe(false);
  });

  it('should accept optional referenceNumber', () => {
    const result = createFinanceRecordSchema.safeParse({
      ...validInput,
      referenceNumber: 'INV-2026-001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referenceNumber).toBe('INV-2026-001');
    }
  });

  it('should reject referenceNumber longer than 100 chars', () => {
    const result = createFinanceRecordSchema.safeParse({
      ...validInput,
      referenceNumber: 'X'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// ── Validation: updateFinanceRecordSchema ────────────────────────

describe('updateFinanceRecordSchema', () => {
  it('should accept empty object (all partial)', () => {
    const result = updateFinanceRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial update with only amount', () => {
    const result = updateFinanceRecordSchema.safeParse({ amount: 1000 });
    expect(result.success).toBe(true);
  });

  it('should still reject invalid amount when provided', () => {
    const result = updateFinanceRecordSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it('should still reject invalid description when provided', () => {
    const result = updateFinanceRecordSchema.safeParse({ description: 'AB' });
    expect(result.success).toBe(false);
  });
});

// ── Validation: approveFinanceRecordSchema ───────────────────────

describe('approveFinanceRecordSchema', () => {
  it('should accept valid recordId', () => {
    const result = approveFinanceRecordSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('should accept with optional notes', () => {
    const result = approveFinanceRecordSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      notes: 'Đã xác nhận với kế toán.',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = approveFinanceRecordSchema.safeParse({ recordId: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ── Validation: rejectFinanceRecordSchema ────────────────────────

describe('rejectFinanceRecordSchema', () => {
  it('should accept valid recordId and reason', () => {
    const result = rejectFinanceRecordSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'Số tiền không khớp với hóa đơn.',
    });
    expect(result.success).toBe(true);
  });

  it('should reject reason shorter than 3 chars', () => {
    const result = rejectFinanceRecordSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'AB',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing reason', () => {
    const result = rejectFinanceRecordSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});

// ── Validation: csvRowSchema ─────────────────────────────────────

describe('csvRowSchema', () => {
  const validRow = {
    type: 'expense',
    category: 'labor',
    amount: '5000000',
    description: 'Chi phí nhân công',
    transaction_date: '2026-03-15',
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    currency: 'VND',
  };

  it('should accept valid CSV row', () => {
    const result = csvRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('should coerce string amount to number', () => {
    const result = csvRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.amount).toBe('number');
      expect(result.data.amount).toBe(5000000);
    }
  });

  it('should reject amount=0', () => {
    const result = csvRowSchema.safeParse({ ...validRow, amount: '0' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid project_id', () => {
    const result = csvRowSchema.safeParse({ ...validRow, project_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = csvRowSchema.safeParse({ ...validRow, type: 'unknown' });
    expect(result.success).toBe(false);
  });
});

// ── Validation: financeFiltersSchema ─────────────────────────────

describe('financeFiltersSchema', () => {
  it('should apply defaults when empty', () => {
    const result = financeFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sortBy).toBe('transaction_date');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should reject page < 1', () => {
    const result = financeFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    const result = financeFiltersSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('should accept valid sortBy values', () => {
    const validSortBys = ['transaction_date', 'created_at', 'updated_at', 'amount', 'type', 'status'];
    for (const sortBy of validSortBys) {
      const result = financeFiltersSchema.safeParse({ sortBy });
      expect(result.success, `sortBy=${sortBy} should be valid`).toBe(true);
    }
  });

  it('should reject invalid sortBy value', () => {
    const result = financeFiltersSchema.safeParse({ sortBy: 'invalid_column' });
    expect(result.success).toBe(false);
  });
});

// ── Approval workflow: status transitions ────────────────────────

describe('financeStatusTransitionSchema', () => {
  it('should allow pending -> approved', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'pending',
      toStatus: 'approved',
    });
    expect(result.success).toBe(true);
  });

  it('should allow pending -> rejected', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'pending',
      toStatus: 'rejected',
    });
    expect(result.success).toBe(true);
  });

  it('should allow approved -> processed', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'approved',
      toStatus: 'processed',
    });
    expect(result.success).toBe(true);
  });

  it('should reject rejected -> approved (terminal state)', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'rejected',
      toStatus: 'approved',
    });
    expect(result.success).toBe(false);
  });

  it('should reject processed -> pending', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'processed',
      toStatus: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('should reject same-status self-transition', () => {
    const result = financeStatusTransitionSchema.safeParse({
      recordId: '550e8400-e29b-41d4-a716-446655440001',
      fromStatus: 'pending',
      toStatus: 'pending',
    });
    expect(result.success).toBe(false);
  });
});

// ── Constants: label coverage ────────────────────────────────────

describe('FINANCE_TYPE_LABELS coverage', () => {
  const allTypes: FinancialType[] = [
    'budget_allocation', 'expense', 'invoice', 'payment', 'refund', 'adjustment',
  ];

  it('should have a label for every FinancialType', () => {
    for (const type of allTypes) {
      expect(FINANCE_TYPE_LABELS[type]).toBeDefined();
      expect(typeof FINANCE_TYPE_LABELS[type]).toBe('string');
      expect(FINANCE_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it('should have no extra keys beyond the enum', () => {
    const labelKeys = Object.keys(FINANCE_TYPE_LABELS);
    expect(labelKeys.sort()).toEqual(allTypes.sort());
  });
});

describe('FINANCE_STATUS_LABELS coverage', () => {
  const allStatuses: FinancialStatus[] = ['pending', 'approved', 'rejected', 'processed'];

  it('should have a label for every FinancialStatus', () => {
    for (const status of allStatuses) {
      expect(FINANCE_STATUS_LABELS[status]).toBeDefined();
    }
  });

  it('should use Vietnamese labels', () => {
    expect(FINANCE_STATUS_LABELS.pending).toBe('Chờ duyệt');
    expect(FINANCE_STATUS_LABELS.approved).toBe('Đã duyệt');
    expect(FINANCE_STATUS_LABELS.rejected).toBe('Từ chối');
  });
});

describe('FINANCE_STATUS_COLORS coverage', () => {
  const allStatuses: FinancialStatus[] = ['pending', 'approved', 'rejected', 'processed'];

  it('should have bg and text Tailwind classes for every status', () => {
    for (const status of allStatuses) {
      const colors = FINANCE_STATUS_COLORS[status];
      expect(colors).toBeDefined();
      expect(colors.bg).toMatch(/^bg-[a-z]+-\d{2,3}$/);
      expect(colors.text).toMatch(/^text-[a-z]+-\d{2,3}$/);
    }
  });
});

describe('FINANCE_CATEGORY_LABELS coverage', () => {
  const allCategories: FinancialCategory[] = [
    'labor', 'software', 'hardware', 'infrastructure', 'consulting', 'training', 'travel', 'other',
  ];

  it('should have a label for every FinancialCategory', () => {
    for (const cat of allCategories) {
      expect(FINANCE_CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof FINANCE_CATEGORY_LABELS[cat]).toBe('string');
    }
  });
});

// ── Constants: income / expense classification ────────────────────

describe('isIncomeType', () => {
  it('should classify budget_allocation as income', () => {
    expect(isIncomeType('budget_allocation')).toBe(true);
  });

  it('should classify refund as income', () => {
    expect(isIncomeType('refund')).toBe(true);
  });

  it('should classify expense as NOT income', () => {
    expect(isIncomeType('expense')).toBe(false);
  });

  it('should classify invoice as NOT income', () => {
    expect(isIncomeType('invoice')).toBe(false);
  });

  it('INCOME_TYPES + EXPENSE_TYPES should cover all FinancialType values', () => {
    const allTypes: FinancialType[] = [
      'budget_allocation', 'expense', 'invoice', 'payment', 'refund', 'adjustment',
    ];
    const combined = [...INCOME_TYPES, ...EXPENSE_TYPES] as string[];
    for (const type of allTypes) {
      expect(combined).toContain(type);
    }
  });
});

// ── Constants: CSV required columns ──────────────────────────────

describe('CSV_REQUIRED_COLUMNS', () => {
  it('should include all mandatory fields', () => {
    expect(CSV_REQUIRED_COLUMNS).toContain('type');
    expect(CSV_REQUIRED_COLUMNS).toContain('amount');
    expect(CSV_REQUIRED_COLUMNS).toContain('description');
    expect(CSV_REQUIRED_COLUMNS).toContain('transaction_date');
    expect(CSV_REQUIRED_COLUMNS).toContain('project_id');
  });

  it('should have at least 5 required columns', () => {
    expect(CSV_REQUIRED_COLUMNS.length).toBeGreaterThanOrEqual(5);
  });
});

// ── Constants: pagination ────────────────────────────────────────

describe('Pagination constants', () => {
  it('DEFAULT_PER_PAGE should be a positive number', () => {
    expect(DEFAULT_PER_PAGE).toBeGreaterThan(0);
  });

  it('MAX_PER_PAGE should be >= DEFAULT_PER_PAGE', () => {
    expect(MAX_PER_PAGE).toBeGreaterThanOrEqual(DEFAULT_PER_PAGE);
  });
});

// ── Constants: permissions ───────────────────────────────────────

describe('PERMISSIONS', () => {
  it('should follow resource:action naming pattern', () => {
    for (const key of Object.keys(PERMISSIONS)) {
      const value = PERMISSIONS[key as keyof typeof PERMISSIONS];
      expect(value).toMatch(/^finance:[a-z_]+$/);
    }
  });

  it('should include FINANCE_APPROVE permission', () => {
    expect(PERMISSIONS.FINANCE_APPROVE).toBe('finance:approve');
  });
});

// ── Action exports ────────────────────────────────────────────────

describe('Finance actions — export verification', () => {
  it('all action functions are exported', async () => {
    const actions = await import('@/modules/finance/actions');
    expect(typeof actions.createFinanceRecord).toBe('function');
    expect(typeof actions.updateFinanceRecord).toBe('function');
    expect(typeof actions.approveFinanceRecord).toBe('function');
    expect(typeof actions.rejectFinanceRecord).toBe('function');
    expect(typeof actions.importCsv).toBe('function');
    expect(typeof actions.deleteFinanceRecord).toBe('function');
  });
});

// ── Query exports ─────────────────────────────────────────────────

describe('Finance queries — export verification', () => {
  it('all query functions are exported', async () => {
    const queries = await import('@/modules/finance/queries');
    expect(typeof queries.getFinanceRecords).toBe('function');
    expect(typeof queries.getFinanceRecordById).toBe('function');
    expect(typeof queries.getFinanceByProject).toBe('function');
    expect(typeof queries.getFinanceSummary).toBe('function');
  });
});
