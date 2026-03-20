import { describe, it, expect } from 'vitest';
import {
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  STAGE_COLORS,
  STAGE_ICONS,
  ALLOWED_TRANSITIONS,
  TRANSITION_META,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  HEALTH_LABELS,
  HEALTH_COLORS,
  PROVINCES,
  VALIDATION,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  PROJECT_CODE_PREFIX,
  PERMISSIONS,
  DEFAULT_COLUMN_VISIBILITY,
  FILTER_PRESETS,
} from '@/modules/projects/constants';
import { ProjectStage, ProjectPriority, HealthStatus } from '@/modules/projects/types';

// ── Helpers ──────────────────────────────────────────────────────

const ALL_STAGES: string[] = ProjectStage.options;
const ALL_PRIORITIES: string[] = ProjectPriority.options;
const ALL_HEALTH: string[] = HealthStatus.options;

// ── STAGE_LABELS ─────────────────────────────────────────────────

describe('STAGE_LABELS', () => {
  it('should cover every ProjectStage enum value', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_LABELS).toHaveProperty(stage);
      expect(typeof STAGE_LABELS[stage as keyof typeof STAGE_LABELS]).toBe('string');
    }
  });

  it('should have no extra keys beyond stage values', () => {
    expect(Object.keys(STAGE_LABELS).sort()).toEqual([...ALL_STAGES].sort());
  });

  it('should have non-empty Vietnamese labels', () => {
    for (const stage of ALL_STAGES) {
      const label = STAGE_LABELS[stage as keyof typeof STAGE_LABELS];
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ── STAGE_DESCRIPTIONS ──────────────────────────────────────────

describe('STAGE_DESCRIPTIONS', () => {
  it('should cover every ProjectStage enum value', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_DESCRIPTIONS).toHaveProperty(stage);
    }
  });

  it('should have non-empty descriptions', () => {
    for (const stage of ALL_STAGES) {
      const desc = STAGE_DESCRIPTIONS[stage as keyof typeof STAGE_DESCRIPTIONS];
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});

// ── STAGE_COLORS ────────────────────────────────────────────────

describe('STAGE_COLORS', () => {
  it('should cover every ProjectStage enum value', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_COLORS).toHaveProperty(stage);
    }
  });

  it('should have bg and text properties with valid Tailwind classes', () => {
    for (const stage of ALL_STAGES) {
      const color = STAGE_COLORS[stage as keyof typeof STAGE_COLORS];
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
      expect(color.bg).toMatch(/^bg-[a-z]+-\d{2,3}$/);
      expect(color.text).toMatch(/^text-[a-z]+-\d{2,3}$/);
    }
  });
});

// ── STAGE_ICONS ─────────────────────────────────────────────────

describe('STAGE_ICONS', () => {
  it('should cover every ProjectStage enum value', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_ICONS).toHaveProperty(stage);
      expect(typeof STAGE_ICONS[stage as keyof typeof STAGE_ICONS]).toBe('string');
    }
  });
});

// ── ALLOWED_TRANSITIONS — State Machine (15 total) ─────────────

describe('ALLOWED_TRANSITIONS', () => {
  it('should have an entry for every ProjectStage', () => {
    for (const stage of ALL_STAGES) {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(stage);
      expect(Array.isArray(ALLOWED_TRANSITIONS[stage as keyof typeof ALLOWED_TRANSITIONS])).toBe(true);
    }
  });

  it('should have exactly 15 transitions total', () => {
    let total = 0;
    for (const stage of ALL_STAGES) {
      total += ALLOWED_TRANSITIONS[stage as keyof typeof ALLOWED_TRANSITIONS].length;
    }
    expect(total).toBe(15);
  });

  it('should match the 9 forward transitions from ref-state-machine.md', () => {
    expect(ALLOWED_TRANSITIONS.initiation).toContain('planning');
    expect(ALLOWED_TRANSITIONS.planning).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.in_progress).toContain('review');
    expect(ALLOWED_TRANSITIONS.review).toContain('testing');
    expect(ALLOWED_TRANSITIONS.testing).toContain('staging');
    expect(ALLOWED_TRANSITIONS.staging).toContain('deployment');
    expect(ALLOWED_TRANSITIONS.deployment).toContain('monitoring');
    expect(ALLOWED_TRANSITIONS.monitoring).toContain('handover');
    expect(ALLOWED_TRANSITIONS.handover).toContain('completed');
  });

  it('should match the 6 backward transitions from ref-state-machine.md', () => {
    expect(ALLOWED_TRANSITIONS.review).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.testing).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.staging).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.deployment).toContain('staging');
    expect(ALLOWED_TRANSITIONS.monitoring).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.handover).toContain('monitoring');
  });

  it('should have completed as a terminal state with no outgoing transitions', () => {
    expect(ALLOWED_TRANSITIONS.completed).toEqual([]);
  });

  it('should only reference valid ProjectStage values', () => {
    for (const stage of ALL_STAGES) {
      const targets = ALLOWED_TRANSITIONS[stage as keyof typeof ALLOWED_TRANSITIONS];
      for (const target of targets) {
        expect(ALL_STAGES).toContain(target);
      }
    }
  });
});

