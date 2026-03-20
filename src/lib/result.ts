/** Discriminated union for type-safe success/failure handling. */
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Create a success Result. */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Create a failure Result. */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Type guard: true when Result is Ok. */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/** Type guard: true when Result is Err. */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/** Extract the value or throw. Use only when failure is unexpected. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error(
    typeof result.error === 'string'
      ? result.error
      : `unwrap() called on Err: ${JSON.stringify(result.error)}`,
  );
}

/** Extract the value or return a fallback. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export type { Result };
