// Anonymous Mars owner session. HttpOnly signed cookie — not the public SOUL label.
// Ownership is settlers.id (uuid). settler_id is only a pick seed / display handle.

import "server-only";

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { sessionSecret } from "@/lib/env";
import { makeSettlerId } from "@/lib/marsSession";
import { ensureSettlerByOwner, findSettlerByOwner, type SettlerOwner } from "@/lib/transmissionsStore";

export const MARS_OWNER_COOKIE = "mars_owner";
const SESSION_MS = 365 * 24 * 60 * 60 * 1000;

export type MarsSession = SettlerOwner;

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MS / 1000,
};

function secretOrDev(): string | null {
  const configured = sessionSecret();
  if (configured) return configured;
  // Deployed hosts must set SESSION_SECRET. Local next/dev may use a fixed fallback.
  if (process.env.VERCEL === "1") return null;
  return "dev-mars-owner-session";
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function marsOwnerCookieValue(ownerId: string): string | null {
  const secret = secretOrDev();
  if (!secret) return null;
  const exp = Date.now() + SESSION_MS;
  const payload = `${ownerId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function parseMarsOwnerCookie(raw: string | undefined | null): string | null {
  const secret = secretOrDev();
  if (!secret || !raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [ownerId, expRaw, sig] = parts;
  if (!ownerId || !expRaw || !sig) return null;
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) return null;
  const expected = sign(`${ownerId}.${expRaw}`, secret);
  if (!safeEqual(sig, expected)) return null;
  if (Number(expRaw) < Date.now()) return null;
  return ownerId;
}

export async function readMarsSession(): Promise<MarsSession | null> {
  const jar = await cookies();
  const ownerId = parseMarsOwnerCookie(jar.get(MARS_OWNER_COOKIE)?.value);
  if (!ownerId) return null;
  return findSettlerByOwner(ownerId);
}

export async function writeMarsOwnerCookie(ownerId: string): Promise<boolean> {
  const value = marsOwnerCookieValue(ownerId);
  if (!value) return false;
  try {
    (await cookies()).set(MARS_OWNER_COOKIE, value, COOKIE_OPTS);
    return true;
  } catch {
    // Route Handlers should prefer attachMarsOwnerCookie on the response.
    return false;
  }
}

/** Attach the owner cookie to a Route Handler response (reliable in App Router). */
export function attachMarsOwnerCookie<T extends NextResponse>(response: T, ownerId: string): T {
  const value = marsOwnerCookieValue(ownerId);
  if (!value) return response;
  response.cookies.set(MARS_OWNER_COOKIE, value, COOKIE_OPTS);
  return response;
}

/** Mint or resume the anonymous owner. Never trusts a client-supplied settler_id for ownership. */
export async function ensureMarsSession(): Promise<MarsSession | null> {
  const existing = await readMarsSession();
  if (existing) return existing;

  const secret = secretOrDev();
  if (!secret) return null;

  const jar = await cookies();
  const orphanOwner = parseMarsOwnerCookie(jar.get(MARS_OWNER_COOKIE)?.value);
  // Cookie survived a memory wipe — rebuild the seat under the same owner id.
  if (orphanOwner) {
    return ensureSettlerByOwner({
      ownerId: orphanOwner,
      settlerId: makeSettlerId(),
      tier: "wanderer",
    });
  }

  const ownerId = randomUUID();
  const settlerId = makeSettlerId();
  return ensureSettlerByOwner({
    ownerId,
    settlerId,
    tier: "wanderer",
  });
}

/** Cryptographically random opaque token helper for tests. */
export function randomOwnerId(): string {
  return randomUUID();
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}
