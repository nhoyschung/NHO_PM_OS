import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ── Constants ────────────────────────────────────────────────────

const SRC_ROOT = path.resolve(__dirname, '../../src');
const MODULES_ROOT = path.join(SRC_ROOT, 'modules');

// 7 core modules that follow the full module pattern
const CORE_MODULES = [
  'projects',
  'handovers',
  'documents',
  'tasks',
  'notifications',
  'audit-logs',
  'finance',
] as const;

// Extended modules with partial patterns
const EXTENDED_MODULES = ['dashboard', 'reports', 'compliance'] as const;

// Files required in every core module
const CORE_MODULE_FILES = [
  'types.ts',
  'constants.ts',
  'validation.ts',
  'queries.ts',
  'actions.ts',
  'index.ts',
  'components/index.ts',
] as const;

// ════════════════════════════════════════════════════════════════════
// 1. Core Module File Completeness (7 modules)
// ════════════════════════════════════════════════════════════════════

describe('Core module file completeness', () => {
  for (const mod of CORE_MODULES) {
    describe(`${mod}`, () => {
      const modDir = path.join(MODULES_ROOT, mod);

      it('module directory should exist', () => {
        expect(fs.existsSync(modDir)).toBe(true);
        expect(fs.statSync(modDir).isDirectory()).toBe(true);
      });

      for (const file of CORE_MODULE_FILES) {
        it(`should have ${file}`, () => {
          const filePath = path.join(modDir, file);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }

      it('types.ts should export type definitions', () => {
        const content = fs.readFileSync(path.join(modDir, 'types.ts'), 'utf-8');
        // Types must export either TypeScript types/interfaces or Zod schemas
        expect(content).toMatch(/export (type|interface|const \w+.*=.*z\.)/);
      });

      it('constants.ts should export labels (Vietnamese)', () => {
        const content = fs.readFileSync(path.join(modDir, 'constants.ts'), 'utf-8');
        // Each module should have at least one _LABELS export
        expect(content).toMatch(/export const \w+LABELS/);
      });

      it('validation.ts should export Zod schemas', () => {
        const content = fs.readFileSync(path.join(modDir, 'validation.ts'), 'utf-8');
        expect(content).toContain("from 'zod'");
        expect(content).toMatch(/export const \w+Schema/i);
      });

      it('queries.ts should export async query functions', () => {
        const content = fs.readFileSync(path.join(modDir, 'queries.ts'), 'utf-8');
        expect(content).toMatch(/export (async )?function/);
      });

      it('actions.ts should have "use server" directive and use createAction', () => {
        const content = fs.readFileSync(path.join(modDir, 'actions.ts'), 'utf-8');
        expect(content).toContain("'use server'");
        expect(content).toContain('createAction');
      });

      it('index.ts should re-export from ./components', () => {
        const content = fs.readFileSync(path.join(modDir, 'index.ts'), 'utf-8');
        expect(content).toContain("from './components'");
      });

      it('components/index.ts should export at least one component', () => {
        const content = fs.readFileSync(path.join(modDir, 'components/index.ts'), 'utf-8');
        expect(content).toMatch(/export \{/);
      });
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// 2. Dashboard Module Completeness
// ════════════════════════════════════════════════════════════════════

describe('Dashboard module completeness', () => {
  const dashDir = path.join(MODULES_ROOT, 'dashboard');

  const expectedFiles = [
    'types.ts',
    'queries.ts',
    'index.ts',
    'components/index.ts',
  ];

  for (const file of expectedFiles) {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(path.join(dashDir, file))).toBe(true);
    });
  }

  it('types.ts should define DashboardStats', () => {
    const content = fs.readFileSync(path.join(dashDir, 'types.ts'), 'utf-8');
    expect(content).toContain('DashboardStats');
  });

  it('types.ts should define StatCardData', () => {
    const content = fs.readFileSync(path.join(dashDir, 'types.ts'), 'utf-8');
    expect(content).toContain('StatCardData');
  });

  it('queries.ts should export getDashboardStats', () => {
    const content = fs.readFileSync(path.join(dashDir, 'queries.ts'), 'utf-8');
    expect(content).toContain('export async function getDashboardStats');
  });

  it('index.ts should export components and getDashboardStats', () => {
    const content = fs.readFileSync(path.join(dashDir, 'index.ts'), 'utf-8');
    expect(content).toContain('StatCards');
    expect(content).toContain('getDashboardStats');
  });

  it('components should include StatCards, ProjectStageChart, TaskOverview, RecentActivity', () => {
    const indexPath = path.join(dashDir, 'components/index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('StatCards');
    expect(content).toContain('ProjectStageChart');
    expect(content).toContain('TaskOverview');
    expect(content).toContain('RecentActivity');
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. Reports Module Completeness
// ════════════════════════════════════════════════════════════════════

describe('Reports module completeness', () => {
  const reportsDir = path.join(MODULES_ROOT, 'reports');

  const expectedFiles = [
    'types.ts',
    'constants.ts',
    'queries.ts',
    'actions.ts',
    'components/index.ts',
  ];

  for (const file of expectedFiles) {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(path.join(reportsDir, file))).toBe(true);
    });
  }

  it('types.ts should define report row types', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'types.ts'), 'utf-8');
    expect(content).toContain('ProjectSummaryRow');
    expect(content).toContain('FinanceSummaryRow');
    expect(content).toContain('TaskCompletionRow');
    expect(content).toContain('HandoverStatusRow');
    expect(content).toContain('ReportResult');
    expect(content).toContain('CsvColumn');
  });

  it('constants.ts should define report labels and max rows', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'constants.ts'), 'utf-8');
    expect(content).toContain('REPORT_TYPE_LABELS');
    expect(content).toContain('EXPORT_FORMAT_LABELS');
    expect(content).toContain('REPORT_MAX_ROWS');
    expect(content).toContain('UTF8_BOM');
  });

  it('queries.ts should export 4 report query functions', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'queries.ts'), 'utf-8');
    const fns = [
      'getProjectSummaryReport',
      'getFinanceSummaryReport',
      'getTaskCompletionReport',
      'getHandoverStatusReport',
    ];
    for (const fn of fns) {
      expect(content).toContain(`export async function ${fn}`);
    }
  });

  it('actions.ts should export generateReport and csv-utils.ts should export exportToCsv', () => {
    const actionsContent = fs.readFileSync(path.join(reportsDir, 'actions.ts'), 'utf-8');
    expect(actionsContent).toContain('generateReport');
    const csvUtilsContent = fs.readFileSync(path.join(reportsDir, 'csv-utils.ts'), 'utf-8');
    expect(csvUtilsContent).toContain('export function exportToCsv');
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. Compliance Module Completeness
// ════════════════════════════════════════════════════════════════════

describe('Compliance module completeness', () => {
  const compDir = path.join(MODULES_ROOT, 'compliance');

  const expectedFiles = [
    'types.ts',
    'queries.ts',
    'partner-queries.ts',
    'index.ts',
    'components/index.ts',
  ];

  for (const file of expectedFiles) {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(path.join(compDir, file))).toBe(true);
    });
  }

  it('types.ts should define ComplianceCheck, ComplianceReport, ComplianceStatus', () => {
    const content = fs.readFileSync(path.join(compDir, 'types.ts'), 'utf-8');
    expect(content).toContain('ComplianceCheck');
    expect(content).toContain('ComplianceReport');
    expect(content).toContain('ComplianceStatus');
  });

  it('queries.ts should export runComplianceChecks', () => {
    const content = fs.readFileSync(path.join(compDir, 'queries.ts'), 'utf-8');
    expect(content).toContain('export async function runComplianceChecks');
  });

  it('partner-queries.ts should export getProjectsByMember and isProjectMember', () => {
    const content = fs.readFileSync(path.join(compDir, 'partner-queries.ts'), 'utf-8');
    expect(content).toContain('export async function getProjectsByMember');
    expect(content).toContain('export async function isProjectMember');
  });

  it('index.ts should export ComplianceDashboard and runComplianceChecks', () => {
    const content = fs.readFileSync(path.join(compDir, 'index.ts'), 'utf-8');
    expect(content).toContain('ComplianceDashboard');
    expect(content).toContain('runComplianceChecks');
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. Total File Count Per Module
// ════════════════════════════════════════════════════════════════════

describe('Module file counts', () => {
  function countFiles(dir: string): number {
    let total = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        total++;
      } else if (entry.isDirectory()) {
        total += countFiles(path.join(dir, entry.name));
      }
    }
    return total;
  }

  // Each core module should have at least the 7 required files + components
  for (const mod of CORE_MODULES) {
    it(`${mod} should have at least 8 files (7 required + at least 1 component)`, () => {
      const modDir = path.join(MODULES_ROOT, mod);
      const fileCount = countFiles(modDir);
      expect(fileCount).toBeGreaterThanOrEqual(8);
    });
  }

  it('dashboard should have at least 7 files', () => {
    const modDir = path.join(MODULES_ROOT, 'dashboard');
    const fileCount = countFiles(modDir);
    expect(fileCount).toBeGreaterThanOrEqual(7);
  });

  it('reports should have at least 6 files', () => {
    const modDir = path.join(MODULES_ROOT, 'reports');
    const fileCount = countFiles(modDir);
    expect(fileCount).toBeGreaterThanOrEqual(6);
  });

  it('compliance should have at least 7 files', () => {
    const modDir = path.join(MODULES_ROOT, 'compliance');
    const fileCount = countFiles(modDir);
    expect(fileCount).toBeGreaterThanOrEqual(7);
  });
});

// ════════════════════════════════════════════════════════════════════
// 6. Shared Module Files
// ════════════════════════════════════════════════════════════════════

describe('Shared module', () => {
  it('should have permission-guard.tsx component', () => {
    const guardPath = path.join(MODULES_ROOT, 'shared/permission-guard.tsx');
    expect(fs.existsSync(guardPath)).toBe(true);
  });

  it('permission-guard should be exported from top-level barrel', () => {
    const barrelPath = path.join(MODULES_ROOT, 'index.ts');
    const content = fs.readFileSync(barrelPath, 'utf-8');
    expect(content).toContain('PermissionGuard');
  });
});

// ════════════════════════════════════════════════════════════════════
// 7. Component File Verification Per Module
// ════════════════════════════════════════════════════════════════════

describe('Component file existence per module', () => {
  const moduleComponents: Record<string, string[]> = {
    projects: [
      'project-list.tsx',
      'project-detail.tsx',
      'project-form.tsx',
      'stage-badge.tsx',
      'priority-badge.tsx',
      'health-badge.tsx',
      'stage-transition-bar.tsx',
    ],
    handovers: [
      'handover-list.tsx',
      'handover-detail.tsx',
      'handover-form.tsx',
      'status-badge.tsx',
      'type-badge.tsx',
    ],
    documents: [
      'document-list.tsx',
      'document-detail.tsx',
      'document-upload-form.tsx',
      'document-type-badge.tsx',
      'document-status-badge.tsx',
    ],
    tasks: [
      'task-list.tsx',
      'task-detail.tsx',
      'task-form.tsx',
      'task-kanban.tsx',
      'task-status-badge.tsx',
      'task-priority-badge.tsx',
    ],
    notifications: [
      'notification-list.tsx',
      'notification-bell.tsx',
      'notification-item.tsx',
    ],
    'audit-logs': [
      'audit-log-list.tsx',
      'audit-log-filters.tsx',
      'audit-log-timeline.tsx',
      'action-badge.tsx',
      'severity-badge.tsx',
    ],
    finance: [
      'finance-list.tsx',
      'finance-detail.tsx',
      'finance-form.tsx',
      'finance-summary-cards.tsx',
      'finance-csv-import.tsx',
      'finance-dashboard.tsx',
    ],
    dashboard: [
      'stat-cards.tsx',
      'project-stage-chart.tsx',
      'task-overview.tsx',
      'recent-activity.tsx',
    ],
    reports: [
      'report-generator.tsx',
      'report-preview.tsx',
    ],
    compliance: [
      'compliance-dashboard.tsx',
      'partner-project-list.tsx',
      'partner-project-detail.tsx',
    ],
  };

  for (const [mod, components] of Object.entries(moduleComponents)) {
    describe(`${mod} components`, () => {
      for (const component of components) {
        it(`should have ${component}`, () => {
          const filePath = path.join(MODULES_ROOT, mod, 'components', component);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }
    });
  }
});
