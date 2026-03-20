import { auth } from '@/lib/auth';

/** Get the current session user (or null if not authenticated). */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throw if the request is not authenticated. Returns the session user. */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: authentication required');
  }
  return user;
}

/** Throw if the authenticated user does not have one of the required roles. */
export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(
      `Forbidden: required role(s) [${roles.join(', ')}], got "${user.role}"`,
    );
  }
  return user;
}
