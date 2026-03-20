import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getPermissionsForRole,
  isValidRole,
  isRoleAtLeast,
  requirePermission,
  PermissionDeniedError,
  ALL_PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_LABELS,
  type UserRole,
  type Permission,
} from '@/lib/rbac';

import { PERMISSIONS as PROJECT_PERMISSIONS } from '@/modules/projects/constants';
import { PERMISSIONS as HANDOVER_PERMISSIONS } from '@/modules/handovers/constants';
import { PERMISSIONS as DOCUMENT_PERMISSIONS } from '@/modules/documents/constants';
import { PERMISSIONS as TASK_PERMISSIONS } from '@/modules/tasks/constants';
import { PERMISSIONS as NOTIFICATION_PERMISSIONS } from '@/modules/notifications/constants';
import { PERMISSIONS as AUDIT_LOG_PERMISSIONS } from '@/modules/audit-logs/constants';
import { PERMISSIONS as FINANCE_PERMISSIONS } from '@/modules/finance/constants';

// ── Helper ──────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = ['admin', 'manager', 'lead', 'member', 'viewer'];

function allPermissionValues(): string[] {
  return [
    ...Object.values(PROJECT_PERMISSIONS),
    ...Object.values(HANDOVER_PERMISSIONS),
    ...Object.values(DOCUMENT_PERMISSIONS),
    ...Object.values(TASK_PERMISSIONS),
    ...Object.values(NOTIFICATION_PERMISSIONS),
    ...Object.values(AUDIT_LOG_PERMISSIONS),
    ...Object.values(FINANCE_PERMISSIONS),
  ];
}

// ── Tests ───────────────────────────────────────────────────────

