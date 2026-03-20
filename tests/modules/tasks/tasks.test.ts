import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks required for actions.ts (transitive next-auth deps) ─────

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-001', email: 'test@test.com', role: 'admin' } }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => {
  const returningMock = vi.fn().mockResolvedValue([{
    id: 'task-001',
    title: 'Test Task',
    code: 'TSK-001',
    projectId: 'proj-001',
    status: 'todo',
    type: 'feature',
    priority: 'medium',
    sortOrder: 0,
  }]);
  const whereMock: Record<string, unknown> = {};
  whereMock.returning = returningMock;
  whereMock.limit = vi.fn().mockResolvedValue([{
    id: 'task-001',
    title: 'Test Task',
    code: 'TSK-001',
    projectId: 'proj-001',
    status: 'todo',
    assigneeId: null,
    deletedAt: null,
  }]);
  return {
    db: {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: returningMock }) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: returningMock }) }) }),
      select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(whereMock) }) }),
    },
  };
});

vi.mock('@/db/schema', () => ({
  tasks: {
    id: 'tasks.id', title: 'tasks.title', code: 'tasks.code', status: 'tasks.status',
    projectId: 'tasks.project_id', assigneeId: 'tasks.assignee_id', deletedAt: 'tasks.deleted_at',
    $inferInsert: {},
  },
  auditLogs: { $inferInsert: {} },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

import {
  createTaskSchema,
  updateTaskSchema,
  transitionTaskStatusSchema,
  taskFiltersSchema,
} from '@/modules/tasks/validation';
import {
  ALLOWED_TASK_TRANSITIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  KANBAN_COLUMNS,
  VALIDATION,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  TASK_CODE_PREFIX,
  PERMISSIONS,
} from '@/modules/tasks/constants';
import type { TaskStatus } from '@/modules/tasks/types';

// ── createTaskSchema ─────────────────────────────────────────────

describe('createTaskSchema', () => {
  const validInput = {
    title: 'Thiết kế giao diện màn hình đăng nhập',
    description: 'Tạo wireframe và prototype cho trang đăng nhập.',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'feature' as const,
    priority: 'high' as const,
    status: 'todo' as const,
    assigneeId: '550e8400-e29b-41d4-a716-446655440001',
    startDate: '2026-06-01',
    dueDate: '2026-06-30',
    estimatedHours: 16,
    tags: ['ui', 'auth'],
  };

  it('should accept valid data', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default type=feature when not provided', () => {
    const { type, ...rest } = validInput;
    const result = createTaskSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('feature');
  });

  it('should apply default priority=medium when not provided', () => {
    const { priority, ...rest } = validInput;
    const result = createTaskSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe('medium');
  });

  it('should apply default status=backlog when not provided', () => {
    const { status, ...rest } = validInput;
    const result = createTaskSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('backlog');
  });

  it('should apply default tags=[] when not provided', () => {
    const { tags, ...rest } = validInput;
    const result = createTaskSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });

  it('should reject when title is missing', () => {
    const { title, ...rest } = validInput;
    expect(createTaskSchema.safeParse(rest).success).toBe(false);
  });

  it('should reject when title is too short (< 3 chars)', () => {
    expect(createTaskSchema.safeParse({ ...validInput, title: 'AB' }).success).toBe(false);
  });

  it('should reject when title is too long (> 300 chars)', () => {
    expect(createTaskSchema.safeParse({ ...validInput, title: 'A'.repeat(301) }).success).toBe(false);
  });

  it('should accept title at exact min length (3 chars)', () => {
    expect(createTaskSchema.safeParse({ ...validInput, title: 'Abc' }).success).toBe(true);
  });

  it('should accept title at exact max length (300 chars)', () => {
    expect(createTaskSchema.safeParse({ ...validInput, title: 'A'.repeat(300) }).success).toBe(true);
  });

  it('should reject when projectId is missing', () => {
    const { projectId, ...rest } = validInput;
    expect(createTaskSchema.safeParse(rest).success).toBe(false);
  });

  it('should reject when projectId is not a UUID', () => {
    expect(createTaskSchema.safeParse({ ...validInput, projectId: 'not-a-uuid' }).success).toBe(false);
  });

  it('should reject when assigneeId is not a UUID', () => {
    expect(createTaskSchema.safeParse({ ...validInput, assigneeId: 'bad' }).success).toBe(false);
  });

  it('should accept missing assigneeId (optional)', () => {
    const { assigneeId, ...rest } = validInput;
    expect(createTaskSchema.safeParse(rest).success).toBe(true);
  });

  it('should reject when estimatedHours is negative', () => {
    expect(createTaskSchema.safeParse({ ...validInput, estimatedHours: -1 }).success).toBe(false);
  });

  it('should accept estimatedHours of 0', () => {
    expect(createTaskSchema.safeParse({ ...validInput, estimatedHours: 0 }).success).toBe(true);
  });

  it('should reject non-integer estimatedHours', () => {
    expect(createTaskSchema.safeParse({ ...validInput, estimatedHours: 4.5 }).success).toBe(false);
  });

  it('should reject dueDate before startDate', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      startDate: '2026-07-01',
      dueDate: '2026-06-01',
    });
    expect(result.success).toBe(false);
  });

  it('should accept same startDate and dueDate', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      startDate: '2026-06-01',
      dueDate: '2026-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('should accept missing dates (both optional)', () => {
    const { startDate, dueDate, ...rest } = validInput;
    expect(createTaskSchema.safeParse(rest).success).toBe(true);
  });

  it('should reject invalid type value', () => {
    expect(createTaskSchema.safeParse({ ...validInput, type: 'hotfix' }).success).toBe(false);
  });

  it('should reject invalid priority value', () => {
    expect(createTaskSchema.safeParse({ ...validInput, priority: 'urgent' }).success).toBe(false);
  });

  it('should reject invalid status value', () => {
    expect(createTaskSchema.safeParse({ ...validInput, status: 'pending' }).success).toBe(false);
  });

  it('should reject description exceeding 5000 chars', () => {
    expect(
      createTaskSchema.safeParse({ ...validInput, description: 'A'.repeat(5001) }).success,
    ).toBe(false);
  });
});

