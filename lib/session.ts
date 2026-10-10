// Assumptions: minimum signed-cookie session for Premium. Magic-link tokens are hashed at rest. No second
// database: profiles live in the same Supabase project (or in-memory outside production). SESSION_SECRET must
// be set for cookies to be issued. Email is never logged.

import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { sessionSecret } from "@/lib/env";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export const SESSION_COOKIE = "sp_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_MS = 20 * 60 * 1000;

export type Session = { profileId: string; email: string };

type Profile = { id: string; email: string };
type TokenRow = { hash: string; profileId: string; expires: number };

type Memory = {
  profiles: Map<string, Profile>;
  byEmail: Map<string, string>;
  tokens: Map<string, TokenRow>;
};

function memory(): Memory {
  const holder = globalThis as typeof globalThis & { __premiumAuth?: Memory };
  if (!holder.__premiumAuth) {
    holder.__premiumAuth = { profiles: new Map(), byEmail: new Map(), tokens: new Map() };
  }
  return holder.__premiumAuth;
}

export function authConfigured(): boolean {
  return sessionSecret() !== null && (isSupabaseConfigured() || process.env.NODE_ENV !== "production");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return null;
  return email;
}

async function upsertProfile(email: string): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    const existingId = memory().byEmail.get(email);
    if (existingId) {
      const row = memory().profiles.get(existingId);
      if (row) return row;
    }
    const profile = { id: randomBytes(16).toString("hex"), email };
    memory().profiles.set(profile.id, profile);
    memory().byEmail.set(email, profile.id);
    return profile;
  }
  const client = getServiceClient();
  const found = await client.from("profiles").select("id, email").eq("email", email).maybeSingle();
  if (found.data && typeof found.data.id === "string") return { id: found.data.id, email };
  const inserted = await client.from("profiles").insert({ email }).select("id, email").single();
  if (inserted.error || typeof inserted.data?.id !== "string") throw new Error("profile_insert");
  return { id: inserted.data.id, email };
}

async function profileById(id: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return memory().profiles.get(id) ?? null;
  const { data } = await getServiceClient().from("profiles").select("id, email").eq("id", id).maybeSingle();
  if (!data || typeof data.id !== "string" || typeof data.email !== "string") return null;
  return { id: data.id, email: data.email };
}

export async function createLoginToken(rawEmail: string): Promise<{ email: string; token: string } | { error: "email" | "unconfigured" }> {
  if (!authConfigured()) return { error: "unconfigured" };
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "email" };
  const profile = await upsertProfile(email);
  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const expires = Date.now() + TOKEN_MS;
  if (!isSupabaseConfigured()) {
    memory().tokens.set(hash, { hash, profileId: profile.id, expires });
  } else {
    const { error } = await getServiceClient()
      .from("login_tokens")
      .insert({ token_hash: hash, profile_id: profile.id, expires_at: new Date(expires).toISOString() });
    if (error) throw new Error("token_insert");
  }
  return { email, token };
}

export async function consumeLoginToken(token: string): Promise<Session | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const hash = hashToken(token);
  let profileId: string | null = null;
  if (!isSupabaseConfigured()) {
    const row = memory().tokens.get(hash);
    if (!row || row.expires < Date.now()) return null;
    memory().tokens.delete(hash);
    profileId = row.profileId;
  } else {
    const client = getServiceClient();
    const found = await client.from("login_tokens").select("profile_id, expires_at, used_at").eq("token_hash", hash).maybeSingle();
    if (!found.data || found.data.used_at) return null;
    if (typeof found.data.profile_id !== "string") return null;
    if (new Date(String(found.data.expires_at)).getTime() < Date.now()) return null;
    await client.from("login_tokens").update({ used_at: new Date().toISOString() }).eq("token_hash", hash);
    profileId = found.data.profile_id;
  }
  const profile = profileId ? await profileById(profileId) : null;
  return profile ? { profileId: profile.id, email: profile.email } : null;
}

export async function readSession(): Promise<Session | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [profileId, expRaw, sig] = parts;
  if (!profileId || !expRaw || !sig) return null;
  const expected = sign(`${profileId}.${expRaw}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expRaw) < Date.now()) return null;
  const profile = await profileById(profileId);
  return profile ? { profileId: profile.id, email: profile.email } : null;
}

export function sessionCookieValue(profileId: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_MS;
  const payload = `${profileId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export async function writeSessionCookie(profileId: string): Promise<boolean> {
  const value = sessionCookieValue(profileId);
  if (!value) return false;
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  return true;
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
