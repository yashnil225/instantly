/**
 * Lightweight timeout guard for Vercel serverless functions.
 * Create at the start of a route handler and check `isTimedOut()`
 * before starting each new unit of work.
 */
export function createTimeoutGuard(maxMs: number) {
  const start = Date.now()
  return {
    /** Returns true if elapsed time exceeds the safety margin */
    isTimedOut: () => Date.now() - start > maxMs,
    /** Milliseconds elapsed since creation */
    elapsedMs: () => Date.now() - start,
    /** Whole seconds elapsed since creation */
    elapsedSec: () => Math.floor((Date.now() - start) / 1000),
  }
}
