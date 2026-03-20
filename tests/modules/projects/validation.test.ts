import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  transitionStageSchema,
  projectFiltersSchema,
} from '@/modules/projects/validation';
import { ALLOWED_TRANSITIONS } from '@/modules/projects/constants';
import type { ProjectStage } from '@/modules/projects/types';

// ── createProjectSchema ──────────────────────────────────────────

describe('createProjectSchema', () => {
  const validInput = {
    name: 'Dự án Xây dựng Cầu Long Biên',
    description: 'Xây dựng cầu mới qua sông Hồng.',
    category: 'Infrastructure',
    priority: 'high' as const,
    province: 'HN',
    departmentId: '550e8400-e29b-41d4-a716-446655440000',
    startDate: '2026-06-01',
    endDate: '2027-12-31',
    budget: 500000000,
    currency: 'VND',
    tags: ['cầu đường', 'hạ tầng'],
  };

  it('should accept valid data', () => {
    const result = createProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should apply default priority=medium when not provided', () => {
    const { priority, ...withoutPriority } = validInput;
    const result = createProjectSchema.safeParse(withoutPriority);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('medium');
    }
  });

  it('should apply default currency=VND when not provided', () => {
    const { currency, ...withoutCurrency } = validInput;
    const result = createProjectSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('VND');
    }
  });

  it('should apply default tags=[] when not provided', () => {
    const { tags, ...withoutTags } = validInput;
    const result = createProjectSchema.safeParse(withoutTags);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  // Failure cases

  it('should reject when name is missing', () => {
    const { name, ...withoutName } = validInput;
    const result = createProjectSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it('should reject when name is too short (< 3 chars)', () => {
    const result = createProjectSchema.safeParse({ ...validInput, name: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject when name is too long (> 200 chars)', () => {
    const result = createProjectSchema.safeParse({ ...validInput, name: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should accept name at exact min length (3 chars)', () => {
    const result = createProjectSchema.safeParse({ ...validInput, name: 'Abc' });
    expect(result.success).toBe(true);
  });

  it('should accept name at exact max length (200 chars)', () => {
    const result = createProjectSchema.safeParse({ ...validInput, name: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('should reject when budget is negative', () => {
    const result = createProjectSchema.safeParse({ ...validInput, budget: -1 });
    expect(result.success).toBe(false);
  });

  it('should accept budget of 0', () => {
    const result = createProjectSchema.safeParse({ ...validInput, budget: 0 });
    expect(result.success).toBe(true);
  });

  it('should reject non-integer budget', () => {
    const result = createProjectSchema.safeParse({ ...validInput, budget: 99.5 });
    expect(result.success).toBe(false);
  });

  it('should reject end date before start date', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startDate: '2027-01-01',
      endDate: '2026-06-01',
    });
    expect(result.success).toBe(false);
  });

  it('should accept same start and end date', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startDate: '2026-06-01',
      endDate: '2026-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('should allow missing dates (both optional)', () => {
    const { startDate, endDate, ...noDates } = validInput;
    const result = createProjectSchema.safeParse(noDates);
    expect(result.success).toBe(true);
  });

  it('should reject invalid priority value', () => {
    const result = createProjectSchema.safeParse({ ...validInput, priority: 'urgent' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid currency length (not 3 chars)', () => {
    const result = createProjectSchema.safeParse({ ...validInput, currency: 'US' });
    expect(result.success).toBe(false);
  });

  it('should reject description exceeding 2000 chars', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      description: 'A'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid departmentId (not UUID)', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      departmentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ── updateProjectSchema ──────────────────────────────────────────

describe('updateProjectSchema', () => {
  it('should accept partial updates (name only)', () => {
    const result = updateProjectSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no fields changed)', () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept nullable fields', () => {
    const result = updateProjectSchema.safeParse({
      description: null,
      category: null,
      province: null,
      budget: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid types', () => {
    const result = updateProjectSchema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });

  it('should still enforce name min length when name is provided', () => {
    const result = updateProjectSchema.safeParse({ name: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should still enforce negative budget rejection', () => {
    const result = updateProjectSchema.safeParse({ budget: -500 });
    expect(result.success).toBe(false);
  });

  it('should reject end date before start date in update', () => {
    const result = updateProjectSchema.safeParse({
      startDate: '2027-06-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });
});

// ── transitionStageSchema ────────────────────────────────────────

describe('transitionStageSchema', () => {
  it('should accept valid forward transition: initiation -> planning', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'initiation',
      toStage: 'planning',
      notes: 'Charter approved by management.',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid backward transition: review -> in_progress', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'review',
      toStage: 'in_progress',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid transition: initiation -> in_progress (skip)', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'initiation',
      toStage: 'in_progress',
    });
    expect(result.success).toBe(false);
  });

  it('should reject transition from completed (terminal state)', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'completed',
      toStage: 'initiation',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid projectId (not UUID)', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'not-a-uuid',
      fromStage: 'initiation',
      toStage: 'planning',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid stage values', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'invalid_stage',
      toStage: 'planning',
    });
    expect(result.success).toBe(false);
  });

  it('should reject self-transition', () => {
    const result = transitionStageSchema.safeParse({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fromStage: 'planning',
      toStage: 'planning',
    });
    expect(result.success).toBe(false);
  });

  it('should validate all 15 allowed transitions succeed', () => {
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const to of targets) {
        const result = transitionStageSchema.safeParse({
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          fromStage: from,
          toStage: to,
        });
        expect(result.success).toBe(true);
      }
    }
  });

  it('should reject all disallowed transitions', () => {
    const allStages = Object.keys(ALLOWED_TRANSITIONS) as ProjectStage[];
    for (const from of allStages) {
      const allowed = ALLOWED_TRANSITIONS[from];
      for (const to of allStages) {
        if (from === to) continue;
        if (allowed.includes(to)) continue;
        const result = transitionStageSchema.safeParse({
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          fromStage: from,
          toStage: to,
        });
        expect(result.success).toBe(false);
      }
    }
  });
});

// ── projectFiltersSchema ─────────────────────────────────────────

describe('projectFiltersSchema', () => {
  it('should accept empty object and apply defaults', () => {
    const result = projectFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sortBy).toBe('updated_at');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should accept valid filter combination', () => {
    const result = projectFiltersSchema.safeParse({
      search: 'cloud',
      stage: 'in_progress',
      priority: 'high',
      healthStatus: 'on_track',
      page: 2,
      perPage: 50,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(result.success).toBe(true);
  });

  it('should reject page < 1', () => {
    const result = projectFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage > 100', () => {
    const result = projectFiltersSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage < 1', () => {
    const result = projectFiltersSchema.safeParse({ perPage: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortBy column', () => {
    const result = projectFiltersSchema.safeParse({ sortBy: 'invalid_column' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortOrder', () => {
    const result = projectFiltersSchema.safeParse({ sortOrder: 'random' });
    expect(result.success).toBe(false);
  });

  it('should accept valid UUID for departmentId', () => {
    const result = projectFiltersSchema.safeParse({
      departmentId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID for departmentId', () => {
    const result = projectFiltersSchema.safeParse({
      departmentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept boolean isArchived', () => {
    const result = projectFiltersSchema.safeParse({ isArchived: true });
    expect(result.success).toBe(true);
  });

  it('should accept valid date strings for dateFrom/dateTo', () => {
    const result = projectFiltersSchema.safeParse({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });
});