// ── updateTaskSchema ─────────────────────────────────────────────

describe('updateTaskSchema', () => {
  it('should accept partial updates (title only)', () => {
    expect(updateTaskSchema.safeParse({ title: 'Tên cập nhật mới' }).success).toBe(true);
  });

  it('should accept empty object (no changes)', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true);
  });

  it('should accept nullable fields', () => {
    expect(
      updateTaskSchema.safeParse({
        description: null,
        assigneeId: null,
        dueDate: null,
        estimatedHours: null,
      }).success,
    ).toBe(true);
  });

  it('should reject invalid type', () => {
    expect(updateTaskSchema.safeParse({ title: 123 }).success).toBe(false);
  });

  it('should still enforce title min length when title is provided', () => {
    expect(updateTaskSchema.safeParse({ title: 'AB' }).success).toBe(false);
  });

  it('should still enforce negative estimatedHours rejection', () => {
    expect(updateTaskSchema.safeParse({ estimatedHours: -10 }).success).toBe(false);
  });

  it('should reject dueDate before startDate in update', () => {
    expect(
      updateTaskSchema.safeParse({ startDate: '2026-09-01', dueDate: '2026-07-01' }).success,
    ).toBe(false);
  });
});

// ── transitionTaskStatusSchema ───────────────────────────────────

