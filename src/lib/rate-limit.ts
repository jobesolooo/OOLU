import "server-only";

/**
 * Small fixed-window rate limiter to slow down password guessing and email spam.
 * In-memory: limits apply per server instance. For multi-region production
 * traffic, swap this for a shared store (e.g. Upstash Redis) behind the same API.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return b.count > limit ? { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) } : { ok: true, retryAfter: 0 };
}

/** Forget a key's attempts (e.g. after a successful sign-in, so real logins don't count as guesses). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export async function clientIp() {
  const { headers } = await import("next/headers");
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
