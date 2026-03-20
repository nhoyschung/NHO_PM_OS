import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ── Constants ────────────────────────────────────────────────────

const SRC_ROOT = path.resolve(__dirname, '../../src');
const MODULES_ROOT = path.join(SRC_ROOT, 'modules');

const MODULE_NAMES = [
  'projects',
  'handovers',
  'documents',
  'tasks',
  'notifications',
  'audit-logs',
  'finance',
] as const;

/** Files every module MUST have. */
const REQUIRED_MODULE_FILES = [
  'actions.ts',
  'constants.ts',
  'queries.ts',
  'types.ts',
  'validation.ts',
  'index.ts',
  'components/index.ts',
] as const;

/** Sidebar navigation routes that must exist (all 7 modules + dashboard). */
const EXPECTED_NAV_ROUTES = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/handovers',
  '/dashboard/documents',
  '/dashboard/tasks',
  '/dashboard/finance',
  '/dashboard/audit-logs',
  '/dashboard/notifications',
] as const;

// ── 1. Module Directories & Required Files ───────────────────────

describe('Module directory structure', () => {
  for (const mod of MODULE_NAMES) {
    describe(`${mod} module`, () => {
      const modDir = path.join(MODULES_ROOT, mod);

      it('should have a directory', () => {
        expect(fs.existsSync(modDir)).toBe(true);
        expect(fs.statSync(modDir).isDirectory()).toBe(true);
      });

      for (const file of REQUIRED_MODULE_FILES) {
        it(`should contain ${file}`, () => {
          const filePath = path.join(modDir, file);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }
    });
  }

  it('should have a top-level modules barrel export (src/modules/index.ts)', () => {
    const barrelPath = path.join(MODULES_ROOT, 'index.ts');
    expect(fs.existsSync(barrelPath)).toBe(true);
  });
});

// ── 2. Sidebar Navigation Completeness ──────────────────────────

describe('Sidebar navigation', () => {
  const sidebarPath = path.join(SRC_ROOT, 'components/layout/sidebar.tsx');

  it('sidebar.tsx should exist', () => {
    expect(fs.existsSync(sidebarPath)).toBe(true);
  });

  it('should contain all expected navigation routes', () => {
    const content = fs.readFileSync(sidebarPath, 'utf-8');
    for (const route of EXPECTED_NAV_ROUTES) {
      expect(content).toContain(route);
    }
  });

  it('should use Vietnamese labels', () => {
    const content = fs.readFileSync(sidebarPath, 'utf-8');
    const vietnameseLabels = [
      'Dự án',
      'Bàn giao',
      'Tài liệu',
      'Công việc',
      'Tài chính',
      'Nhật ký',
      'Thông báo',
    ];
    for (const label of vietnameseLabels) {
      expect(content).toContain(label);
    }
  });
});

// ── 3. RBAC Permission Matrix Coverage ──────────────────────────

describe('RBAC permission matrix', () => {
  it('every module should export a PERMISSIONS object in constants.ts', () => {
    for (const mod of MODULE_NAMES) {
      const constantsPath = path.join(MODULES_ROOT, mod, 'constants.ts');
      const content = fs.readFileSync(constantsPath, 'utf-8');
      expect(content).toContain('export const PERMISSIONS');
    }
  });

  it('rbac.ts should import PERMISSIONS from all 7 modules', () => {
    const rbacPath = path.join(SRC_ROOT, 'lib/rbac.ts');
    const content = fs.readFileSync(rbacPath, 'utf-8');
    for (const mod of MODULE_NAMES) {
      expect(content).toContain(`@/modules/${mod}/constants`);
    }
  });
});

// ── 4. Module Actions Use createAction Wrapper ──────────────────

describe('Server action wrapper usage', () => {
  for (const mod of MODULE_NAMES) {
    it(`${mod}/actions.ts should import createAction from @/lib/action`, () => {
      const actionsPath = path.join(MODULES_ROOT, mod, 'actions.ts');
      const content = fs.readFileSync(actionsPath, 'utf-8');
      expect(content).toContain("from '@/lib/action'");
      expect(content).toContain('createAction');
    });

    it(`${mod}/actions.ts should use 'use server' directive`, () => {
      const actionsPath = path.join(MODULES_ROOT, mod, 'actions.ts');
      const content = fs.readFileSync(actionsPath, 'utf-8');
      expect(content).toContain("'use server'");
    });
  }
});

// ── 5. Module Index Re-exports ──────────────────────────────────

describe('Module barrel exports', () => {
  it('top-level modules/index.ts should reference all 7 modules', () => {
    const barrelPath = path.join(MODULES_ROOT, 'index.ts');
    const content = fs.readFileSync(barrelPath, 'utf-8');
    for (const mod of MODULE_NAMES) {
      expect(content).toContain(`./${mod}`);
    }
  });

  for (const mod of MODULE_NAMES) {
    it(`${mod}/index.ts should re-export from ./components`, () => {
      const indexPath = path.join(MODULES_ROOT, mod, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain("from './components'");
    });
  }
});