// ── TRANSITION_META ─────────────────────────────────────────────

describe('TRANSITION_META', () => {
  it('should have exactly 15 entries', () => {
    expect(Object.keys(TRANSITION_META)).toHaveLength(15);
  });

  it('should have keys matching ALLOWED_TRANSITIONS edges', () => {
    for (const stage of ALL_STAGES) {
      const targets = ALLOWED_TRANSITIONS[stage as keyof typeof ALLOWED_TRANSITIONS];
      for (const target of targets) {
        const key = `${stage}->${target}`;
        expect(TRANSITION_META).toHaveProperty(key);
      }
    }
  });

  it('should have valid shape for each entry', () => {
    for (const [key, meta] of Object.entries(TRANSITION_META)) {
      expect(typeof meta.trigger).toBe('string');
      expect(meta.trigger.length).toBeGreaterThan(0);
      expect(typeof meta.guard).toBe('string');
      expect(Array.isArray(meta.requiredRoles)).toBe(true);
      expect(meta.requiredRoles.length).toBeGreaterThan(0);
      expect(typeof meta.requiresHandover).toBe('boolean');
    }
  });

  it('should only set requiresHandover=true for monitoring->handover', () => {
    for (const [key, meta] of Object.entries(TRANSITION_META)) {
      if (key === 'monitoring->handover') {
        expect(meta.requiresHandover).toBe(true);
      } else {
        expect(meta.requiresHandover).toBe(false);
      }
    }
  });
});

// ── PRIORITY_LABELS ─────────────────────────────────────────────

describe('PRIORITY_LABELS', () => {
  it('should cover every ProjectPriority enum value', () => {
    for (const priority of ALL_PRIORITIES) {
      expect(PRIORITY_LABELS).toHaveProperty(priority);
      expect(typeof PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]).toBe('string');
    }
  });
});

// ── PRIORITY_COLORS ─────────────────────────────────────────────

describe('PRIORITY_COLORS', () => {
  it('should cover every ProjectPriority with valid Tailwind classes', () => {
    for (const priority of ALL_PRIORITIES) {
      const color = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
      expect(color.bg).toMatch(/^bg-[a-z]+-\d{2,3}$/);
      expect(color.text).toMatch(/^text-[a-z]+-\d{2,3}$/);
    }
  });
});

// ── HEALTH_LABELS ───────────────────────────────────────────────

describe('HEALTH_LABELS', () => {
  it('should cover every HealthStatus enum value', () => {
    for (const status of ALL_HEALTH) {
      expect(HEALTH_LABELS).toHaveProperty(status);
      expect(typeof HEALTH_LABELS[status as keyof typeof HEALTH_LABELS]).toBe('string');
    }
  });
});

// ── HEALTH_COLORS ───────────────────────────────────────────────

describe('HEALTH_COLORS', () => {
  it('should cover every HealthStatus with valid Tailwind classes', () => {
    for (const status of ALL_HEALTH) {
      const color = HEALTH_COLORS[status as keyof typeof HEALTH_COLORS];
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
      expect(color.bg).toMatch(/^bg-[a-z]+-\d{2,3}$/);
      expect(color.text).toMatch(/^text-[a-z]+-\d{2,3}$/);
    }
  });
});

// ── PROVINCES ───────────────────────────────────────────────────

