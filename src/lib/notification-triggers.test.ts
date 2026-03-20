import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  notifyProjectStageChange,
  notifyHandoverStatusChange,
  notifyTaskAssigned,
  notifyTaskOverdue,
  notifyFinanceApproval,
} from './notification-triggers';

// ── Mock DB ─────────────────────────────────────────────────────

const mockReturning = vi.fn<(arg: { id: unknown }) => Promise<{ id: string }[]>>();
const mockValues = vi.fn<(vals: Record<string, unknown>) => { returning: typeof mockReturning }>();
const mockInsert = vi.fn<(table: unknown) => { values: typeof mockValues }>();

mockValues.mockImplementation(() => ({ returning: mockReturning }));
mockInsert.mockImplementation(() => ({ values: mockValues }));

vi.mock('@/db', () => ({
  db: {
    insert: (table: unknown) => mockInsert(table),
  },
}));

vi.mock('@/db/schema/operations', () => ({
  notifications: { id: 'id' },
}));

vi.mock('@/modules/projects/constants', () => ({
  STAGE_LABELS: {
    initiation: 'Khởi tạo',
    planning: 'Lập kế hoạch',
    in_progress: 'Đang thực hiện',
    review: 'Đánh giá',
  },
}));

vi.mock('@/modules/handovers/constants', () => ({
  STATUS_LABELS: {
    draft: 'Bản nháp',
    pending_review: 'Chờ đánh giá',
    approved: 'Đã duyệt',
    rejected: 'Bị từ chối',
    completed: 'Hoàn thành',
  },
}));

vi.mock('@/modules/finance/constants', () => ({
  FINANCE_STATUS_LABELS: {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    processed: 'Đã xử lý',
  },
}));

// ── Helpers ─────────────────────────────────────────────────────

function getInsertedValues(): Record<string, unknown>[] {
  return mockValues.mock.calls.map(
    (call: unknown[]) => call[0] as Record<string, unknown>,
  );
}

// ── Tests ───────────────────────────────────────────────────────

