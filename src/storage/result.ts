/**
 * Result type for functional error handling
 * Inspired by Rust's Result<T, E> and functional programming patterns
 */

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? Ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? Err(fn(result.error)) : result;
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

export async function fromPromise<T>(
  promise: Promise<T>,
  mapError: (error: unknown) => Error = (e) => e instanceof Error ? e : new Error(String(e))
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    return Err(mapError(error));
  }
}
