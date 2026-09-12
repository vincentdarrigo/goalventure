/**
 * Wraps an async action so that calls arriving while a previous call is still
 * in flight are collapsed into that same call, instead of invoking the
 * action again. This is the duplicate-tap guard: a user double-tapping "Log
 * Meal" before the first write resolves produces exactly one row, not two.
 * Once the in-flight call settles (resolves or rejects), the next call
 * invokes the action fresh — this only guards against *overlapping* calls,
 * not legitimate repeated actions afterward.
 */
export function onceGuard<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>
): (...args: Args) => Promise<R> {
  let inFlight: Promise<R> | null = null;

  return (...args: Args) => {
    if (inFlight) return inFlight;
    inFlight = fn(...args).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