describe('notifyProjectStageChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  });

  it('should create notifications for team members except the trigger user', async () => {
    await notifyProjectStageChange({
      projectId: 'proj-1',
      projectName: 'Test Project',
      fromStage: 'initiation',
      toStage: 'planning',
      triggeredBy: 'user-a',
      memberUserIds: ['user-a', 'user-b', 'user-c'],
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(2);
    expect(values[0]).toMatchObject({
      userId: 'user-b',
      type: 'project_stage_changed',
      priority: 'normal',
      projectId: 'proj-1',
      actorId: 'user-a',
    });
    expect(values[1]).toMatchObject({ userId: 'user-c' });
  });

  it('should use Vietnamese stage labels in the message', async () => {
    await notifyProjectStageChange({
      projectId: 'proj-1',
      projectName: 'Dự án Alpha',
      fromStage: 'initiation',
      toStage: 'planning',
      triggeredBy: 'user-a',
      memberUserIds: ['user-b'],
    });

    const values = getInsertedValues();
    expect(values[0].title).toBe('Giai đoạn dự án thay đổi');
    expect(values[0].message).toContain('Khởi tạo');
    expect(values[0].message).toContain('Lập kế hoạch');
  });

  it('should not create notifications when only the trigger user is a member', async () => {
    await notifyProjectStageChange({
      projectId: 'proj-1',
      projectName: 'Test',
      fromStage: 'initiation',
      toStage: 'planning',
      triggeredBy: 'user-a',
      memberUserIds: ['user-a'],
    });

    expect(mockValues).not.toHaveBeenCalled();
  });
});

describe('notifyHandoverStatusChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  });

  it('should create notification with handover_approved type for approved status', async () => {
    await notifyHandoverStatusChange({
      handoverId: 'ho-1',
      handoverTitle: 'Bàn giao Phase 1',
      status: 'approved',
      triggeredBy: 'user-a',
      fromUserId: 'user-b',
      toUserId: 'user-c',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(2);
    expect(values[0]).toMatchObject({
      type: 'handover_approved',
      priority: 'normal',
      handoverId: 'ho-1',
    });
  });

  it('should create notification with handover_rejected type and high priority for rejected status', async () => {
    await notifyHandoverStatusChange({
      handoverId: 'ho-1',
      handoverTitle: 'Bàn giao Phase 1',
      status: 'rejected',
      triggeredBy: 'user-a',
      fromUserId: 'user-b',
      toUserId: 'user-c',
    });

    const values = getInsertedValues();
    expect(values[0]).toMatchObject({
      type: 'handover_rejected',
      priority: 'high',
    });
  });

  it('should include Vietnamese status label in notification message', async () => {
    await notifyHandoverStatusChange({
      handoverId: 'ho-1',
      handoverTitle: 'Chuyển giao',
      status: 'approved',
      triggeredBy: 'user-a',
      fromUserId: 'user-b',
      toUserId: 'user-c',
    });

    const values = getInsertedValues();
    expect(values[0].title).toBe('Bàn giao: Đã duyệt');
    expect(values[0].message).toContain('Đã duyệt');
  });

  it('should not notify the trigger user even if they are a party', async () => {
    await notifyHandoverStatusChange({
      handoverId: 'ho-1',
      handoverTitle: 'Test',
      status: 'approved',
      triggeredBy: 'user-a',
      fromUserId: 'user-a',
      toUserId: 'user-b',
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(1);
    expect(values[0].userId).toBe('user-b');
  });
});

describe('notifyTaskAssigned', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  });

  it('should create a task_assigned notification for the assignee', async () => {
    await notifyTaskAssigned({
      taskId: 'task-1',
      taskTitle: 'Fix login bug',
      assigneeId: 'user-b',
      assignedBy: 'user-a',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({
      userId: 'user-b',
      type: 'task_assigned',
      priority: 'normal',
      taskId: 'task-1',
      projectId: 'proj-1',
      actorId: 'user-a',
    });
  });

  it('should include Vietnamese title', async () => {
    await notifyTaskAssigned({
      taskId: 'task-1',
      taskTitle: 'Test Task',
      assigneeId: 'user-b',
      assignedBy: 'user-a',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values[0].title).toBe('Được giao công việc');
    expect(values[0].message).toContain('Test Task');
  });

  it('should not create a notification when assignee is the assigner', async () => {
    await notifyTaskAssigned({
      taskId: 'task-1',
      taskTitle: 'Self-assigned task',
      assigneeId: 'user-a',
      assignedBy: 'user-a',
      projectId: 'proj-1',
    });

    expect(mockValues).not.toHaveBeenCalled();
  });
});

describe('notifyTaskOverdue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  });

  it('should create a deadline_overdue notification with high priority', async () => {
    await notifyTaskOverdue({
      taskId: 'task-1',
      taskTitle: 'Deploy feature',
      assigneeId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({
      userId: 'user-b',
      type: 'deadline_overdue',
      priority: 'high',
      taskId: 'task-1',
      projectId: 'proj-1',
    });
  });

  it('should include Vietnamese overdue message', async () => {
    await notifyTaskOverdue({
      taskId: 'task-1',
      taskTitle: 'Kiểm thử tích hợp',
      assigneeId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values[0].title).toBe('Công việc quá hạn');
    expect(values[0].message).toContain('quá hạn');
    expect(values[0].message).toContain('Kiểm thử tích hợp');
  });

  it('should include actionUrl pointing to the task', async () => {
    await notifyTaskOverdue({
      taskId: 'task-42',
      taskTitle: 'Test',
      assigneeId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values[0].actionUrl).toBe('/dashboard/tasks/task-42');
  });
});

describe('notifyFinanceApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  });

  it('should create a notification when a financial record is approved', async () => {
    await notifyFinanceApproval({
      recordId: 'fin-1',
      description: 'Server hosting Q1',
      status: 'approved',
      triggeredBy: 'user-a',
      creatorId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({
      userId: 'user-b',
      type: 'system_alert',
      priority: 'normal',
      projectId: 'proj-1',
      actorId: 'user-a',
    });
    expect(values[0].title).toBe('Bản ghi tài chính được duyệt');
  });

  it('should use high priority and rejection title when rejected', async () => {
    await notifyFinanceApproval({
      recordId: 'fin-1',
      description: 'Travel expense',
      status: 'rejected',
      triggeredBy: 'user-a',
      creatorId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values[0]).toMatchObject({
      priority: 'high',
    });
    expect(values[0].title).toBe('Bản ghi tài chính bị từ chối');
    expect(values[0].message).toContain('Từ chối');
  });

  it('should not create a notification when creator is the approver', async () => {
    await notifyFinanceApproval({
      recordId: 'fin-1',
      description: 'Test',
      status: 'approved',
      triggeredBy: 'user-a',
      creatorId: 'user-a',
      projectId: 'proj-1',
    });

    expect(mockValues).not.toHaveBeenCalled();
  });

  it('should include actionUrl pointing to the financial record', async () => {
    await notifyFinanceApproval({
      recordId: 'fin-99',
      description: 'Test',
      status: 'approved',
      triggeredBy: 'user-a',
      creatorId: 'user-b',
      projectId: 'proj-1',
    });

    const values = getInsertedValues();
    expect(values[0].actionUrl).toBe('/dashboard/financials/fin-99');
  });
});
