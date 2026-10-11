// Assumptions: the congregation lives in Supabase when configured, and in memory outside production when it is not.
// The browser never receives a key. Guest souls are an httpOnly cookie. Email is never logged.
// Stripe writes the tier. DEV_TIER can only raise the tier shown outside production.

import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { isRecord } from "@/lib/guards";
import { isCrisisText, poojaExchange } from "@/lib/poojaLine";
import { generateSoulId } from "@/lib/soul-id";
import { sessionSecret } from "@/lib/env";
import { readSession } from "@/lib/session";
import { lemonSeatEffect } from "@/lib/lemonSeat";
import { applyPooja } from "@/lib/streak";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { atLeast, devTier, isTier, withinWeeklyCap, type Tier } from "@/lib/tiers";
import { mondayOf, monthStart, safeZone, zonedToUtc } from "@/lib/time";
import { logger } from "@/lib/logger";
import type { Mood } from "@/lib/moods";

export class RegisterDown extends Error {
  constructor() {
    super("register");
    this.name = "RegisterDown";
  }
}

export type Soul = {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  tier: Tier;
  joinedAt: string;
  streakCurrent: number;
  streakLongest: number;
  lastPoojaAt: string | null;
  timezone: string;
  timezoneSet: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  lemonSubscriptionId: string | null;
  pastDue: boolean;
  trialUsed: boolean;
  darshanWaitlist: boolean;
  darshanWaitlistAt: string | null;
  lastReminderOn: string | null;
  urgentArmed: boolean;
  profileId: string | null;
};

export type PoojaRow = {
  id: string;
  userId: string;
  mood: string | null;
  reflection: string;
  algoResponse: string;
  panditNod: string;
  createdAt: string;
};

export type WishRow = {
  id: string;
  userId: string;
  petitionId: string;
  wish: string;
  category: string;
  algoStatus: string;
  algoSacrifices: string[];
  algoCounsel: string;
  algoProbability: string;
  panditReply: string;
  priority: boolean;
  urgent: boolean;
  createdAt: string;
};

export type SermonRow = {
  id: string;
  userId: string;
  weekOf: string;
  title: string;
  body: string;
  practice: string;
  panditSignoff: string;
  algoLine: string;
  panditReply: string;
  deliveredAt: string | null;
};

export type DarshanRow = {
  id: string;
  userId: string;
  scheduledAt: string;
  transcript: string | null;
  blessingCardUrl: string | null;
  practice: string | null;
  completedAt: string | null;
};

export type ReportRow = { id: string; userId: string; monthOf: string; body: string; createdAt: string };

export type LedgerEntry = {
  userId: string;
  tier: Tier;
  streakLongest: number;
  joinedAt: string;
  name: string | null;
};

type Memory = {
  souls: Map<string, Soul>;
  byEmail: Map<string, string>;
  poojas: PoojaRow[];
  wishes: WishRow[];
  sermons: SermonRow[];
  darshans: DarshanRow[];
  reports: ReportRow[];
};

const SOUL_COOKIE = "sp_soul";
const SOUL_MS = 30 * 24 * 60 * 60 * 1000;
const WITHHELD = "a hard day, withheld.";

function memory(): Memory {
  const holder = globalThis as typeof globalThis & { __congregation?: Memory };
  if (!holder.__congregation) {
    holder.__congregation = { souls: new Map(), byEmail: new Map(), poojas: [], wishes: [], sermons: [], darshans: [], reports: [] };
  }
  return holder.__congregation;
}

function persistence(): "memory" | "supabase" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.NODE_ENV === "production") throw new RegisterDown();
  return "memory";
}

