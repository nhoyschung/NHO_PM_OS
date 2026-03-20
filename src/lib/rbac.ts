// ── RBAC Engine — Role-Based Access Control ─────────────────────
// Unified permission system across all ProjectOpsOS modules.
// Roles: admin > manager > lead > member > viewer (matches DB seed levels).

import { PERMISSIONS as PROJECT_PERMISSIONS } from '@/modules/projects/constants';
import { PERMISSIONS as HANDOVER_PERMISSIONS } from '@/modules/handovers/constants';
import { PERMISSIONS as DOCUMENT_PERMISSIONS } from '@/modules/documents/constants';
import { PERMISSIONS as TASK_PERMISSIONS } from '@/modules/tasks/constants';
import { PERMISSIONS as NOTIFICATION_PERMISSIONS } from '@/modules/notifications/constants';
import { PERMISSIONS as AUDIT_LOG_PERMISSIONS } from '@/modules/audit-logs/constants';
import { PERMISSIONS as FINANCE_PERMISSIONS } from '@/modules/finance/constants';

// ── All Permission Values (Union Type) ──────────────────────────

const ALL_PERMISSIONS_OBJ = {
  ...PROJECT_PERMISSIONS,
  ...HANDOVER_PERMISSIONS,
  ...DOCUMENT_PERMISSIONS,
  ...TASK_PERMISSIONS,
  ...NOTIFICATION_PERMISSIONS,
  ...AUDIT_LOG_PERMISSIONS,
  ...FINANCE_PERMISSIONS,
} as const;

type AllPermissionsObj = typeof ALL_PERMISSIONS_OBJ;

/** Union of every known permission string (e.g., 'project:create' | 'handover:read' | ...) */
export type Permission = AllPermissionsObj[keyof AllPermissionsObj];

/** All known permission values as a flat array. */
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(
  ALL_PERMISSIONS_OBJ,
) as Permission[];

// ── Role Definitions ────────────────────────────────────────────

/** System role names — matches DB `roles.name` column. */
export type UserRole = 'admin' | 'manager' | 'lead' | 'member' | 'viewer';

/** Role hierarchy levels (higher = more authority). Mirrors DB `roles.level`. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  manager: 80,
  lead: 60,
  member: 40,
  viewer: 20,
} as const;

/** Vietnamese display names for roles. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  lead: 'Trưởng nhóm',
  member: 'Thành viên',
  viewer: 'Người xem',
} as const;

// ── Permission Matrix ───────────────────────────────────────────
// Explicitly defines which permissions each role has.
// Derived from seed.ts permission objects + PRD role-permission table.

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>(ALL_PERMISSIONS),

  manager: new Set<Permission>([
    // Projects: ALL
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'project:transition',
    'project:member:manage',
    'project:archive',
    // Handovers: ALL
    'handover:create',
    'handover:read',
    'handover:update',
    'handover:delete',
    'handover:submit',
    'handover:approve',
    'handover:reject',
    // Documents: ALL
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:approve',
    'document:archive',
    'document:version:create',
    // Tasks: ALL
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'task:transition',
    'task:assign',
    'task:comment',
    // Notifications: ALL
    'notification:read',
    'notification:create',
    'notification:update',
    'notification:delete',
    'notification:mark_read',
    // Audit logs: read + export
    'audit_log:read',
    'audit_log:export',
    // Finance: ALL
    'finance:create',
    'finance:read',
    'finance:update',
    'finance:delete',
    'finance:approve',
    'finance:import',
    'finance:export',
  ]),

  lead: new Set<Permission>([
    // Projects: read + update + transition + member:manage
    'project:read',
    'project:update',
    'project:transition',
    'project:member:manage',
    // Handovers: create + read + update + submit
    'handover:create',
    'handover:read',
    'handover:update',
    'handover:submit',
    // Documents: create + read + update + version:create
    'document:create',
    'document:read',
    'document:update',
    'document:version:create',
    // Tasks: ALL
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'task:transition',
    'task:assign',
    'task:comment',
    // Notifications: ALL
    'notification:read',
    'notification:create',
    'notification:update',
    'notification:delete',
    'notification:mark_read',
    // Audit logs: read only
    'audit_log:read',
    // Finance: read only
    'finance:read',
  ]),

  member: new Set<Permission>([
    // Projects: read only
    'project:read',
    // Handovers: read only
    'handover:read',
    // Documents: create + read + version:create
    'document:create',
    'document:read',
    'document:version:create',
    // Tasks: create + read + update + transition + comment
    'task:create',
    'task:read',
    'task:update',
    'task:transition',
    'task:comment',
    // Notifications: own (read + mark_read)
    'notification:read',
    'notification:mark_read',
    // Audit logs: none
    // Finance: none
  ]),

  viewer: new Set<Permission>([
    // Projects: read only
    'project:read',
    // Handovers: read only
    'handover:read',
    // Documents: read only
    'document:read',
    // Tasks: read only
    'task:read',
    // Notifications: own (read + mark_read)
    'notification:read',
    'notification:mark_read',
    // Audit logs: none
    // Finance: none
  ]),
};

// ── Core RBAC Functions ─────────────────────────────────────────

/** Check whether a given role string is a valid UserRole. */
export function isValidRole(role: string): role is UserRole {
  return role in ROLE_HIERARCHY;
}

/**
 * Check if a user role has a specific permission.
 * Returns false for unknown roles.
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  if (!isValidRole(userRole)) return false;
  return ROLE_PERMISSIONS[userRole].has(permission);
}

/**
 * Get all permissions granted to a role.
 * Returns empty array for unknown roles.
 */
export function getPermissionsForRole(role: string): Permission[] {
  if (!isValidRole(role)) return [];
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Check if roleA has equal or higher authority than roleB.
 * Useful for "can this user manage that user" checks.
 */
export function isRoleAtLeast(userRole: string, minimumRole: UserRole): boolean {
  if (!isValidRole(userRole)) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Require a permission — throws if the role lacks it.
 * Intended for server-side guards where a thrown error is caught upstream.
 */
export function requirePermission(userRole: string, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

// ── Permission Error ────────────────────────────────────────────

export class PermissionDeniedError extends Error {
  public readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Ban khong co quyen thuc hien hanh dong nay. (${permission})`);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
  }
}
