import { describe, it, expect } from 'vitest';
import {
  createHandoverSchema,
  updateHandoverSchema,
  transitionStatusSchema,
  approveHandoverSchema,
  checklistItemSchema,
  handoverFiltersSchema,
} from '@/modules/handovers/validation';
import { ALLOWED_TRANSITIONS } from '@/modules/handovers/constants';
import type { HandoverStatus } from '@/modules/handovers/types';

// ══════════════════════════════════════════════════════════════════
// createHandoverSchema
// ══════════════════════════════════════════════════════════════════

describe('createHandoverSchema', () => {
  const validInput = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Bàn giao dự án Cầu Long Biên',
    description: 'Chuyển giao toàn bộ tài liệu và quyền truy cập.',
    type: 'project_transfer' as const,
    toUserId: '550e8400-e29b-41d4-a716-446655440001',
    fromDepartmentId: '550e8400-e29b-41d4-a716-446655440002',
    toDepartmentId: '550e8400-e29b-41d4-a716-446655440003',
    dueDate: '2026-06-15T10:00:00.000Z',
    notes: 'Lưu ý kiểm tra kỹ tài liệu.',
  };

  it('should accept valid data', () => {
    const result = createHandoverSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept minimal required fields', () => {
    const result = createHandoverSchema.safeParse({
      projectId: validInput.projectId,
      title: 'Bàn giao test',
      type: 'team_change',
      toUserId: validInput.toUserId,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing projectId', () => {
    const { projectId, ...withoutProjectId } = validInput;
    const result = createHandoverSchema.safeParse(withoutProjectId);
    expect(result.success).toBe(false);
  });

  it('should reject title shorter than 3 characters', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject title longer than 200 characters', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, title: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should accept title at exact min length (3)', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, title: 'ABC' });
    expect(result.success).toBe(true);
  });

  it('should accept title at exact max length (200)', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, title: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('should reject invalid handover type', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  it('should reject non-UUID projectId', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject non-UUID toUserId', () => {
    const result = createHandoverSchema.safeParse({ ...validInput, toUserId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid handover types', () => {
    const types = ['project_transfer', 'stage_transition', 'team_change', 'department_transfer', 'role_change'] as const;
    for (const type of types) {
      const result = createHandoverSchema.safeParse({ ...validInput, type });
      expect(result.success).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// updateHandoverSchema
// ══════════════════════════════════════════════════════════════════

describe('updateHandoverSchema', () => {
  it('should accept partial update with only title', () => {
    const result = updateHandoverSchema.safeParse({ title: 'Updated title' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no changes)', () => {
    const result = updateHandoverSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept nullable fields', () => {
    const result = updateHandoverSchema.safeParse({
      description: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('should still enforce title min length when title is present', () => {
    const result = updateHandoverSchema.safeParse({ title: 'AB' });
    expect(result.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// transitionStatusSchema — State machine validation
// ══════════════════════════════════════════════════════════════════

describe('transitionStatusSchema', () => {
  const allStatuses: HandoverStatus[] = [
    'draft', 'pending_review', 'in_review', 'approved', 'rejected', 'completed', 'cancelled',
  ];

  it('should accept all valid transitions', () => {
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const to of targets) {
        const result = transitionStatusSchema.safeParse({
          handoverId: '550e8400-e29b-41d4-a716-446655440000',
          fromStatus: from,
          toStatus: to,
        });
        expect(result.success).toBe(true);
      }
    }
  });

  it('should reject transition from terminal states (completed, cancelled)', () => {
    const terminalStates: HandoverStatus[] = ['completed', 'cancelled'];
    for (const from of terminalStates) {
      for (const to of allStatuses) {
        if (from === to) continue;
        const result = transitionStatusSchema.safeParse({
          handoverId: '550e8400-e29b-41d4-a716-446655440000',
          fromStatus: from,
          toStatus: to,
        });
        expect(result.success).toBe(false);
      }
    }
  });

  it('should reject self-transition', () => {
    for (const status of allStatuses) {
      const result = transitionStatusSchema.safeParse({
        handoverId: '550e8400-e29b-41d4-a716-446655440000',
        fromStatus: status,
        toStatus: status,
      });
      expect(result.success).toBe(false);
    }
  });

  it('should reject draft -> approved (must go through review)', () => {
    const result = transitionStatusSchema.safeParse({
      handoverId: '550e8400-e29b-41d4-a716-446655440000',
      fromStatus: 'draft',
      toStatus: 'approved',
    });
    expect(result.success).toBe(false);
  });

  it('should reject pending_review -> completed (must be approved first)', () => {
    const result = transitionStatusSchema.safeParse({
      handoverId: '550e8400-e29b-41d4-a716-446655440000',
      fromStatus: 'pending_review',
      toStatus: 'completed',
    });
    expect(result.success).toBe(false);
  });

  it('should accept rejected -> draft (revise and resubmit)', () => {
    const result = transitionStatusSchema.safeParse({
      handoverId: '550e8400-e29b-41d4-a716-446655440000',
      fromStatus: 'rejected',
      toStatus: 'draft',
    });
    expect(result.success).toBe(true);
  });

  it('should count exactly 9 total valid transitions', () => {
    let count = 0;
    for (const targets of Object.values(ALLOWED_TRANSITIONS)) {
      count += targets.length;
    }
    expect(count).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════
// approveHandoverSchema
// ══════════════════════════════════════════════════════════════════

describe('approveHandoverSchema', () => {
  it('should accept valid approval', () => {
    const result = approveHandoverSchema.safeParse({
      handoverId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should accept approval with notes', () => {
    const result = approveHandoverSchema.safeParse({
      handoverId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Tất cả đã kiểm tra xong.',
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-UUID handoverId', () => {
    const result = approveHandoverSchema.safeParse({
      handoverId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// checklistItemSchema
// ══════════════════════════════════════════════════════════════════

describe('checklistItemSchema', () => {
  it('should accept valid checklist item', () => {
    const result = checklistItemSchema.safeParse({
      title: 'Kiểm tra tài liệu kỹ thuật',
      description: 'Đảm bảo tất cả tài liệu đầy đủ.',
      category: 'documentation',
      priority: 'required',
      sortOrder: 1,
      requiresEvidence: true,
    });
    expect(result.success).toBe(true);
  });

  it('should apply defaults for optional fields', () => {
    const result = checklistItemSchema.safeParse({ title: 'Test item' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('other');
      expect(result.data.priority).toBe('required');
      expect(result.data.sortOrder).toBe(0);
      expect(result.data.requiresEvidence).toBe(false);
    }
  });

  it('should reject empty title', () => {
    const result = checklistItemSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid categories', () => {
    const categories = ['documentation', 'access_transfer', 'knowledge_transfer', 'tool_setup', 'review', 'signoff', 'other'];
    for (const category of categories) {
      const result = checklistItemSchema.safeParse({ title: 'Test', category });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid priorities', () => {
    const priorities = ['required', 'recommended', 'optional'];
    for (const priority of priorities) {
      const result = checklistItemSchema.safeParse({ title: 'Test', priority });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid category', () => {
    const result = checklistItemSchema.safeParse({ title: 'Test', category: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// handoverFiltersSchema
// ══════════════════════════════════════════════════════════════════

describe('handoverFiltersSchema', () => {
  it('should apply defaults for page, perPage, sortBy, sortOrder', () => {
    const result = handoverFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sortBy).toBe('updated_at');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should reject page < 1', () => {
    const result = handoverFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    const result = handoverFiltersSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('should accept valid status filter', () => {
    const result = handoverFiltersSchema.safeParse({ status: 'draft' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status filter value', () => {
    const result = handoverFiltersSchema.safeParse({ status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('should accept valid type filter', () => {
    const result = handoverFiltersSchema.safeParse({ type: 'project_transfer' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid sortBy value', () => {
    const result = handoverFiltersSchema.safeParse({ sortBy: 'invalid_column' });
    expect(result.success).toBe(false);
  });
});
