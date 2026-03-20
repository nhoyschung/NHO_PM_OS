// ── Rate Limiting ────────────────────────────────────────────────
// In-memory sliding window rate limiter for single-instance deployment.
// For multi-instance: replace with Redis-backed store.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leak from expired entries
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow Node.js process to exit without waiting for this timer
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one request against a rate limit bucket.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., `login:${ip}`)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Whether the request is allowed, remaining quota, and reset time
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or window expired: start fresh
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  // Within window: check limit
  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }

  // Over limit
  return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

/**
 * Reset a specific rate limit bucket. Useful for testing.
 */
export function rateLimitReset(key: string): void {
  store.delete(key);
}

/**
 * Clear all rate limit state. Useful for testing teardown.
 */
export function rateLimitClearAll(): void {
  store.clear();
}
