// Assumptions: Lemon Squeezy signs the raw request body with HMAC-SHA256 and sends lowercase hex in x-signature.
// A "sha256=" prefix is tolerated. Comparison is constant-time on equal-length buffers.

import { createHmac, timingSafeEqual } from "node:crypto";

export function signBody(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const normalized = signature.trim().toLowerCase().replace(/^sha256=/, "");
  if (!/^[0-9a-f]{64}$/.test(normalized)) return false;
  const expected = Buffer.from(signBody(rawBody, secret), "hex");
  const received = Buffer.from(normalized, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
