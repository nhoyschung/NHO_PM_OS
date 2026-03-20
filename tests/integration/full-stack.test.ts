import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ── Constants ────────────────────────────────────────────────────

const SRC_ROOT = path.resolve(__dirname, '../../src');
const MODULES_ROOT = path.join(SRC_ROOT, 'modules');

const CORE_MODULE_NAMES = [
  'projects',
  'handovers',
  'documents',
  'tasks',
  'notifications',
  'audit-logs',
  'finance',
] as const;

// ════════════════════════════════════════════════════════════════════
// 1. Module Exports — All Modules Have Required File Exports
// ════════════════════════════════════════════════════════════════════

describe('Module exports completeness', () => {
  for (const mod of CORE_MODULE_NAMES) {
    describe(`${mod} module`, () => {
      it('should export constants from constants.ts', () => {
        const filePath = path.join(MODULES_ROOT, mod, 'constants.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('export const');
      });

      it('should export types from types.ts', () => {
        const filePath = path.join(MODULES_ROOT, mod, 'types.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/export (type|interface|const)/);
      });

      it('should export validation schemas from validation.ts', () => {
        const filePath = path.join(MODULES_ROOT, mod, 'validation.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('export const');
        expect(content).toContain('z.');
      });

      it('should export query functions from queries.ts', () => {
        const filePath = path.join(MODULES_ROOT, mod, 'queries.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/export (async )?function/);
      });

      it('should export server actions from actions.ts with "use server" directive', () => {
        const filePath = path.join(MODULES_ROOT, mod, 'actions.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain("'use server'");
        expect(content).toContain('createAction');
      });
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// 2. Barrel Exports — All Module index.ts Re-export Properly
// ════════════════════════════════════════════════════════════════════

describe('Module barrel exports', () => {
  it('top-level modules/index.ts should reference all 7 core modules + dashboard + compliance', () => {
    const barrelPath = path.join(MODULES_ROOT, 'index.ts');
    const content = fs.readFileSync(barrelPath, 'utf-8');
    for (const mod of CORE_MODULE_NAMES) {
      expect(content).toContain(`./${mod}`);
    }
    expect(content).toContain('./dashboard');
    expect(content).toContain('./compliance');
  });

  for (const mod of CORE_MODULE_NAMES) {
    it(`${mod}/index.ts should export from ./components`, () => {
      const indexPath = path.join(MODULES_ROOT, mod, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain("from './components'");
    });

    it(`${mod}/index.ts should export PERMISSIONS from ./constants`, () => {
      const indexPath = path.join(MODULES_ROOT, mod, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('PERMISSIONS');
    });
  }

  it('dashboard/index.ts should export components and queries', () => {
    const indexPath = path.join(MODULES_ROOT, 'dashboard', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain("from './components'");
    expect(content).toContain('getDashboardStats');
  });

  it('compliance/index.ts should export ComplianceDashboard and runComplianceChecks', () => {
    const indexPath = path.join(MODULES_ROOT, 'compliance', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('ComplianceDashboard');
    expect(content).toContain('runComplianceChecks');
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. RBAC Covers All Module Permissions
// ════════════════════════════════════════════════════════════════════

describe('RBAC permission coverage', () => {
  const rbacPath = path.join(SRC_ROOT, 'lib/rbac.ts');

  it('rbac.ts should import PERMISSIONS from all 7 core modules', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    for (const mod of CORE_MODULE_NAMES) {
      expect(content).toContain(`@/modules/${mod}/constants`);
    }
  });

  it('rbac.ts should export hasPermission function', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    expect(content).toContain('export function hasPermission');
  });

  it('rbac.ts should export getPermissionsForRole function', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    expect(content).toContain('export function getPermissionsForRole');
  });

  it('rbac.ts should export requirePermission function', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    expect(content).toContain('export function requirePermission');
  });

  it('rbac.ts should export isRoleAtLeast function', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    expect(content).toContain('export function isRoleAtLeast');
  });

  it('rbac.ts should define all 5 roles (admin, manager, lead, member, viewer)', () => {
    const content = fs.readFileSync(rbacPath, 'utf-8');
    const roles = ['admin', 'manager', 'lead', 'member', 'viewer'];
    for (const role of roles) {
      expect(content).toContain(role);
    }
  });

  it('each module constants.ts should export a PERMISSIONS object', () => {
    for (const mod of CORE_MODULE_NAMES) {
      const constantsPath = path.join(MODULES_ROOT, mod, 'constants.ts');
      const content = fs.readFileSync(constantsPath, 'utf-8');
      expect(content).toContain('export const PERMISSIONS');
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. Notification Trigger Functions Exist and Are Typed
// ════════════════════════════════════════════════════════════════════

describe('Notification trigger functions', () => {
  const triggersPath = path.join(SRC_ROOT, 'lib/notification-triggers.ts');

  it('notification-triggers.ts should exist', () => {
    expect(fs.existsSync(triggersPath)).toBe(true);
  });

  const expectedFunctions = [
    'notifyProjectStageChange',
    'notifyHandoverStatusChange',
    'notifyTaskAssigned',
    'notifyTaskOverdue',
    'notifyFinanceApproval',
  ];

  for (const fn of expectedFunctions) {
    it(`should export ${fn}`, () => {
      const content = fs.readFileSync(triggersPath, 'utf-8');
      expect(content).toContain(`export async function ${fn}`);
    });
  }

  it('should use typed NotificationType and NotificationPriority imports', () => {
    const content = fs.readFileSync(triggersPath, 'utf-8');
    expect(content).toContain('NotificationType');
    expect(content).toContain('NotificationPriority');
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. Report Generation Functions Exist
// ════════════════════════════════════════════════════════════════════

describe('Report generation', () => {
  const reportsDir = path.join(MODULES_ROOT, 'reports');

  it('reports module should have types.ts with ReportType and ExportFormat', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'types.ts'), 'utf-8');
    expect(content).toContain('ReportType');
    expect(content).toContain('ExportFormat');
    expect(content).toContain('ReportConfigSchema');
  });

  it('reports module should have queries.ts with all 4 report query functions', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'queries.ts'), 'utf-8');
    expect(content).toContain('getProjectSummaryReport');
    expect(content).toContain('getFinanceSummaryReport');
    expect(content).toContain('getTaskCompletionReport');
    expect(content).toContain('getHandoverStatusReport');
  });

  it('reports module should have actions.ts with generateReport and exportToCsv', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'actions.ts'), 'utf-8');
    expect(content).toContain('generateReport');
    expect(content).toContain('exportToCsv');
    expect(content).toContain("'use server'");
  });

  it('reports module should have constants.ts with REPORT_TYPE_LABELS', () => {
    const content = fs.readFileSync(path.join(reportsDir, 'constants.ts'), 'utf-8');
    expect(content).toContain('REPORT_TYPE_LABELS');
    expect(content).toContain('EXPORT_FORMAT_LABELS');
    expect(content).toContain('REPORT_MAX_ROWS');
  });

  it('reports module should have ReportGenerator and ReportPreview components', () => {
    const indexPath = path.join(reportsDir, 'components/index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('ReportGenerator');
    expect(content).toContain('ReportPreview');
  });
});

// ════════════════════════════════════════════════════════════════════
// 6. Compliance Check Functions Exist
// ════════════════════════════════════════════════════════════════════

describe('Compliance checks', () => {
  const complianceDir = path.join(MODULES_ROOT, 'compliance');

  it('compliance module should have types.ts with ComplianceCheck and ComplianceReport', () => {
    const content = fs.readFileSync(path.join(complianceDir, 'types.ts'), 'utf-8');
    expect(content).toContain('ComplianceCheck');
    expect(content).toContain('ComplianceReport');
    expect(content).toContain('ComplianceStatus');
  });

  it('compliance module should export runComplianceChecks from queries.ts', () => {
    const content = fs.readFileSync(path.join(complianceDir, 'queries.ts'), 'utf-8');
    expect(content).toContain('export async function runComplianceChecks');
  });

  it('compliance queries.ts should contain 5 individual check functions', () => {
    const content = fs.readFileSync(path.join(complianceDir, 'queries.ts'), 'utf-8');
    const checks = [
      'checkHandoverPerTransition',
      'checkFinanceApproval',
      'checkRequiredDocuments',
      'checkAuditCompleteness',
      'checkRbacEnforcement',
    ];
    for (const check of checks) {
      expect(content).toContain(check);
    }
  });

  it('compliance module should have partner-queries.ts for partner portal', () => {
    const content = fs.readFileSync(path.join(complianceDir, 'partner-queries.ts'), 'utf-8');
    expect(content).toContain('getProjectsByMember');
    expect(content).toContain('isProjectMember');
  });

  it('compliance module should have ComplianceDashboard, PartnerProjectList, PartnerProjectDetail components', () => {
    const indexPath = path.join(complianceDir, 'components/index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('ComplianceDashboard');
    expect(content).toContain('PartnerProjectList');
    expect(content).toContain('PartnerProjectDetail');
  });
});

// ════════════════════════════════════════════════════════════════════
// 7. Partner Portal Routes Exist (File System Check)
// ════════════════════════════════════════════════════════════════════

describe('Partner portal routes', () => {
  const appRoot = path.join(SRC_ROOT, 'app');

  it('should have partner route group directory', () => {
    expect(fs.existsSync(path.join(appRoot, 'partner'))).toBe(true);
  });

  it('should have partner layout.tsx', () => {
    expect(fs.existsSync(path.join(appRoot, 'partner/layout.tsx'))).toBe(true);
  });

  it('should have partner projects list page', () => {
    expect(fs.existsSync(path.join(appRoot, 'partner/projects/page.tsx'))).toBe(true);
  });

  it('should have partner project detail page', () => {
    expect(fs.existsSync(path.join(appRoot, 'partner/projects/[id]/page.tsx'))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// 8. Dashboard Queries Aggregate From All Modules
// ════════════════════════════════════════════════════════════════════

describe('Dashboard query aggregation', () => {
  const queriesPath = path.join(MODULES_ROOT, 'dashboard/queries.ts');

  it('dashboard queries.ts should import from projects module', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('@/modules/projects/queries');
  });

  it('dashboard queries.ts should import from tasks module', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('@/modules/tasks/queries');
  });

  it('dashboard queries.ts should import from finance module', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('@/modules/finance/queries');
  });

  it('dashboard queries.ts should import from audit-logs module', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('@/modules/audit-logs/queries');
  });

  it('dashboard queries.ts should export getDashboardStats', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('export async function getDashboardStats');
  });

  it('dashboard queries.ts should aggregate via Promise.all', () => {
    const content = fs.readFileSync(queriesPath, 'utf-8');
    expect(content).toContain('Promise.all');
  });

  it('dashboard types.ts should define DashboardStats and StatCardData', () => {
    const typesPath = path.join(MODULES_ROOT, 'dashboard/types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');
    expect(content).toContain('DashboardStats');
    expect(content).toContain('StatCardData');
  });
});

// ════════════════════════════════════════════════════════════════════
// 9. Cross-module Type Safety — Dashboard Types Reference Other Modules
// ════════════════════════════════════════════════════════════════════

describe('Cross-module type references', () => {
  it('dashboard types.ts should import from projects, tasks, finance, audit-logs', () => {
    const typesPath = path.join(MODULES_ROOT, 'dashboard/types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');
    expect(content).toContain('@/modules/projects/queries');
    expect(content).toContain('@/modules/tasks/queries');
    expect(content).toContain('@/modules/finance/types');
    expect(content).toContain('@/modules/audit-logs/types');
  });

  it('notification-triggers.ts should import types from notifications module', () => {
    const triggersPath = path.join(SRC_ROOT, 'lib/notification-triggers.ts');
    const content = fs.readFileSync(triggersPath, 'utf-8');
    expect(content).toContain('@/modules/notifications/types');
  });

  it('notification-triggers.ts should import constants from projects, handovers, finance', () => {
    const triggersPath = path.join(SRC_ROOT, 'lib/notification-triggers.ts');
    const content = fs.readFileSync(triggersPath, 'utf-8');
    expect(content).toContain('@/modules/projects/constants');
    expect(content).toContain('@/modules/handovers/constants');
    expect(content).toContain('@/modules/finance/constants');
  });
});

// ════════════════════════════════════════════════════════════════════
// 10. Application Page Routes Exist for All Modules
// ════════════════════════════════════════════════════════════════════

describe('Dashboard page routes', () => {
  const dashboardRoot = path.join(SRC_ROOT, 'app/dashboard');

  const expectedPages = [
    { route: 'page.tsx', desc: 'dashboard home' },
    { route: 'projects/page.tsx', desc: 'projects list' },
    { route: 'projects/[slug]/page.tsx', desc: 'project detail' },
    { route: 'projects/new/page.tsx', desc: 'new project' },
    { route: 'handovers/page.tsx', desc: 'handovers list' },
    { route: 'documents/page.tsx', desc: 'documents list' },
    { route: 'documents/new/page.tsx', desc: 'new document' },
    { route: 'tasks/page.tsx', desc: 'tasks list' },
    { route: 'finance/page.tsx', desc: 'finance list' },
    { route: 'audit-logs/page.tsx', desc: 'audit logs' },
    { route: 'notifications/page.tsx', desc: 'notifications' },
    { route: 'compliance/page.tsx', desc: 'compliance dashboard' },
    { route: 'reports/page.tsx', desc: 'reports' },
  ];

  for (const { route, desc } of expectedPages) {
    it(`should have ${desc} page (${route})`, () => {
      const fullPath = path.join(dashboardRoot, route);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }
});