describe('transitionTaskStatusSchema', () => {
  const taskId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  it('should accept valid transition: backlog -> todo', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'backlog', toStatus: 'todo' }).success,
    ).toBe(true);
  });

  it('should accept valid transition: todo -> in_progress', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'todo', toStatus: 'in_progress' }).success,
    ).toBe(true);
  });

  it('should accept valid transition: in_progress -> in_review', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'in_progress', toStatus: 'in_review' }).success,
    ).toBe(true);
  });

  it('should accept valid transition: in_review -> testing', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'in_review', toStatus: 'testing' }).success,
    ).toBe(true);
  });

  it('should accept valid transition: testing -> done', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'testing', toStatus: 'done' }).success,
    ).toBe(true);
  });

  it('should accept cancellation: todo -> cancelled', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'todo', toStatus: 'cancelled' }).success,
    ).toBe(true);
  });

  it('should accept backward transition: in_progress -> todo', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'in_progress', toStatus: 'todo' }).success,
    ).toBe(true);
  });

  it('should reject invalid transition: backlog -> done (skip)', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'backlog', toStatus: 'done' }).success,
    ).toBe(false);
  });

  it('should reject transition from done (terminal state)', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'done', toStatus: 'todo' }).success,
    ).toBe(false);
  });

  it('should reject self-transition', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId, fromStatus: 'todo', toStatus: 'todo' }).success,
    ).toBe(false);
  });

  it('should reject invalid taskId (not UUID)', () => {
    expect(
      transitionTaskStatusSchema.safeParse({ taskId: 'bad', fromStatus: 'todo', toStatus: 'in_progress' }).success,
    ).toBe(false);
  });

  it('should validate all allowed transitions succeed', () => {
    for (const [from, targets] of Object.entries(ALLOWED_TASK_TRANSITIONS)) {
      for (const to of targets) {
        const result = transitionTaskStatusSchema.safeParse({ taskId, fromStatus: from, toStatus: to });
        expect(result.success).toBe(true);
      }
    }
  });

  it('should reject all disallowed transitions', () => {
    const allStatuses = Object.keys(ALLOWED_TASK_TRANSITIONS) as TaskStatus[];
    for (const from of allStatuses) {
      const allowed = ALLOWED_TASK_TRANSITIONS[from];
      for (const to of allStatuses) {
        if (from === to) continue;
        if (allowed.includes(to)) continue;
        const result = transitionTaskStatusSchema.safeParse({ taskId, fromStatus: from, toStatus: to });
        expect(result.success).toBe(false);
      }
    }
  });
});

// ── taskFiltersSchema ────────────────────────────────────────────

describe('taskFiltersSchema', () => {
  it('should accept empty object and apply defaults', () => {
    const result = taskFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(DEFAULT_PER_PAGE);
      expect(result.data.sortBy).toBe('updated_at');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should accept valid filter combination', () => {
    const result = taskFiltersSchema.safeParse({
      search: 'giao diện',
      status: 'in_progress',
      priority: 'high',
      type: 'feature',
      page: 2,
      perPage: 50,
      sortBy: 'due_date',
      sortOrder: 'asc',
    });
    expect(result.success).toBe(true);
  });

  it('should reject page < 1', () => {
    expect(taskFiltersSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    expect(taskFiltersSchema.safeParse({ perPage: 101 }).success).toBe(false);
  });

  it('should reject perPage < 1', () => {
    expect(taskFiltersSchema.safeParse({ perPage: 0 }).success).toBe(false);
  });

  it('should reject invalid sortBy column', () => {
    expect(taskFiltersSchema.safeParse({ sortBy: 'invalid_col' }).success).toBe(false);
  });

  it('should reject invalid sortOrder', () => {
    expect(taskFiltersSchema.safeParse({ sortOrder: 'random' }).success).toBe(false);
  });

  it('should accept valid UUID for projectId', () => {
    expect(
      taskFiltersSchema.safeParse({ projectId: '550e8400-e29b-41d4-a716-446655440000' }).success,
    ).toBe(true);
  });

  it('should reject invalid UUID for projectId', () => {
    expect(taskFiltersSchema.safeParse({ projectId: 'not-a-uuid' }).success).toBe(false);
  });

  it('should accept boolean isOverdue', () => {
    expect(taskFiltersSchema.safeParse({ isOverdue: true }).success).toBe(true);
  });

  it('should accept valid date strings for dateFrom/dateTo', () => {
    expect(
      taskFiltersSchema.safeParse({ dateFrom: '2026-01-01', dateTo: '2026-12-31' }).success,
    ).toBe(true);
  });
});

// ── ALLOWED_TASK_TRANSITIONS coverage ───────────────────────────

describe('ALLOWED_TASK_TRANSITIONS', () => {
  const allStatuses: TaskStatus[] = [
    'backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled',
  ];

  it('should have an entry for every TaskStatus', () => {
    for (const status of allStatuses) {
      expect(ALLOWED_TASK_TRANSITIONS).toHaveProperty(status);
    }
  });

  it('done should be a terminal state (no outgoing transitions)', () => {
    expect(ALLOWED_TASK_TRANSITIONS.done).toHaveLength(0);
  });

  it('all target statuses in transitions should be valid TaskStatus values', () => {
    for (const [, targets] of Object.entries(ALLOWED_TASK_TRANSITIONS)) {
      for (const target of targets) {
        expect(allStatuses).toContain(target);
      }
    }
  });

  it('should allow cancellation from active statuses', () => {
    const activeStatuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'testing'];
    for (const status of activeStatuses) {
      expect(ALLOWED_TASK_TRANSITIONS[status]).toContain('cancelled');
    }
  });
});

