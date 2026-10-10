// Assumptions: Upstash sliding window when UPSTASH_REDIS_REST_URL and _TOKEN are both set; otherwise an
// in-memory per-instance window (resets on cold start, not shared across regions) with one warning, so local dev
// works. The key and every log line use a truncated sha256 of the first x-forwarded-for IP, never the raw IP.
// Used by /api/checkout and /api/wish. Never call it from /api/webhook or /api/health.

import "server-only";

import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logger";

export const RATE_LIMIT_ERROR = "slow down bestie. the algorithm needs a sec.";

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const limiters = new Map<string, Ratelimit>();
let warnedFallback = false;

export function clientIpHash(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function memoryLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  bucket.count += 1;
  return { ok: true };
}

function upstash(prefix: string, limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const cacheKey = `${prefix}:${limit}:${windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
    prefix: `rl:${prefix}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

export async function rateLimit(request: Request, prefix: string, limit: number, windowMs: number): Promise<LimitResult> {
  const ipHash = clientIpHash(request);
  const limiter = upstash(prefix, limit, windowMs);
  let result: LimitResult;
  if (!limiter) {
    if (!warnedFallback) {
      warnedFallback = true;
      logger.warn("upstash not configured; using in-memory rate limit");
    }
    result = memoryLimit(`${prefix}:${ipHash}`, limit, windowMs);
  } else {
    try {
      const outcome = await limiter.limit(ipHash);
      result = outcome.success ? { ok: true } : { ok: false, retryAfter: Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000)) };
    } catch {
      logger.warn("upstash limit failed; using in-memory for this request", { ipHash });
      result = memoryLimit(`${prefix}:${ipHash}`, limit, windowMs);
    }
  }
  if (!result.ok) logger.info("rate limited", { prefix, ipHash });
  return result;
}
