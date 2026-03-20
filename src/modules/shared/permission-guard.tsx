'use client';

import { hasPermission, type Permission } from '@/lib/rbac';

interface PermissionGuardProps {
  /** The permission required to render children. */
  permission: Permission;
  /** Current user role from session. */
  userRole: string;
  /** Content to render when the user has the permission. */
  children: React.ReactNode;
  /** Optional fallback to render when permission is denied. Defaults to null (hidden). */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on whether the user role
 * has the specified permission.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard permission="project:create" userRole={session.user.role}>
 *   <Button>Tạo dự án</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  userRole,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
