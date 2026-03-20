import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNotificationSchema,
  markAsReadSchema,
} from '@/modules/notifications/validation';
import { NotificationFilterSchema } from '@/modules/notifications/types';

// ── Mock dependencies ─────────────────────────────────────────────

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

// Mock DB
vi.mock('@/db', () => {
  const insertChain = {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: '00000000-0000-0000-0009-000000000001',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Bạn được giao công việc mới',
          message: 'Công việc ABC đã được giao cho bạn.',
          type: 'task_assigned',
          priority: 'normal',
          isRead: false,
          readAt: null,
          actionUrl: null,
          createdAt: new Date('2026-03-01T10:00:00Z'),
          expiresAt: null,
        },
      ]),
    }),
  };

  const updateChain = {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  };

  const deleteChain = {
    where: vi.fn().mockResolvedValue([]),
  };

  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: '00000000-0000-0000-0009-000000000001',
            title: 'Bạn được giao công việc mới',
            isRead: false,
          },
        ]),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([]),
        }),
      }),
      limit: vi.fn().mockResolvedValue([{ value: 3 }]),
    }),
  };

  return {
    db: {
      insert: vi.fn().mockReturnValue(insertChain),
      update: vi.fn().mockReturnValue(updateChain),
      delete: vi.fn().mockReturnValue(deleteChain),
      select: vi.fn().mockReturnValue(selectChain),
      query: {},
    },
  };
});

vi.mock('@/db/schema/operations', () => ({
  notifications: {},
  auditLogs: { $inferInsert: {} },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  count: vi.fn().mockReturnValue('count'),
}));

// ════════════════════════════════════════════════════════════════════
// Validation tests — createNotificationSchema
// ════════════════════════════════════════════════════════════════════