// ── Constants coverage ──────────────────────────────────────────

describe('TASK_STATUS_LABELS', () => {
  const allStatuses: TaskStatus[] = [
    'backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled',
  ];

  it('should have a label for every status', () => {
    for (const status of allStatuses) {
      expect(TASK_STATUS_LABELS[status]).toBeDefined();
      expect(typeof TASK_STATUS_LABELS[status]).toBe('string');
    }
  });

  it('should have correct Vietnamese labels', () => {
    expect(TASK_STATUS_LABELS.backlog).toBe('Tồn đọng');
    expect(TASK_STATUS_LABELS.todo).toBe('Cần làm');
    expect(TASK_STATUS_LABELS.in_progress).toBe('Đang thực hiện');
    expect(TASK_STATUS_LABELS.done).toBe('Hoàn thành');
    expect(TASK_STATUS_LABELS.cancelled).toBe('Đã hủy');
  });
});

describe('TASK_STATUS_COLORS', () => {
  const allStatuses: TaskStatus[] = [
    'backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled',
  ];
  const BG_PATTERN = /^bg-[a-z]+-\d{2,3}$/;
  const TEXT_PATTERN = /^text-[a-z]+-\d{2,3}$/;

  it('should have colors for every status', () => {
    for (const status of allStatuses) {
      expect(TASK_STATUS_COLORS[status]).toBeDefined();
      expect(TASK_STATUS_COLORS[status]).toHaveProperty('bg');
      expect(TASK_STATUS_COLORS[status]).toHaveProperty('text');
    }
  });

  it('should use valid Tailwind bg- patterns', () => {
    for (const status of allStatuses) {
      expect(TASK_STATUS_COLORS[status].bg).toMatch(BG_PATTERN);
    }
  });

  it('should use valid Tailwind text- patterns', () => {
    for (const status of allStatuses) {
      expect(TASK_STATUS_COLORS[status].text).toMatch(TEXT_PATTERN);
    }
  });
});

describe('TASK_PRIORITY_LABELS and COLORS', () => {
  const priorities = ['critical', 'high', 'medium', 'low'] as const;

  it('should have labels for every priority', () => {
    for (const p of priorities) {
      expect(TASK_PRIORITY_LABELS[p]).toBeDefined();
    }
  });

  it('should have colors for every priority', () => {
    for (const p of priorities) {
      expect(TASK_PRIORITY_COLORS[p]).toBeDefined();
      expect(TASK_PRIORITY_COLORS[p]).toHaveProperty('bg');
      expect(TASK_PRIORITY_COLORS[p]).toHaveProperty('text');
    }
  });

  it('should have correct Vietnamese priority labels', () => {
    expect(TASK_PRIORITY_LABELS.critical).toBe('Nghiêm trọng');
    expect(TASK_PRIORITY_LABELS.high).toBe('Cao');
    expect(TASK_PRIORITY_LABELS.medium).toBe('Trung bình');
    expect(TASK_PRIORITY_LABELS.low).toBe('Thấp');
  });
});

