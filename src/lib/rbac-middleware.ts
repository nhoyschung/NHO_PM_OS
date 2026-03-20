// ── RBAC Middleware — Server Action Permission Guard ─────────────
// Higher-order function that wraps createAction with permission checks.

'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPermission, type Permission } from '@/lib/rbac';
import type { ActionResult } from '@/lib/action';

/**
 * Wrap a server action with authentication + permission check.
 *
 * Usage:
 * ```ts
 * export const createProject = withPermission('project:create',
 *   async (input: CreateInput, userId: string, userRole: string) => {
 *     // ... business logic
 *     return { success: true, data: result };
 *   },
 * );
 * ```
 */
export function withPermission<TInput, TOutput>(
  permission: Permission,
  handler: (
    input: TInput,
    userId: string,
    userRole: string,
  ) => Promise<ActionResult<TOutput>>,
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/login');
    }

    const userRole = session.user.role ?? '';

    if (!hasPermission(userRole, permission)) {
      return {
        success: false,
        error: 'Bạn không có quyền thực hiện hành động này.',
      };
    }

    try {
      return await handler(input, session.user.id, userRole);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  };
}
