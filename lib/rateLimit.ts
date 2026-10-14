// Upstash sliding window when configured; otherwise in-memory for local development only.
// Prefer an authenticated subject key. IP is taken only from platform-set headers when available —
// never trust a raw client-supplied X-Forwarded-For alone in production.

import "server-only";

import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { rateLimitCopy } from "@/content/safety";
import { logger } from "@/lib/logger";

export const RATE_LIMIT_ERROR = rateLimitCopy.wish;

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const limiters = new Map<string, Ratelimit>();
let warnedFallback = false;

function hashSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

/**
 * Platform-trusted client address when present.
 * Falls back to "unknown" rather than trusting spoofable X-Forwarded-For in production.
 */
export function trustedClientAddress(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  if (process.env.NODE_ENV !== "production") {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return "unknown";
}

export function clientIpHash(request: Request): string {
  return hashSubject(trustedClientAddress(request));
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

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

function upstash(prefix: string, limit: number, windowMs: number): Ratelimit | null {
  if (!upstashConfigured()) return null;
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
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

export async function rateLimitByKey(
  subjectKey: string,
  prefix: string,
  limit: number,
  windowMs: number,
): Promise<LimitResult> {
  const subject = hashSubject(subjectKey);
  const limiter = upstash(prefix, limit, windowMs);
  let result: LimitResult;
  if (!limiter) {
    if (process.env.NODE_ENV === "production" && !warnedFallback) {
      warnedFallback = true;
      logger.warn("upstash not configured in production; transmit rate limits are per-instance only");
    } else if (!warnedFallback) {
      warnedFallback = true;
      logger.warn("upstash not configured; using in-memory rate limit (local/dev)");
    }
    result = memoryLimit(`${prefix}:${subject}`, limit, windowMs);
  } else {
    try {
      const outcome = await limiter.limit(subject);
      result = outcome.success
        ? { ok: true }
        : { ok: false, retryAfter: Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000)) };
    } catch {
      logger.warn("upstash limit failed; using in-memory for this request", { subject });
      result = memoryLimit(`${prefix}:${subject}`, limit, windowMs);
    }
  }
  if (!result.ok) logger.info("rate limited", { prefix, subject });
  return result;
}

export async function rateLimit(
  request: Request,
  prefix: string,
  limit: number,
  windowMs: number,
): Promise<LimitResult> {
  return rateLimitByKey(`ip:${clientIpHash(request)}`, prefix, limit, windowMs);
}

export function resetRateLimitMemory(): void {
  buckets.clear();
}
