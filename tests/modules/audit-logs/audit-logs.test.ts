import { describe, it, expect, vi } from 'vitest';

// ── Mock server-only dependencies ────────────────────────────────
// Required to allow import of actions.ts ('use server') in test environment.

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: '00000000-0000-0000-0002-000000000001', email: 'test@test.com', role: 'admin' },
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => {
  const insertChain = {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: '00000000-0000-0000-0001-000000000001' }]),
    }),
  };
  return {
    db: {
      insert: vi.fn().mockReturnValue(insertChain),
    },
  };
});

vi.mock('@/db/schema', () => ({
  auditLogs: {
    $inferInsert: {},
  },
}));

import {
  createAuditLogSchema,
  auditLogFiltersSchema,
} from '@/modules/audit-logs/validation';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  ENTITY_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  PERMISSIONS,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
} from '@/modules/audit-logs/constants';
import { AuditAction, AuditEntityType, AuditSeverity } from '@/modules/audit-logs/types';

// ═══════════════════════════════════════════════════════════════════
// Section 1: Constants validation
// ═══════════════════════════════════════════════════════════════════

describe('AUDIT_ACTION_LABELS', () => {
  const allActions = AuditAction.options;

  it('should have an entry for every AuditAction enum value', () => {
    for (const action of allActions) {
      expect(AUDIT_ACTION_LABELS).toHaveProperty(action);
      expect(typeof AUDIT_ACTION_LABELS[action as keyof typeof AUDIT_ACTION_LABELS]).toBe('string');
    }
  });

  it('should not have extra keys beyond defined AuditAction values', () => {
    const labelKeys = Object.keys(AUDIT_ACTION_LABELS);
    expect(labelKeys).toHaveLength(allActions.length);
  });

  it('should have non-empty Vietnamese labels', () => {
    for (const action of allActions) {
      const label = AUDIT_ACTION_LABELS[action as keyof typeof AUDIT_ACTION_LABELS];
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('AUDIT_ACTION_COLORS', () => {
  const allActions = AuditAction.options;

  it('should have an entry for every AuditAction enum value', () => {
    for (const action of allActions) {
      expect(AUDIT_ACTION_COLORS).toHaveProperty(action);
    }
  });

  it('should have bg and text keys for each color entry', () => {
    for (const action of allActions) {
      const color = AUDIT_ACTION_COLORS[action as keyof typeof AUDIT_ACTION_COLORS];
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
    }
  });

  it('should follow Tailwind bg pattern (bg-{color}-{shade})', () => {
    const bgPattern = /^bg-[a-z]+-\d{2,3}$/;
    for (const action of allActions) {
      const color = AUDIT_ACTION_COLORS[action as keyof typeof AUDIT_ACTION_COLORS];
      expect(color.bg).toMatch(bgPattern);
    }
  });

  it('should follow Tailwind text pattern (text-{color}-{shade})', () => {
    const textPattern = /^text-[a-z]+-\d{2,3}$/;
    for (const action of allActions) {
      const color = AUDIT_ACTION_COLORS[action as keyof typeof AUDIT_ACTION_COLORS];
      expect(color.text).toMatch(textPattern);
    }
  });
});

describe('ENTITY_TYPE_LABELS', () => {
  const allEntityTypes = AuditEntityType.options;

  it('should have an entry for every AuditEntityType enum value', () => {
    for (const entityType of allEntityTypes) {
      expect(ENTITY_TYPE_LABELS).toHaveProperty(entityType);
    }
  });

  it('should not have extra keys beyond defined AuditEntityType values', () => {
    const labelKeys = Object.keys(ENTITY_TYPE_LABELS);
    expect(labelKeys).toHaveLength(allEntityTypes.length);
  });
});

describe('SEVERITY_LABELS and SEVERITY_COLORS', () => {
  const allSeverities = AuditSeverity.options;

  it('SEVERITY_LABELS should have entry for every severity', () => {
    for (const severity of allSeverities) {
      expect(SEVERITY_LABELS).toHaveProperty(severity);
    }
  });

  it('SEVERITY_COLORS should have bg and text for every severity', () => {
    for (const severity of allSeverities) {
      const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS];
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
    }
  });
});

describe('PERMISSIONS', () => {
  it('should follow resource:action naming pattern', () => {
    const pattern = /^[a-z_]+:[a-z_]+$/;
    for (const key of Object.values(PERMISSIONS)) {
      expect(key).toMatch(pattern);
    }
  });

  it('should include AUDIT_LOG_READ and AUDIT_LOG_EXPORT', () => {
    expect(PERMISSIONS.AUDIT_LOG_READ).toBe('audit_log:read');
    expect(PERMISSIONS.AUDIT_LOG_EXPORT).toBe('audit_log:export');
  });
});

describe('Pagination constants', () => {
  it('DEFAULT_PER_PAGE should be a positive integer', () => {
    expect(DEFAULT_PER_PAGE).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_PER_PAGE)).toBe(true);
  });

  it('MAX_PER_PAGE should be >= DEFAULT_PER_PAGE', () => {
    expect(MAX_PER_PAGE).toBeGreaterThanOrEqual(DEFAULT_PER_PAGE);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Section 2: Zod schema validation (filter schema)
// ═══════════════════════════════════════════════════════════════════

describe('auditLogFiltersSchema', () => {
  it('should apply default page=1 when not provided', () => {
    const result = auditLogFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it('should apply default perPage=20 when not provided', () => {
    const result = auditLogFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perPage).toBe(20);
    }
  });

  it('should apply default sortBy=created_at when not provided', () => {
    const result = auditLogFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('created_at');
    }
  });

  it('should apply default sortOrder=desc when not provided', () => {
    const result = auditLogFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should accept valid action filter', () => {
    const result = auditLogFiltersSchema.safeParse({ action: 'create' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid action value', () => {
    const result = auditLogFiltersSchema.safeParse({ action: 'invalid_action' });
    expect(result.success).toBe(false);
  });

  it('should accept valid entityType filter', () => {
    const result = auditLogFiltersSchema.safeParse({ entityType: 'project' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid entityType value', () => {
    const result = auditLogFiltersSchema.safeParse({ entityType: 'invalid_entity' });
    expect(result.success).toBe(false);
  });

  it('should accept valid severity filter', () => {
    const result = auditLogFiltersSchema.safeParse({ severity: 'critical' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid severity value', () => {
    const result = auditLogFiltersSchema.safeParse({ severity: 'fatal' });
    expect(result.success).toBe(false);
  });

  it('should reject page < 1', () => {
    const result = auditLogFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    const result = auditLogFiltersSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('should accept optional userId filter (valid UUID)', () => {
    const result = auditLogFiltersSchema.safeParse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID for userId', () => {
    const result = auditLogFiltersSchema.safeParse({ userId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid sortBy values', () => {
    const validValues = ['created_at', 'action', 'entity_type', 'severity'];
    for (const sortBy of validValues) {
      const result = auditLogFiltersSchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid sortBy value', () => {
    const result = auditLogFiltersSchema.safeParse({ sortBy: 'name' });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Section 3: createAuditLogSchema validation
// ═══════════════════════════════════════════════════════════════════

describe('createAuditLogSchema', () => {
  const validInput = {
    action: 'create' as const,
    entityType: 'project' as const,
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    entityName: 'Dự án Hệ thống Quản lý',
    userId: '550e8400-e29b-41d4-a716-446655440002',
  };

  it('should accept valid minimal input', () => {
    const result = createAuditLogSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default severity=info when not provided', () => {
    const result = createAuditLogSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe('info');
    }
  });

  it('should accept all valid severity values', () => {
    const severities = ['info', 'warning', 'critical'];
    for (const severity of severities) {
      const result = createAuditLogSchema.safeParse({ ...validInput, severity });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid action value', () => {
    const result = createAuditLogSchema.safeParse({ ...validInput, action: 'modify' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid entityType value', () => {
    const result = createAuditLogSchema.safeParse({ ...validInput, entityType: 'resource' });
    expect(result.success).toBe(false);
  });

  it('should require action field', () => {
    const { action, ...withoutAction } = validInput;
    const result = createAuditLogSchema.safeParse(withoutAction);
    expect(result.success).toBe(false);
  });

  it('should require entityType field', () => {
    const { entityType, ...withoutEntityType } = validInput;
    const result = createAuditLogSchema.safeParse(withoutEntityType);
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Section 4: APPEND-ONLY enforcement — module export verification
// ═══════════════════════════════════════════════════════════════════

describe('Append-only enforcement', () => {
  it('actions module should NOT export updateAuditLogAction', async () => {
    const actionsModule = await import('@/modules/audit-logs/actions');
    expect((actionsModule as Record<string, unknown>).updateAuditLogAction).toBeUndefined();
  });

  it('actions module should NOT export deleteAuditLogAction', async () => {
    const actionsModule = await import('@/modules/audit-logs/actions');
    expect((actionsModule as Record<string, unknown>).deleteAuditLogAction).toBeUndefined();
  });

  it('actions module should export createAuditLogAction', async () => {
    const actionsModule = await import('@/modules/audit-logs/actions');
    expect(typeof actionsModule.createAuditLogAction).toBe('function');
  });

  it('actions module should export createAuditLog helper', async () => {
    const actionsModule = await import('@/modules/audit-logs/actions');
    expect(typeof actionsModule.createAuditLog).toBe('function');
  });

  it('queries module should NOT export updateAuditLog', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect((queriesModule as Record<string, unknown>).updateAuditLog).toBeUndefined();
  });

  it('queries module should NOT export deleteAuditLog', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect((queriesModule as Record<string, unknown>).deleteAuditLog).toBeUndefined();
  });

  it('queries module should export getAuditLogs', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect(typeof queriesModule.getAuditLogs).toBe('function');
  });

  it('queries module should export getAuditLogsByEntity', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect(typeof queriesModule.getAuditLogsByEntity).toBe('function');
  });

  it('queries module should export getAuditLogsByUser', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect(typeof queriesModule.getAuditLogsByUser).toBe('function');
  });

  it('queries module should export getRecentActivity', async () => {
    const queriesModule = await import('@/modules/audit-logs/queries');
    expect(typeof queriesModule.getRecentActivity).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Section 5: AuditAction enum coverage
// ═══════════════════════════════════════════════════════════════════

describe('AuditAction enum', () => {
  it('should have exactly 21 values', () => {
    expect(AuditAction.options).toHaveLength(21);
  });

  it('should include all expected auth actions', () => {
    expect(AuditAction.options).toContain('login');
    expect(AuditAction.options).toContain('logout');
    expect(AuditAction.options).toContain('login_failed');
  });

  it('should include all CRUD actions', () => {
    expect(AuditAction.options).toContain('create');
    expect(AuditAction.options).toContain('read');
    expect(AuditAction.options).toContain('update');
    expect(AuditAction.options).toContain('delete');
  });

  it('should include permission actions', () => {
    expect(AuditAction.options).toContain('permission_grant');
    expect(AuditAction.options).toContain('permission_revoke');
  });
});

describe('AuditEntityType enum', () => {
  it('should have exactly 10 values', () => {
    expect(AuditEntityType.options).toHaveLength(10);
  });

  it('should include all core entity types', () => {
    expect(AuditEntityType.options).toContain('project');
    expect(AuditEntityType.options).toContain('task');
    expect(AuditEntityType.options).toContain('handover');
    expect(AuditEntityType.options).toContain('document');
    expect(AuditEntityType.options).toContain('user');
  });
});

describe('AuditSeverity enum', () => {
  it('should have exactly 3 values', () => {
    expect(AuditSeverity.options).toHaveLength(3);
  });

  it('should include info, warning, critical', () => {
    expect(AuditSeverity.options).toContain('info');
    expect(AuditSeverity.options).toContain('warning');
    expect(AuditSeverity.options).toContain('critical');
  });
});