describe('PROVINCES', () => {
  it('should have exactly 63 entries', () => {
    expect(PROVINCES).toHaveLength(63);
  });

  it('should have unique value codes', () => {
    const values = PROVINCES.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('should have non-empty value and label for each entry', () => {
    for (const province of PROVINCES) {
      expect(typeof province.value).toBe('string');
      expect(province.value.length).toBeGreaterThan(0);
      expect(typeof province.label).toBe('string');
      expect(province.label.length).toBeGreaterThan(0);
    }
  });

  it('should contain the 5 centrally-run municipalities', () => {
    const labels = PROVINCES.map((p) => p.label);
    expect(labels).toContain('Hà Nội');
    expect(labels).toContain('TP. Hồ Chí Minh');
    expect(labels).toContain('Đà Nẵng');
    expect(labels).toContain('Hải Phòng');
    expect(labels).toContain('Cần Thơ');
  });
});

// ── VALIDATION ──────────────────────────────────────────────────

describe('VALIDATION', () => {
  it('should have positive numeric values for min/max constraints', () => {
    expect(VALIDATION.NAME_MIN).toBeGreaterThan(0);
    expect(VALIDATION.NAME_MAX).toBeGreaterThan(VALIDATION.NAME_MIN);
    expect(VALIDATION.DESCRIPTION_MAX).toBeGreaterThan(0);
    expect(VALIDATION.CATEGORY_MAX).toBeGreaterThan(0);
    expect(VALIDATION.CURRENCY_LENGTH).toBeGreaterThan(0);
    expect(VALIDATION.TAGS_MAX_COUNT).toBeGreaterThan(0);
    expect(VALIDATION.TAG_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('should have a valid CODE_PATTERN regex', () => {
    expect(VALIDATION.CODE_PATTERN).toBeInstanceOf(RegExp);
    expect(VALIDATION.CODE_PATTERN.test('PRJ-001')).toBe(true);
    expect(VALIDATION.CODE_PATTERN.test('PRJ-999')).toBe(true);
    expect(VALIDATION.CODE_PATTERN.test('INVALID')).toBe(false);
    expect(VALIDATION.CODE_PATTERN.test('PRJ001')).toBe(false);
  });
});

// ── Pagination Constants ────────────────────────────────────────

describe('Pagination constants', () => {
  it('should have DEFAULT_PER_PAGE = 20', () => {
    expect(DEFAULT_PER_PAGE).toBe(20);
  });

  it('should have MAX_PER_PAGE = 100', () => {
    expect(MAX_PER_PAGE).toBe(100);
  });

  it('should have DEFAULT_PER_PAGE <= MAX_PER_PAGE', () => {
    expect(DEFAULT_PER_PAGE).toBeLessThanOrEqual(MAX_PER_PAGE);
  });
});

// ── PROJECT_CODE_PREFIX ─────────────────────────────────────────

describe('PROJECT_CODE_PREFIX', () => {
  it('should be "PRJ"', () => {
    expect(PROJECT_CODE_PREFIX).toBe('PRJ');
  });
});

// ── PERMISSIONS ─────────────────────────────────────────────────

describe('PERMISSIONS', () => {
  it('should have permission keys for all CRUD + transition + member + archive operations', () => {
    expect(PERMISSIONS.PROJECT_CREATE).toBeDefined();
    expect(PERMISSIONS.PROJECT_READ).toBeDefined();
    expect(PERMISSIONS.PROJECT_UPDATE).toBeDefined();
    expect(PERMISSIONS.PROJECT_DELETE).toBeDefined();
    expect(PERMISSIONS.PROJECT_TRANSITION).toBeDefined();
    expect(PERMISSIONS.PROJECT_MEMBER_MANAGE).toBeDefined();
    expect(PERMISSIONS.PROJECT_ARCHIVE).toBeDefined();
  });

  it('should follow the "resource:action" naming pattern', () => {
    for (const value of Object.values(PERMISSIONS)) {
      expect(value).toMatch(/^project:\w+/);
    }
  });
});

// ── DEFAULT_COLUMN_VISIBILITY ───────────────────────────────────

describe('DEFAULT_COLUMN_VISIBILITY', () => {
  it('should have boolean values for all keys', () => {
    for (const value of Object.values(DEFAULT_COLUMN_VISIBILITY)) {
      expect(typeof value).toBe('boolean');
    }
  });

  it('should default name, code, stage, priority to visible', () => {
    expect(DEFAULT_COLUMN_VISIBILITY.name).toBe(true);
    expect(DEFAULT_COLUMN_VISIBILITY.code).toBe(true);
    expect(DEFAULT_COLUMN_VISIBILITY.stage).toBe(true);
    expect(DEFAULT_COLUMN_VISIBILITY.priority).toBe(true);
  });
});

// ── FILTER_PRESETS ──────────────────────────────────────────────

describe('FILTER_PRESETS', () => {
  it('should have a label and filters object for each preset', () => {
    for (const [key, preset] of Object.entries(FILTER_PRESETS)) {
      expect(typeof preset.label).toBe('string');
      expect(typeof preset.filters).toBe('object');
    }
  });

  it('should include ALL_ACTIVE, AT_RISK, BLOCKED, COMPLETED, ARCHIVED presets', () => {
    expect(FILTER_PRESETS).toHaveProperty('ALL_ACTIVE');
    expect(FILTER_PRESETS).toHaveProperty('AT_RISK');
    expect(FILTER_PRESETS).toHaveProperty('BLOCKED');
    expect(FILTER_PRESETS).toHaveProperty('COMPLETED');
    expect(FILTER_PRESETS).toHaveProperty('ARCHIVED');
  });
});