describe('createNotificationSchema', () => {
  const validInput = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Bạn được giao công việc mới',
    message: 'Công việc ABC đã được giao cho bạn.',
    type: 'task_assigned' as const,
    priority: 'normal' as const,
  };

  it('should accept valid data', () => {
    const result = createNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default priority=normal when not provided', () => {
    const { priority, ...withoutPriority } = validInput;
    const result = createNotificationSchema.safeParse(withoutPriority);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('normal');
    }
  });

  it('should reject missing userId', () => {
    const { userId, ...withoutUserId } = validInput;
    const result = createNotificationSchema.safeParse(withoutUserId);
    expect(result.success).toBe(false);
  });

  it('should reject invalid userId (not a UUID)', () => {
    const result = createNotificationSchema.safeParse({ ...validInput, userId: 'not-a-valid-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const result = createNotificationSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject title exceeding 300 characters', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('should reject message exceeding 2000 characters', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      message: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid notification type', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      type: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid priority', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      priority: 'extreme',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid optional UUID fields', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      projectId: '550e8400-e29b-41d4-a716-446655440002',
      taskId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid projectId (not a UUID)', () => {
    const result = createNotificationSchema.safeParse({
      ...validInput,
      projectId: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ── markAsReadSchema ──────────────────────────────────────────────

describe('markAsReadSchema', () => {
  it('should accept valid notification UUID', () => {
    const result = markAsReadSchema.safeParse({
      notificationId: '550e8400-e29b-41d4-a716-446655440009',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing notificationId', () => {
    const result = markAsReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID', () => {
    const result = markAsReadSchema.safeParse({ notificationId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ── NotificationFilterSchema ──────────────────────────────────────

describe('NotificationFilterSchema', () => {
  it('should apply defaults when no input provided', () => {
    const result = NotificationFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.sortBy).toBe('created_at');
    expect(result.sortOrder).toBe('desc');
  });

  it('should reject page < 1', () => {
    const result = NotificationFilterSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    const result = NotificationFilterSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortBy', () => {
    const result = NotificationFilterSchema.safeParse({ sortBy: 'invalid_column' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortOrder', () => {
    const result = NotificationFilterSchema.safeParse({ sortOrder: 'random' });
    expect(result.success).toBe(false);
  });

  it('should accept valid type filter', () => {
    const result = NotificationFilterSchema.safeParse({ type: 'mention' });
    expect(result.success).toBe(true);
  });

  it('should accept valid isRead filter', () => {
    const result = NotificationFilterSchema.safeParse({ isRead: false });
    expect(result.success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// Query function exports + return shape
// ════════════════════════════════════════════════════════════════════

describe('getUnreadCount', () => {
  it('should be an exported async function', async () => {
    const { getUnreadCount } = await import('@/modules/notifications/queries');
    expect(typeof getUnreadCount).toBe('function');
  });

  it('should return UnreadCount shape with total, urgent, high', async () => {
    const { getUnreadCount } = await import('@/modules/notifications/queries');
    const result = await getUnreadCount('00000000-0000-0000-0002-000000000001');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('urgent');
    expect(result).toHaveProperty('high');
    expect(typeof result.total).toBe('number');
    expect(typeof result.urgent).toBe('number');
    expect(typeof result.high).toBe('number');
  });
});

describe('getNotifications', () => {
  it('should be an exported async function', async () => {
    const { getNotifications } = await import('@/modules/notifications/queries');
    expect(typeof getNotifications).toBe('function');
  });

  it('should return PaginatedResult shape', async () => {
    const { getNotifications } = await import('@/modules/notifications/queries');
    const result = await getNotifications('00000000-0000-0000-0002-000000000001', {});
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('perPage');
    expect(result).toHaveProperty('totalPages');
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('getNotificationById', () => {
  it('should be an exported async function', async () => {
    const { getNotificationById } = await import('@/modules/notifications/queries');
    expect(typeof getNotificationById).toBe('function');
  });
});

// ════════════════════════════════════════════════════════════════════
// Actions export verification
// ════════════════════════════════════════════════════════════════════

describe('notifications actions exports', () => {
  it('createNotification should be an exported async function', async () => {
    const { createNotification } = await import('@/modules/notifications/actions');
    expect(typeof createNotification).toBe('function');
  });

  it('markAsRead should be an exported async function', async () => {
    const { markAsRead } = await import('@/modules/notifications/actions');
    expect(typeof markAsRead).toBe('function');
  });

  it('markAllAsRead should be an exported async function', async () => {
    const { markAllAsRead } = await import('@/modules/notifications/actions');
    expect(typeof markAllAsRead).toBe('function');
  });

  it('deleteNotification should be an exported async function', async () => {
    const { deleteNotification } = await import('@/modules/notifications/actions');
    expect(typeof deleteNotification).toBe('function');
  });
});

// ── Auth rejection ────────────────────────────────────────────────

describe('notifications actions auth rejection', () => {
  beforeEach(() => {
    vi.mocked(vi.importMock<typeof import('@/lib/auth')>('@/lib/auth').then(
      (m) => m.auth,
    ));
  });

  it('createNotification should redirect when not authenticated', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

    const { createNotification } = await import('@/modules/notifications/actions');
    await expect(
      createNotification({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test',
        message: 'Test msg',
        type: 'task_assigned',
        priority: 'normal',
      }),
    ).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});

// ── Validation rejection via action ──────────────────────────────

describe('createNotification validation rejection', () => {
  it('should return failure when title is empty', async () => {
    const { createNotification } = await import('@/modules/notifications/actions');
    const result = await createNotification({
      userId: '00000000-0000-0000-0002-000000000001',
      title: '',
      message: 'Valid message',
      type: 'task_assigned',
      priority: 'normal',
    });
    expect(result.success).toBe(false);
  });

  it('should return failure when userId is not a valid UUID', async () => {
    const { createNotification } = await import('@/modules/notifications/actions');
    const result = await createNotification({
      userId: 'not-a-uuid',
      title: 'Valid title',
      message: 'Valid message',
      type: 'task_assigned',
      priority: 'normal',
    });
    expect(result.success).toBe(false);
  });
});
