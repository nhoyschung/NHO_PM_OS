import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Wrap a server action with auth check and error handling. */
export function createAction<TInput, TOutput>(
  handler: (input: TInput, userId: string) => Promise<ActionResult<TOutput>>,
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/login');
    }
    try {
      return await handler(input, session.user.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/** Build a success result. */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/** Build a failure result. */
export function err<T>(error: string): ActionResult<T> {
  return { success: false, error };
}

export type { ActionResult };