describe('TASK_TYPE_LABELS', () => {
  const types = ['feature', 'bug', 'improvement', 'documentation', 'testing', 'deployment', 'research', 'other'] as const;

  it('should have labels for every type', () => {
    for (const t of types) {
      expect(TASK_TYPE_LABELS[t]).toBeDefined();
    }
  });

  it('should have Vietnamese labels', () => {
    expect(TASK_TYPE_LABELS.feature).toBe('Tính năng');
    expect(TASK_TYPE_LABELS.bug).toBe('Lỗi');
  });
});

describe('KANBAN_COLUMNS', () => {
  it('should contain exactly 4 columns', () => {
    expect(KANBAN_COLUMNS).toHaveLength(4);
  });

  it('should include todo, in_progress, in_review, done', () => {
    expect(KANBAN_COLUMNS).toContain('todo');
    expect(KANBAN_COLUMNS).toContain('in_progress');
    expect(KANBAN_COLUMNS).toContain('in_review');
    expect(KANBAN_COLUMNS).toContain('done');
  });
});

describe('Module constants', () => {
  it('TASK_CODE_PREFIX should be TSK', () => {
    expect(TASK_CODE_PREFIX).toBe('TSK');
  });

  it('DEFAULT_PER_PAGE should be 20', () => {
    expect(DEFAULT_PER_PAGE).toBe(20);
  });

  it('MAX_PER_PAGE should be 100', () => {
    expect(MAX_PER_PAGE).toBe(100);
  });

  it('VALIDATION.TITLE_MIN should be 3', () => {
    expect(VALIDATION.TITLE_MIN).toBe(3);
  });

  it('VALIDATION.TITLE_MAX should be 300', () => {
    expect(VALIDATION.TITLE_MAX).toBe(300);
  });

  it('PERMISSIONS should use resource:action pattern', () => {
    for (const key of Object.values(PERMISSIONS)) {
      expect(key).toMatch(/^task:.+$/);
    }
  });
});

// ── Action exports ───────────────────────────────────────────────
// Verify all required actions are exported as async functions

describe('actions module exports', () => {
  it('should export createTask as async function', async () => {
    const module = await import('@/modules/tasks/actions');
    expect(typeof module.createTask).toBe('function');
  });

  it('should export updateTask as async function', async () => {
    const module = await import('@/modules/tasks/actions');
    expect(typeof module.updateTask).toBe('function');
  });

  it('should export transitionTaskStatus as async function', async () => {
    const module = await import('@/modules/tasks/actions');
    expect(typeof module.transitionTaskStatus).toBe('function');
  });

  it('should export assignTask as async function', async () => {
    const module = await import('@/modules/tasks/actions');
    expect(typeof module.assignTask).toBe('function');
  });

  it('should export deleteTask as async function', async () => {
    const module = await import('@/modules/tasks/actions');
    expect(typeof module.deleteTask).toBe('function');
  });
});

// ── Query exports ────────────────────────────────────────────────

describe('queries module exports', () => {
  it('should export getTasks as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getTasks).toBe('function');
  });

  it('should export getTaskById as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getTaskById).toBe('function');
  });

  it('should export getTasksByProject as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getTasksByProject).toBe('function');
  });

  it('should export getTasksKanban as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getTasksKanban).toBe('function');
  });

  it('should export getOverdueTasks as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getOverdueTasks).toBe('function');
  });

  it('should export getTaskStats as async function', async () => {
    const module = await import('@/modules/tasks/queries');
    expect(typeof module.getTaskStats).toBe('function');
  });
});