describe('RBAC Engine', () => {
  // ── Role Hierarchy ──────────────────────────────────────────

  describe('Role hierarchy', () => {
    it('should define exactly 5 roles', () => {
      expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(5);
    });

    it('should have descending levels: admin > manager > lead > member > viewer', () => {
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
      expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.lead);
      expect(ROLE_HIERARCHY.lead).toBeGreaterThan(ROLE_HIERARCHY.member);
      expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.viewer);
    });

    it('should have Vietnamese labels for every role', () => {
      for (const role of ALL_ROLES) {
        expect(ROLE_LABELS[role]).toBeDefined();
        expect(typeof ROLE_LABELS[role]).toBe('string');
        expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
      }
    });
  });

  // ── isValidRole ─────────────────────────────────────────────

  describe('isValidRole', () => {
    it.each(ALL_ROLES)('should return true for "%s"', (role) => {
      expect(isValidRole(role)).toBe(true);
    });

    it.each(['superadmin', 'director', 'staff', 'partner', '', 'ADMIN', 'Manager'])(
      'should return false for "%s"',
      (role) => {
        expect(isValidRole(role)).toBe(false);
      },
    );
  });

  // ── Permission Matrix Completeness ──────────────────────────

  describe('Permission matrix completeness', () => {
    it('ALL_PERMISSIONS should include every permission from every module', () => {
      const expected = allPermissionValues();
      for (const perm of expected) {
        expect(ALL_PERMISSIONS).toContain(perm);
      }
    });

    it('ALL_PERMISSIONS count should equal the total from all modules', () => {
      const expected = allPermissionValues();
      expect(ALL_PERMISSIONS).toHaveLength(expected.length);
    });

    it('every permission should follow resource:action pattern', () => {
      for (const perm of ALL_PERMISSIONS) {
        expect(perm).toMatch(/^[a-z_]+:[a-z_]+(?::[a-z_]+)?$/);
      }
    });
  });

  // ── Admin Permissions ───────────────────────────────────────

  describe('Admin role', () => {
    it('should have ALL permissions', () => {
      const adminPerms = getPermissionsForRole('admin');
      for (const perm of ALL_PERMISSIONS) {
        expect(adminPerms).toContain(perm);
      }
    });

    it('should have the same count as ALL_PERMISSIONS', () => {
      expect(getPermissionsForRole('admin')).toHaveLength(ALL_PERMISSIONS.length);
    });
  });

  // ── Viewer (Minimal) Permissions ────────────────────────────

  describe('Viewer role', () => {
    it('should have read-only access to projects, handovers, documents, tasks', () => {
      expect(hasPermission('viewer', 'project:read')).toBe(true);
      expect(hasPermission('viewer', 'handover:read')).toBe(true);
      expect(hasPermission('viewer', 'document:read')).toBe(true);
      expect(hasPermission('viewer', 'task:read')).toBe(true);
    });

    it('should NOT have create/update/delete permissions on core modules', () => {
      expect(hasPermission('viewer', 'project:create')).toBe(false);
      expect(hasPermission('viewer', 'project:update')).toBe(false);
      expect(hasPermission('viewer', 'project:delete')).toBe(false);
      expect(hasPermission('viewer', 'handover:create')).toBe(false);
      expect(hasPermission('viewer', 'document:create')).toBe(false);
      expect(hasPermission('viewer', 'task:create')).toBe(false);
    });

    it('should NOT have audit log or finance access', () => {
      expect(hasPermission('viewer', 'audit_log:read')).toBe(false);
      expect(hasPermission('viewer', 'finance:read')).toBe(false);
    });

    it('should have notification:read and notification:mark_read', () => {
      expect(hasPermission('viewer', 'notification:read')).toBe(true);
      expect(hasPermission('viewer', 'notification:mark_read')).toBe(true);
    });
  });

  // ── Member Permissions ──────────────────────────────────────

  describe('Member role', () => {
    it('should be able to create and update tasks', () => {
      expect(hasPermission('member', 'task:create')).toBe(true);
      expect(hasPermission('member', 'task:update')).toBe(true);
      expect(hasPermission('member', 'task:transition')).toBe(true);
      expect(hasPermission('member', 'task:comment')).toBe(true);
    });

    it('should NOT be able to assign tasks', () => {
      expect(hasPermission('member', 'task:assign')).toBe(false);
    });

    it('should be able to create documents', () => {
      expect(hasPermission('member', 'document:create')).toBe(true);
      expect(hasPermission('member', 'document:read')).toBe(true);
    });

    it('should NOT have finance permissions', () => {
      expect(hasPermission('member', 'finance:read')).toBe(false);
      expect(hasPermission('member', 'finance:create')).toBe(false);
    });

    it('should NOT have audit_log permissions', () => {
      expect(hasPermission('member', 'audit_log:read')).toBe(false);
    });
  });

  // ── Lead Permissions ────────────────────────────────────────

  describe('Lead role', () => {
    it('should have all task permissions', () => {
      for (const perm of Object.values(TASK_PERMISSIONS)) {
        expect(hasPermission('lead', perm as Permission)).toBe(true);
      }
    });

    it('should have audit_log:read but NOT audit_log:export', () => {
      expect(hasPermission('lead', 'audit_log:read')).toBe(true);
      expect(hasPermission('lead', 'audit_log:export')).toBe(false);
    });

    it('should have finance:read but NOT finance:create or finance:approve', () => {
      expect(hasPermission('lead', 'finance:read')).toBe(true);
      expect(hasPermission('lead', 'finance:create')).toBe(false);
      expect(hasPermission('lead', 'finance:approve')).toBe(false);
    });

    it('should NOT be able to approve/reject handovers', () => {
      expect(hasPermission('lead', 'handover:approve')).toBe(false);
      expect(hasPermission('lead', 'handover:reject')).toBe(false);
    });
  });

  // ── Manager Permissions ─────────────────────────────────────

  describe('Manager role', () => {
    it('should have all project permissions', () => {
      for (const perm of Object.values(PROJECT_PERMISSIONS)) {
        expect(hasPermission('manager', perm as Permission)).toBe(true);
      }
    });

    it('should have all handover permissions', () => {
      for (const perm of Object.values(HANDOVER_PERMISSIONS)) {
        expect(hasPermission('manager', perm as Permission)).toBe(true);
      }
    });

    it('should have all finance permissions', () => {
      for (const perm of Object.values(FINANCE_PERMISSIONS)) {
        expect(hasPermission('manager', perm as Permission)).toBe(true);
      }
    });

    it('should have audit_log:read and audit_log:export', () => {
      expect(hasPermission('manager', 'audit_log:read')).toBe(true);
      expect(hasPermission('manager', 'audit_log:export')).toBe(true);
    });
  });

  // ── isRoleAtLeast ───────────────────────────────────────────

  describe('isRoleAtLeast', () => {
    it('admin should be at least any role', () => {
      for (const role of ALL_ROLES) {
        expect(isRoleAtLeast('admin', role)).toBe(true);
      }
    });

    it('viewer should only be at least viewer', () => {
      expect(isRoleAtLeast('viewer', 'viewer')).toBe(true);
      expect(isRoleAtLeast('viewer', 'member')).toBe(false);
      expect(isRoleAtLeast('viewer', 'lead')).toBe(false);
      expect(isRoleAtLeast('viewer', 'manager')).toBe(false);
      expect(isRoleAtLeast('viewer', 'admin')).toBe(false);
    });

    it('lead should be at least lead, member, viewer', () => {
      expect(isRoleAtLeast('lead', 'viewer')).toBe(true);
      expect(isRoleAtLeast('lead', 'member')).toBe(true);
      expect(isRoleAtLeast('lead', 'lead')).toBe(true);
      expect(isRoleAtLeast('lead', 'manager')).toBe(false);
      expect(isRoleAtLeast('lead', 'admin')).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(isRoleAtLeast('unknown', 'viewer')).toBe(false);
    });
  });

  // ── hasPermission edge cases ────────────────────────────────

  describe('hasPermission edge cases', () => {
    it('should return false for unknown role', () => {
      expect(hasPermission('superadmin', 'project:read')).toBe(false);
      expect(hasPermission('', 'project:read')).toBe(false);
    });
  });

  // ── getPermissionsForRole ───────────────────────────────────

  describe('getPermissionsForRole', () => {
    it('should return empty array for unknown role', () => {
      expect(getPermissionsForRole('unknown')).toEqual([]);
    });

    it('should return more permissions for higher roles', () => {
      const viewerCount = getPermissionsForRole('viewer').length;
      const memberCount = getPermissionsForRole('member').length;
      const leadCount = getPermissionsForRole('lead').length;
      const managerCount = getPermissionsForRole('manager').length;
      const adminCount = getPermissionsForRole('admin').length;

      expect(memberCount).toBeGreaterThan(viewerCount);
      expect(leadCount).toBeGreaterThan(memberCount);
      expect(managerCount).toBeGreaterThan(leadCount);
      expect(adminCount).toBeGreaterThanOrEqual(managerCount);
    });
  });

  // ── requirePermission ───────────────────────────────────────

  describe('requirePermission', () => {
    it('should not throw when permission is granted', () => {
      expect(() => requirePermission('admin', 'project:create')).not.toThrow();
    });

    it('should throw PermissionDeniedError when permission is denied', () => {
      expect(() => requirePermission('viewer', 'project:create')).toThrow(
        PermissionDeniedError,
      );
    });

    it('should include permission name in error', () => {
      try {
        requirePermission('viewer', 'project:delete');
        expect.unreachable('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PermissionDeniedError);
        expect((e as PermissionDeniedError).permission).toBe('project:delete');
      }
    });

    it('should throw for unknown role', () => {
      expect(() => requirePermission('unknown', 'project:read')).toThrow(
        PermissionDeniedError,
      );
    });
  });

  // ── Cross-role permission monotonicity ──────────────────────
  // Higher roles should have at least all permissions of lower roles.

  describe('Permission monotonicity (superset check)', () => {
    const orderedRoles: UserRole[] = ['viewer', 'member', 'lead', 'manager', 'admin'];

    it('each higher role should be a superset of the role below it', () => {
      for (let i = 1; i < orderedRoles.length; i++) {
        const lower = getPermissionsForRole(orderedRoles[i - 1]);
        const higher = new Set(getPermissionsForRole(orderedRoles[i]));
        for (const perm of lower) {
          expect(higher.has(perm)).toBe(true);
        }
      }
    });
  });
});