export function canPersistSoul(): boolean {
  return sessionSecret() !== null && (isSupabaseConfigured() || process.env.NODE_ENV !== "production");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function present(soul: Soul): Soul {
  const override = devTier();
  return override ? { ...soul, tier: override } : soul;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asSoul(row: Record<string, unknown>): Soul | null {
  if (typeof row.id !== "string" || typeof row.user_id !== "string" || !isTier(row.tier)) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: text(row.email),
    name: text(row.name),
    tier: row.tier,
    joinedAt: text(row.joined_at) ?? new Date().toISOString(),
    streakCurrent: Number(row.streak_current ?? 0) || 0,
    streakLongest: Number(row.streak_longest ?? 0) || 0,
    lastPoojaAt: text(row.last_pooja_at),
    timezone: safeZone(text(row.timezone)),
    timezoneSet: row.timezone_set === true,
    stripeCustomerId: text(row.stripe_customer_id),
    stripeSubscriptionId: text(row.stripe_subscription_id),
    lemonSubscriptionId: text(row.lemon_subscription_id),
    pastDue: row.past_due === true,
    trialUsed: row.trial_used === true,
    darshanWaitlist: row.darshan_waitlist === true,
    darshanWaitlistAt: text(row.darshan_waitlist_at),
    lastReminderOn: text(row.last_reminder_on)?.slice(0, 10) ?? null,
    urgentArmed: row.urgent_armed === true,
    profileId: text(row.profile_id),
  };
}

function soulRow(soul: Soul): Record<string, unknown> {
  return {
    id: soul.id,
    user_id: soul.userId,
    email: soul.email,
    name: soul.name,
    tier: soul.tier,
    joined_at: soul.joinedAt,
    streak_current: soul.streakCurrent,
    streak_longest: soul.streakLongest,
    last_pooja_at: soul.lastPoojaAt,
    timezone: soul.timezone,
    timezone_set: soul.timezoneSet,
    lemon_subscription_id: soul.lemonSubscriptionId,
    stripe_customer_id: soul.stripeCustomerId,
    stripe_subscription_id: soul.stripeSubscriptionId,
    past_due: soul.pastDue,
    trial_used: soul.trialUsed,
    darshan_waitlist: soul.darshanWaitlist,
    darshan_waitlist_at: soul.darshanWaitlistAt,
    last_reminder_on: soul.lastReminderOn,
    urgent_armed: soul.urgentArmed,
    profile_id: soul.profileId,
  };
}

function patchRow(patch: Partial<Soul>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (patch.email !== undefined) map.email = patch.email;
  if (patch.name !== undefined) map.name = patch.name;
  if (patch.tier !== undefined) map.tier = patch.tier;
  if (patch.streakCurrent !== undefined) map.streak_current = patch.streakCurrent;
  if (patch.streakLongest !== undefined) map.streak_longest = patch.streakLongest;
  if (patch.lastPoojaAt !== undefined) map.last_pooja_at = patch.lastPoojaAt;
  if (patch.timezone !== undefined) map.timezone = patch.timezone;
  if (patch.timezoneSet !== undefined) map.timezone_set = patch.timezoneSet;
  if (patch.stripeCustomerId !== undefined) map.stripe_customer_id = patch.stripeCustomerId;
  if (patch.stripeSubscriptionId !== undefined) map.stripe_subscription_id = patch.stripeSubscriptionId;
  if (patch.lemonSubscriptionId !== undefined) map.lemon_subscription_id = patch.lemonSubscriptionId;
  if (patch.pastDue !== undefined) map.past_due = patch.pastDue;
  if (patch.trialUsed !== undefined) map.trial_used = patch.trialUsed;
  if (patch.darshanWaitlist !== undefined) map.darshan_waitlist = patch.darshanWaitlist;
  if (patch.darshanWaitlistAt !== undefined) map.darshan_waitlist_at = patch.darshanWaitlistAt;
  if (patch.lastReminderOn !== undefined) map.last_reminder_on = patch.lastReminderOn;
  if (patch.urgentArmed !== undefined) map.urgent_armed = patch.urgentArmed;
  if (patch.profileId !== undefined) map.profile_id = patch.profileId;
  return map;
}

function asPooja(row: Record<string, unknown>): PoojaRow | null {
  if (typeof row.id !== "string" || typeof row.user_id !== "string") return null;
  return {
    id: row.id,
    userId: row.user_id,
    mood: text(row.mood),
    reflection: text(row.reflection) ?? "",
    algoResponse: text(row.algo_response) ?? "",
    panditNod: text(row.pandit_nod) ?? "",
    createdAt: text(row.created_at) ?? new Date().toISOString(),
  };
}

function asWish(row: Record<string, unknown>): WishRow | null {
  if (typeof row.id !== "string" || typeof row.user_id !== "string" || typeof row.petition_id !== "string") return null;
  const sacrifices = Array.isArray(row.algo_sacrifices) ? row.algo_sacrifices.filter((item): item is string => typeof item === "string") : [];
  return {
    id: row.id,
    userId: row.user_id,
    petitionId: row.petition_id,
    wish: text(row.wish) ?? "",
    category: text(row.category) ?? "",
    algoStatus: text(row.algo_status) ?? "",
    algoSacrifices: sacrifices,
    algoCounsel: text(row.algo_counsel) ?? "",
    algoProbability: text(row.algo_probability) ?? "",
    panditReply: text(row.pandit_reply) ?? "",
    priority: row.priority === true,
    urgent: row.urgent === true,
    createdAt: text(row.created_at) ?? new Date().toISOString(),
  };
}

function asSermon(row: Record<string, unknown>): SermonRow | null {
  if (typeof row.id !== "string" || typeof row.user_id !== "string") return null;
  const week = text(row.week_of)?.slice(0, 10);
  if (!week) return null;
  return {
    id: row.id,
    userId: row.user_id,
    weekOf: week,
    title: text(row.title) ?? "",
    body: text(row.body) ?? "",
    practice: text(row.practice) ?? "",
    panditSignoff: text(row.pandit_signoff) ?? "pandit ji",
    algoLine: text(row.algo_line) ?? "",
    panditReply: text(row.pandit_reply) ?? "",
    deliveredAt: text(row.delivered_at),
  };
}

function asDarshan(row: Record<string, unknown>): DarshanRow | null {
  if (typeof row.id !== "string" || typeof row.user_id !== "string" || typeof row.scheduled_at !== "string") return null;
  return {
    id: row.id,
    userId: row.user_id,
    scheduledAt: row.scheduled_at,
    transcript: text(row.transcript),
    blessingCardUrl: text(row.blessing_card_url),
    practice: text(row.practice),
    completedAt: text(row.completed_at),
  };
}

async function readSoulCookie(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const raw = (await cookies()).get(SOUL_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig) return null;
  const expected = sign(`${userId}.${exp}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

async function writeSoulCookie(userId: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) return;
  const exp = Date.now() + SOUL_MS;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(SOUL_COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SOUL_MS / 1000,
  });
}

async function selectSoul(column: "user_id" | "email" | "stripe_customer_id" | "lemon_subscription_id", value: string): Promise<Soul | null> {
  if (persistence() === "memory") {
    if (column === "user_id") return memory().souls.get(value) ?? null;
    if (column === "email") {
      const id = memory().byEmail.get(value);
      return id ? memory().souls.get(id) ?? null : null;
    }
    for (const soul of memory().souls.values()) {
      if (column === "stripe_customer_id" && soul.stripeCustomerId === value) return soul;
      if (column === "lemon_subscription_id" && soul.lemonSubscriptionId === value) return soul;
    }
    return null;
  }
  const { data, error } = await getServiceClient().from("users").select("*").eq(column, value).maybeSingle();
  if (error) throw new RegisterDown();
  return isRecord(data) ? asSoul(data) : null;
}

export async function getSoulByUserId(userId: string): Promise<Soul | null> {
  return selectSoul("user_id", userId);
}

async function rememberEmail(soul: Soul): Promise<void> {
  if (persistence() === "memory" && soul.email) memory().byEmail.set(soul.email, soul.userId);
}

async function createSoul(input: { email: string | null; profileId: string | null }): Promise<Soul> {
  const kind = persistence();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const soul: Soul = {
      id: randomUUID(),
      userId: generateSoulId(),
      email: input.email,
      name: null,
      tier: "pilgrim",
      joinedAt: new Date().toISOString(),
      streakCurrent: 0,
      streakLongest: 0,
      lastPoojaAt: null,
      timezone: "UTC",
      timezoneSet: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      lemonSubscriptionId: null,
      pastDue: false,
      trialUsed: false,
      darshanWaitlist: false,
      darshanWaitlistAt: null,
      lastReminderOn: null,
      urgentArmed: false,
      profileId: input.profileId,
    };
    if (kind === "memory") {
      memory().souls.set(soul.userId, soul);
      await rememberEmail(soul);
      return soul;
    }
    const { error } = await getServiceClient().from("users").insert(soulRow(soul));
    if (!error) return soul;
    if (error.code === "23505" && input.email) {
      const existing = await selectSoul("email", input.email);
      if (existing) return existing;
      continue;
    }
    if (error.code === "23505") continue;
    throw new RegisterDown();
  }
  throw new RegisterDown();
}

export async function updateSoul(userId: string, patch: Partial<Soul>): Promise<Soul | null> {
  const current = await selectSoul("user_id", userId);
  if (!current) return null;
  const next = { ...current, ...patch };
  if (persistence() === "memory") {
    if (current.email && current.email !== next.email) memory().byEmail.delete(current.email);
    memory().souls.set(userId, next);
    await rememberEmail(next);
    return next;
  }
  const { error } = await getServiceClient().from("users").update(patchRow(patch)).eq("user_id", userId);
  if (error) throw new RegisterDown();
  return next;
}

async function bindEmail(email: string, profileId: string): Promise<Soul> {
  const existing = await selectSoul("email", email);
  if (existing) {
    if (existing.profileId === profileId) return existing;
    return (await updateSoul(existing.userId, { profileId })) ?? existing;
  }
  const guestId = await readSoulCookie();
  if (guestId) {
    const guest = await selectSoul("user_id", guestId);
    if (guest && !guest.email) return (await updateSoul(guest.userId, { email, profileId })) ?? guest;
  }
  return createSoul({ email, profileId });
}

export async function currentSoul(): Promise<Soul | null> {
  try {
    const session = await readSession();
    if (session) return present(await bindEmail(session.email, session.profileId));
    const guestId = await readSoulCookie();
    if (!guestId) return null;
    const guest = await selectSoul("user_id", guestId);
    return guest ? present(guest) : null;
  } catch (error) {
    if (!(error instanceof RegisterDown)) logger.error("soul load failed");
    return null;
  }
}

export async function ensureGuest(): Promise<Soul | null> {
  if (!canPersistSoul()) return null;
  const existing = await currentSoul();
  if (existing) return existing;
  const soul = await createSoul({ email: null, profileId: null });
  await writeSoulCookie(soul.userId);
  return present(soul);
}

export async function listPoojas(userId: string, sinceIso?: string, untilIso?: string): Promise<PoojaRow[]> {
  if (persistence() === "memory") {
    return memory()
      .poojas.filter((row) => row.userId === userId && (!sinceIso || row.createdAt >= sinceIso) && (!untilIso || row.createdAt < untilIso))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let query = getServiceClient().from("poojas").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  if (untilIso) query = query.lt("created_at", untilIso);
  const { data, error } = await query;
  if (error) throw new RegisterDown();
  return (data ?? []).flatMap((row) => {
    const parsed = isRecord(row) ? asPooja(row) : null;
    return parsed ? [parsed] : [];
  });
}

export async function listWishes(userId: string, sinceIso?: string): Promise<WishRow[]> {
  if (persistence() === "memory") {
    return memory()
      .wishes.filter((row) => row.userId === userId && (!sinceIso || row.createdAt >= sinceIso))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let query = getServiceClient().from("wishes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  const { data, error } = await query;
  if (error) throw new RegisterDown();
  return (data ?? []).flatMap((row) => {
    const parsed = isRecord(row) ? asWish(row) : null;
    return parsed ? [parsed] : [];
  });
}

export async function wishGate(soul: Soul, now = new Date()): Promise<{ ok: boolean; priority: boolean; urgent: boolean }> {
  const zone = safeZone(soul.timezone);
  const weekStart = zonedToUtc(mondayOf(now, zone), 0, 0, zone);
  const month = zonedToUtc(monthStart(now, zone), 0, 0, zone);
  const since = new Date(Math.min(weekStart.getTime(), month.getTime())).toISOString();
  const rows = await listWishes(soul.userId, since);
  const thisWeek = rows.filter((row) => new Date(row.createdAt).getTime() >= weekStart.getTime()).length;
  const urgentUsed = rows.filter((row) => row.urgent && new Date(row.createdAt).getTime() >= month.getTime()).length;
  return withinWeeklyCap({ tier: soul.tier, wishesThisWeek: thisWeek, urgentArmed: soul.urgentArmed, urgentUsedThisMonth: urgentUsed });
}

export async function linkWish(input: Omit<WishRow, "id" | "createdAt">): Promise<void> {
  const row: WishRow = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  try {
    if (persistence() === "memory") memory().wishes.push(row);
    else {
      const { error } = await getServiceClient().from("wishes").insert({
        id: row.id,
        user_id: row.userId,
        petition_id: row.petitionId,
        wish: row.wish,
        category: row.category,
        algo_status: row.algoStatus,
        algo_sacrifices: row.algoSacrifices,
        algo_counsel: row.algoCounsel,
        algo_probability: row.algoProbability,
        pandit_reply: row.panditReply,
        priority: row.priority,
        urgent: row.urgent,
      });
      if (error && error.code !== "23505") throw new RegisterDown();
    }
    if (input.urgent) await updateSoul(input.userId, { urgentArmed: false });
  } catch (error) {
    if (error instanceof RegisterDown) logger.error("wish link failed", { soul_id: input.userId });
    else logger.error("wish link failed", { soul_id: input.userId });
  }
}

export async function wishFlags(petitionId: string): Promise<{ priority: boolean; urgent: boolean; userId: string } | null> {
  try {
    if (persistence() === "memory") {
      const row = memory().wishes.find((wish) => wish.petitionId === petitionId);
      return row ? { priority: row.priority, urgent: row.urgent, userId: row.userId } : null;
    }
    const { data, error } = await getServiceClient().from("wishes").select("user_id, priority, urgent").eq("petition_id", petitionId).maybeSingle();
    if (error || !isRecord(data) || typeof data.user_id !== "string") return null;
    return { priority: data.priority === true, urgent: data.urgent === true, userId: data.user_id };
  } catch {
    return null;
  }
}

export async function recordPooja(input: { soul: Soul; mood: Mood | null; reflection: string; now?: Date }): Promise<
  | { ok: true; soul: Soul; pooja: PoojaRow; mourned: boolean; brokenFrom: number; extra: boolean; crisis: boolean }
  | { ok: false; code: "already" | "upstream" }
> {
  try {
    const now = input.now ?? new Date();
    const stored = (await selectSoul("user_id", input.soul.userId)) ?? input.soul;
    const crisis = isCrisisText(input.reflection);
    const applied = applyPooja({ current: stored.streakCurrent, longest: stored.streakLongest, lastPoojaAt: stored.lastPoojaAt }, now, stored.timezone);
    if (applied.alreadyToday && !atLeast(input.soul.tier, "believer")) return { ok: false, code: "already" };
    const extra = applied.alreadyToday;
    const prior = atLeast(input.soul.tier, "believer") ? await listWishes(stored.userId) : [];
    const lines = poojaExchange({
      mood: input.mood,
      seed: `${stored.userId}:${now.toISOString()}`,
      mourned: applied.mourned,
      extra,
      remember: prior.length > 0,
      crisis,
    });
    const nextSoul = extra
      ? stored
      : ((await updateSoul(stored.userId, {
          streakCurrent: applied.current,
          streakLongest: applied.longest,
          lastPoojaAt: now.toISOString(),
        })) ?? stored);
    const pooja: PoojaRow = {
      id: randomUUID(),
      userId: stored.userId,
      mood: input.mood,
      reflection: crisis ? WITHHELD : input.reflection,
      algoResponse: lines.algo,
      panditNod: lines.pandit,
      createdAt: now.toISOString(),
    };
    if (persistence() === "memory") memory().poojas.push(pooja);
    else {
      const { error } = await getServiceClient().from("poojas").insert({
        id: pooja.id,
        user_id: pooja.userId,
        mood: pooja.mood,
        reflection: pooja.reflection,
        algo_response: pooja.algoResponse,
        pandit_nod: pooja.panditNod,
        created_at: pooja.createdAt,
      });
      if (error) throw new RegisterDown();
    }
    return { ok: true, soul: present(nextSoul), pooja, mourned: applied.mourned, brokenFrom: applied.brokenFrom, extra, crisis };
  } catch (error) {
    if (!(error instanceof RegisterDown)) logger.error("pooja failed");
    return { ok: false, code: "upstream" };
  }
}

export async function listSermons(userId: string): Promise<SermonRow[]> {
  if (persistence() === "memory") return memory().sermons.filter((row) => row.userId === userId).sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  const { data, error } = await getServiceClient().from("sermons").select("*").eq("user_id", userId).order("week_of", { ascending: false }).limit(104);
  if (error) throw new RegisterDown();
  return (data ?? []).flatMap((row) => {
    const parsed = isRecord(row) ? asSermon(row) : null;
    return parsed ? [parsed] : [];
  });
}

export async function getSermon(userId: string, weekOf: string): Promise<SermonRow | null> {
  if (persistence() === "memory") return memory().sermons.find((row) => row.userId === userId && row.weekOf === weekOf) ?? null;
  const { data, error } = await getServiceClient().from("sermons").select("*").eq("user_id", userId).eq("week_of", weekOf).maybeSingle();
  if (error) throw new RegisterDown();
  return isRecord(data) ? asSermon(data) : null;
}

export async function saveSermon(input: Omit<SermonRow, "id" | "deliveredAt"> & { deliveredAt?: string | null }): Promise<SermonRow> {
  const existing = await getSermon(input.userId, input.weekOf);
  if (existing) return existing;
  const row: SermonRow = { ...input, id: randomUUID(), deliveredAt: input.deliveredAt ?? null };
  if (persistence() === "memory") {
    memory().sermons.push(row);
    return row;
  }
  const { error } = await getServiceClient().from("sermons").insert({
    id: row.id,
    user_id: row.userId,
    week_of: row.weekOf,
    title: row.title,
    body: row.body,
    practice: row.practice,
    pandit_signoff: row.panditSignoff,
    algo_line: row.algoLine,
    pandit_reply: row.panditReply,
    delivered_at: row.deliveredAt,
  });
  if (error?.code === "23505") return (await getSermon(input.userId, input.weekOf)) ?? row;
  if (error) throw new RegisterDown();
  return row;
}

export async function markSermonDelivered(userId: string, weekOf: string, at: string): Promise<void> {
  if (persistence() === "memory") {
    const row = memory().sermons.find((sermon) => sermon.userId === userId && sermon.weekOf === weekOf);
    if (row) row.deliveredAt = at;
    return;
  }
  const { error } = await getServiceClient().from("sermons").update({ delivered_at: at }).eq("user_id", userId).eq("week_of", weekOf);
  if (error) throw new RegisterDown();
}

export async function listDarshans(userId: string): Promise<DarshanRow[]> {
  if (persistence() === "memory") return memory().darshans.filter((row) => row.userId === userId).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const { data, error } = await getServiceClient().from("darshans").select("*").eq("user_id", userId).order("scheduled_at", { ascending: false }).limit(24);
  if (error) throw new RegisterDown();
  return (data ?? []).flatMap((row) => {
    const parsed = isRecord(row) ? asDarshan(row) : null;
    return parsed ? [parsed] : [];
  });
}

export async function getDarshan(id: string): Promise<DarshanRow | null> {
  if (persistence() === "memory") return memory().darshans.find((row) => row.id === id) ?? null;
  const { data, error } = await getServiceClient().from("darshans").select("*").eq("id", id).maybeSingle();
  if (error) throw new RegisterDown();
  return isRecord(data) ? asDarshan(data) : null;
}

export async function countDarshansBetween(sinceIso: string, untilIso: string): Promise<number> {
  if (persistence() === "memory") return memory().darshans.filter((row) => row.scheduledAt >= sinceIso && row.scheduledAt < untilIso).length;
  const { count, error } = await getServiceClient().from("darshans").select("id", { count: "exact", head: true }).gte("scheduled_at", sinceIso).lt("scheduled_at", untilIso);
  if (error) throw new RegisterDown();
  return count ?? 0;
}

export async function insertDarshan(userId: string, scheduledAt: string): Promise<DarshanRow> {
  const row: DarshanRow = { id: randomUUID(), userId, scheduledAt, transcript: null, blessingCardUrl: null, practice: null, completedAt: null };
  if (persistence() === "memory") {
    memory().darshans.push(row);
    return row;
  }
  const { error } = await getServiceClient().from("darshans").insert({ id: row.id, user_id: userId, scheduled_at: scheduledAt });
  if (error) throw new RegisterDown();
  return row;
}

export async function completeDarshan(id: string, input: { transcript: string; practice: string; blessingCardUrl: string; completedAt: string }): Promise<DarshanRow | null> {
  const current = await getDarshan(id);
  if (!current) return null;
  const next = { ...current, ...input };
  if (persistence() === "memory") {
    const index = memory().darshans.findIndex((row) => row.id === id);
    if (index >= 0) memory().darshans[index] = next;
    return next;
  }
  const { error } = await getServiceClient()
    .from("darshans")
    .update({ transcript: input.transcript, practice: input.practice, blessing_card_url: input.blessingCardUrl, completed_at: input.completedAt })
    .eq("id", id);
  if (error) throw new RegisterDown();
  return next;
}

export async function getReport(userId: string, monthOf: string): Promise<ReportRow | null> {
  if (persistence() === "memory") return memory().reports.find((row) => row.userId === userId && row.monthOf === monthOf) ?? null;
  const { data, error } = await getServiceClient().from("soul_reports").select("*").eq("user_id", userId).eq("month_of", monthOf).maybeSingle();
  if (error) throw new RegisterDown();
  if (!isRecord(data) || typeof data.id !== "string") return null;
  return { id: data.id, userId, monthOf, body: text(data.body) ?? "", createdAt: text(data.created_at) ?? new Date().toISOString() };
}

export async function saveReport(userId: string, monthOf: string, body: string): Promise<ReportRow> {
  const existing = await getReport(userId, monthOf);
  if (existing) return existing;
  const row: ReportRow = { id: randomUUID(), userId, monthOf, body, createdAt: new Date().toISOString() };
  if (persistence() === "memory") {
    memory().reports.push(row);
    return row;
  }
  const { error } = await getServiceClient().from("soul_reports").insert({ id: row.id, user_id: userId, month_of: monthOf, body });
  if (error?.code === "23505") return (await getReport(userId, monthOf)) ?? row;
  if (error) throw new RegisterDown();
  return row;
}

export async function hallCount(): Promise<number> {
  try {
    const souls = persistence() === "memory" ? [...memory().souls.values()] : await allSouls();
    return souls.filter((soul) => soul.streakLongest > 0 || Boolean(soul.lastPoojaAt)).length;
  } catch {
    return 0;
  }
}

export async function listLedger(): Promise<LedgerEntry[]> {
  try {
    const souls = persistence() === "memory" ? [...memory().souls.values()] : await allSouls();
    return souls
      .filter((soul) => soul.streakLongest > 0 || soul.tier !== "pilgrim")
      .sort((a, b) => b.streakLongest - a.streakLongest || b.joinedAt.localeCompare(a.joinedAt))
      .slice(0, 80)
      .map((soul) => ({
        userId: soul.userId,
        tier: soul.tier,
        streakLongest: soul.streakLongest,
        joinedAt: soul.joinedAt,
        name: soul.tier === "darshan" ? soul.name : null,
      }));
  } catch {
    return [];
  }
}

export async function waitlistSnapshot(userId?: string): Promise<{ count: number; position: number | null }> {
  try {
    const souls = persistence() === "memory" ? [...memory().souls.values()] : await allSouls();
    const waiting = souls.filter((soul) => soul.darshanWaitlist).sort((a, b) => (a.darshanWaitlistAt ?? a.joinedAt).localeCompare(b.darshanWaitlistAt ?? b.joinedAt));
    const index = userId ? waiting.findIndex((soul) => soul.userId === userId) : -1;
    return { count: waiting.length, position: index >= 0 ? index + 1 : null };
  } catch {
    return { count: 0, position: null };
  }
}

async function allSouls(): Promise<Soul[]> {
  if (persistence() === "memory") return [...memory().souls.values()];
  const { data, error } = await getServiceClient().from("users").select("*").limit(5000);
  if (error) throw new RegisterDown();
  return (data ?? []).flatMap((row) => {
    const parsed = isRecord(row) ? asSoul(row) : null;
    return parsed ? [parsed] : [];
  });
}

export async function listSouls(): Promise<Soul[]> {
  try {
    return await allSouls();
  } catch {
    return [];
  }
}

export async function applyLemonSeat(input: {
  userId: string | null;
  subscriptionId: string;
  tier: "believer" | "devotee" | "darshan";
  status: string;
  endsAt: string | null;
}): Promise<"applied" | "unknown"> {
  const byUser = input.userId ? await selectSoul("user_id", input.userId) : null;
  const soul = byUser ?? (await selectSoul("lemon_subscription_id", input.subscriptionId));
  if (!soul) return "unknown";
  const effect = lemonSeatEffect(input.status, input.endsAt);
  if (effect === "ended") {
    await updateSoul(soul.userId, { tier: "pilgrim", pastDue: false, lemonSubscriptionId: input.subscriptionId });
    return "applied";
  }
  await updateSoul(soul.userId, {
    tier: input.tier,
    pastDue: effect === "past_due",
    lemonSubscriptionId: input.subscriptionId,
    trialUsed: input.status.trim().toLowerCase() === "on_trial" ? true : soul.trialUsed,
  });
  return "applied";
}

export async function applyStripeState(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  tier?: Tier | null;
  status: string;
}): Promise<void> {
  const soul = input.userId ? await selectSoul("user_id", input.userId) : input.customerId ? await selectSoul("stripe_customer_id", input.customerId) : null;
  if (!soul) return;
  if (input.status === "active" || input.status === "trialing") {
    await updateSoul(soul.userId, {
      tier: input.tier ?? soul.tier,
      stripeCustomerId: input.customerId ?? soul.stripeCustomerId,
      stripeSubscriptionId: input.subscriptionId ?? soul.stripeSubscriptionId,
      pastDue: false,
      trialUsed: input.status === "trialing" ? true : soul.trialUsed,
    });
    return;
  }
  if (input.status === "past_due") {
    await updateSoul(soul.userId, { pastDue: true, stripeCustomerId: input.customerId ?? soul.stripeCustomerId, stripeSubscriptionId: input.subscriptionId ?? soul.stripeSubscriptionId });
    return;
  }
  if (input.status === "canceled" || input.status === "unpaid" || input.status === "incomplete_expired") {
    await updateSoul(soul.userId, { tier: "pilgrim", stripeSubscriptionId: null, pastDue: false, stripeCustomerId: input.customerId ?? soul.stripeCustomerId });
  }
}
