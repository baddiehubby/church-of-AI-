// Assumptions: Premium store (migration 005). Entitlement is granted only from a verified subscription webhook.
// Journal rows are private: callers must pass the session profile id; missing session or a foreign id returns null
// (pages 404). Daily guidance is cached per profile per UTC date. Share cards never include the full wish unless
// the member opts in. Memory fallback outside production when Supabase is unset.

import "server-only";

import { randomBytes } from "node:crypto";

import { generateVerdict, type VerdictContext } from "@/lib/algorithm";
import { isRecord } from "@/lib/guards";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { verdictSchema, type Verdict } from "@/lib/verdictSchema";

export type PremiumStatus = "active" | "cancelled" | "expired" | "past_due";

export type Entitlement = {
  profileId: string;
  subscriptionId: string;
  status: PremiumStatus;
  currentPeriodEnd: string | null;
};

export type WishEntry = {
  id: string;
  profileId: string;
  threadId: string;
  wish: string;
  category: string | null;
  createdAt: string;
  readings: { id: string; verdict: Verdict; createdAt: string }[];
};

export type ShareCard = {
  publicId: string;
  summary: string;
  reflection: string;
  wish: string | null;
  createdAt: string;
};

type Memory = {
  entitlements: Map<string, Entitlement>;
  bySub: Map<string, string>;
  entries: Map<string, WishEntry>;
  prefs: Map<string, { goals: string | null; dailyDate: string | null; dailyText: string | null }>;
  cards: Map<string, ShareCard & { profileId: string; entryId: string }>;
};

function memory(): Memory {
  const holder = globalThis as typeof globalThis & { __premiumStore?: Memory };
  if (!holder.__premiumStore) {
    holder.__premiumStore = {
      entitlements: new Map(),
      bySub: new Map(),
      entries: new Map(),
      prefs: new Map(),
      cards: new Map(),
    };
  }
  return holder.__premiumStore;
}

function utcDate(at = new Date()): string {
  return at.toISOString().slice(0, 10);
}

export function mapLemonStatus(raw: string): PremiumStatus {
  const status = raw.trim().toLowerCase();
  if (status === "expired") return "expired";
  if (status === "cancelled") return "cancelled";
  if (status === "past_due" || status === "unpaid" || status === "paused") return "past_due";
  return "active";
}

export function entitlementIsLive(row: Entitlement, now = Date.now()): boolean {
  if (row.status === "expired" || row.status === "past_due") return false;
  if (row.status === "active") return true;
  if (row.status === "cancelled" && row.currentPeriodEnd) {
    return new Date(row.currentPeriodEnd).getTime() > now;
  }
  return false;
}

export async function getEntitlement(profileId: string): Promise<Entitlement | null> {
  if (!isSupabaseConfigured()) return memory().entitlements.get(profileId) ?? null;
  const { data } = await getServiceClient()
    .from("premium_entitlements")
    .select("profile_id, lemon_subscription_id, status, current_period_end")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data || typeof data.profile_id !== "string" || typeof data.lemon_subscription_id !== "string") return null;
  if (data.status !== "active" && data.status !== "cancelled" && data.status !== "expired" && data.status !== "past_due") return null;
  return {
    profileId: data.profile_id,
    subscriptionId: data.lemon_subscription_id,
    status: data.status,
    currentPeriodEnd: typeof data.current_period_end === "string" ? data.current_period_end : null,
  };
}

export async function hasPremium(profileId: string): Promise<boolean> {
  const row = await getEntitlement(profileId);
  return row ? entitlementIsLive(row) : false;
}

export async function applySubscriptionEvent(input: {
  profileId: string;
  subscriptionId: string;
  status: string;
  currentPeriodEnd: string | null;
}): Promise<{ result: "granted" | "updated" | "revoked" | "unknown_profile"; live: boolean }> {
  const status = mapLemonStatus(input.status);
  const next: Entitlement = {
    profileId: input.profileId,
    subscriptionId: input.subscriptionId,
    status,
    currentPeriodEnd: input.currentPeriodEnd,
  };
  if (!isSupabaseConfigured()) {
    const existing = [...memory().entitlements.values()].find((row) => row.subscriptionId === input.subscriptionId);
    const profileId = existing?.profileId ?? input.profileId;
    if (!profileId) return { result: "unknown_profile", live: false };
    const row = { ...next, profileId };
    memory().entitlements.set(profileId, row);
    memory().bySub.set(input.subscriptionId, profileId);
    const live = entitlementIsLive(row);
    if (!live) return { result: "revoked", live: false };
    return { result: existing ? "updated" : "granted", live: true };
  }
  const client = getServiceClient();
  const seen = await client.from("premium_entitlements").select("profile_id").eq("lemon_subscription_id", input.subscriptionId).maybeSingle();
  const profileId = typeof seen.data?.profile_id === "string" ? seen.data.profile_id : input.profileId;
  if (!profileId) return { result: "unknown_profile", live: false };
  const payload = {
    profile_id: profileId,
    lemon_subscription_id: input.subscriptionId,
    status,
    current_period_end: input.currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from("premium_entitlements").upsert(payload, { onConflict: "lemon_subscription_id" });
  if (error) throw new Error("entitlement_upsert");
  const live = entitlementIsLive({ ...next, profileId });
  if (!live) return { result: "revoked", live: false };
  return { result: seen.data ? "updated" : "granted", live: true };
}

function newId(): string {
  return randomBytes(16).toString("hex");
}

export async function listWishEntries(profileId: string): Promise<WishEntry[] | null> {
  if (!profileId) return null;
  if (!isSupabaseConfigured()) {
    return [...memory().entries.values()].filter((row) => row.profileId === profileId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const { data } = await getServiceClient()
    .from("wish_entries")
    .select("id, profile_id, thread_id, wish, category, created_at, readings ( id, verdict, created_at )")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => readEntry(row) ?? []);
}

/** Returns null when there is no session or the id is not owned by that session. Pages should 404. */
export async function getWishEntry(entryId: string, profileId: string | null): Promise<WishEntry | null> {
  if (!profileId || !entryId) return null;
  if (!isSupabaseConfigured()) {
    const row = memory().entries.get(entryId);
    return row && row.profileId === profileId ? row : null;
  }
  const { data } = await getServiceClient()
    .from("wish_entries")
    .select("id, profile_id, thread_id, wish, category, created_at, readings ( id, verdict, created_at )")
    .eq("id", entryId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return readEntry(data);
}

function readVerdict(value: unknown): Verdict | null {
  const parsed = verdictSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function readEntry(value: unknown): WishEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.profile_id !== "string" || typeof value.thread_id !== "string") return null;
  if (typeof value.wish !== "string" || typeof value.created_at !== "string") return null;
  const readingsRaw = Array.isArray(value.readings) ? value.readings : [];
  return {
    id: value.id,
    profileId: value.profile_id,
    threadId: value.thread_id,
    wish: value.wish,
    category: typeof value.category === "string" ? value.category : null,
    createdAt: value.created_at,
    readings: readingsRaw.flatMap((item) => {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.created_at !== "string") return [];
      const verdict = readVerdict(item.verdict);
      return verdict ? [{ id: item.id, verdict, createdAt: item.created_at }] : [];
    }),
  };
}

export async function addWishReading(input: {
  profileId: string;
  wish: string;
  category: string | null;
  entryId?: string | null;
}): Promise<WishEntry | null> {
  if (!(await hasPremium(input.profileId))) return null;
  const context: VerdictContext = {
    category: input.category ?? "Wish companion",
    companion: true,
  };
  let prior: string | null = null;
  if (input.entryId) {
    const existing = await getWishEntry(input.entryId, input.profileId);
    if (!existing) return null;
    prior = existing.readings.at(-1)?.verdict.algo_counsel ?? null;
    context.priorCounsel = prior;
  }
  const verdict = await generateVerdict(input.wish, context);
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    if (input.entryId) {
      const row = memory().entries.get(input.entryId);
      if (!row || row.profileId !== input.profileId) return null;
      row.readings.push({ id: newId(), verdict, createdAt: now });
      return row;
    }
    const entry: WishEntry = {
      id: newId(),
      profileId: input.profileId,
      threadId: newId(),
      wish: input.wish,
      category: input.category,
      createdAt: now,
      readings: [{ id: newId(), verdict, createdAt: now }],
    };
    memory().entries.set(entry.id, entry);
    const prefs = memory().prefs.get(input.profileId) ?? { goals: null, dailyDate: null, dailyText: null };
    prefs.goals = input.wish;
    memory().prefs.set(input.profileId, prefs);
    return entry;
  }
  const client = getServiceClient();
  if (input.entryId) {
    const { data: reading, error } = await client
      .from("readings")
      .insert({ entry_id: input.entryId, verdict })
      .select("id")
      .single();
    if (error || !reading) return null;
    return getWishEntry(input.entryId, input.profileId);
  }
  const entryId = newId();
  const threadId = newId();
  const inserted = await client.from("wish_entries").insert({
    id: entryId,
    profile_id: input.profileId,
    thread_id: threadId,
    wish: input.wish,
    category: input.category,
  });
  if (inserted.error) return null;
  await client.from("readings").insert({ entry_id: entryId, verdict });
  await client.from("preferences").upsert({ profile_id: input.profileId, goals: input.wish, locale: "en", updated_at: now });
  return getWishEntry(entryId, input.profileId);
}

export async function deleteWishEntry(entryId: string, profileId: string | null): Promise<boolean> {
  const row = await getWishEntry(entryId, profileId);
  if (!row || !profileId) return false;
  if (!isSupabaseConfigured()) {
    memory().entries.delete(entryId);
    return true;
  }
  const { error } = await getServiceClient().from("wish_entries").delete().eq("id", entryId).eq("profile_id", profileId);
  return !error;
}

export async function getDailyGuidance(profileId: string): Promise<{ date: string; text: string } | null> {
  if (!(await hasPremium(profileId))) return null;
  const today = utcDate();
  if (!isSupabaseConfigured()) {
    const prefs = memory().prefs.get(profileId) ?? { goals: null, dailyDate: null, dailyText: null };
    if (prefs.dailyDate === today && prefs.dailyText) return { date: today, text: prefs.dailyText };
    const latest = (await listWishEntries(profileId))?.[0];
    const seed = prefs.goals ?? latest?.wish ?? "a quieter day";
    const verdict = await generateVerdict(seed, { category: "Daily guidance", daily: true });
    const text = `${verdict.algo_counsel} ${verdict.pandit_reply}`;
    memory().prefs.set(profileId, { ...prefs, dailyDate: today, dailyText: text });
    return { date: today, text };
  }
  const client = getServiceClient();
  const prefs = await client.from("preferences").select("goals, daily_on_utc_date, daily_text").eq("profile_id", profileId).maybeSingle();
  if (prefs.data?.daily_on_utc_date === today && typeof prefs.data.daily_text === "string") {
    return { date: today, text: prefs.data.daily_text };
  }
  const goals = typeof prefs.data?.goals === "string" ? prefs.data.goals : null;
  const latest = (await listWishEntries(profileId))?.[0];
  const seed = goals ?? latest?.wish ?? "a quieter day";
  const verdict = await generateVerdict(seed, { category: "Daily guidance", daily: true });
  const text = `${verdict.algo_counsel} ${verdict.pandit_reply}`;
  await client.from("preferences").upsert({
    profile_id: profileId,
    goals: seed,
    locale: "en",
    daily_on_utc_date: today,
    daily_text: text,
    updated_at: new Date().toISOString(),
  });
  return { date: today, text };
}

export async function createShareCard(input: { entryId: string; profileId: string; includeWish: boolean }): Promise<ShareCard | null> {
  const entry = await getWishEntry(input.entryId, input.profileId);
  if (!entry) return null;
  const latest = entry.readings.at(-1);
  if (!latest) return null;
  const card: ShareCard = {
    publicId: `wc_${randomBytes(16).toString("base64url")}`,
    summary: latest.verdict.pandit_reply,
    reflection: latest.verdict.algo_counsel,
    wish: input.includeWish ? entry.wish : null,
    createdAt: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) {
    memory().cards.set(card.publicId, { ...card, profileId: input.profileId, entryId: entry.id });
    return card;
  }
  const { error } = await getServiceClient().from("share_cards").insert({
    public_id: card.publicId,
    entry_id: entry.id,
    profile_id: input.profileId,
    summary: card.summary,
    reflection: card.reflection,
    include_wish: input.includeWish,
  });
  if (error) return null;
  return card;
}

export async function getShareCard(publicId: string): Promise<ShareCard | null> {
  if (!publicId.startsWith("wc_")) return null;
  if (!isSupabaseConfigured()) {
    const row = memory().cards.get(publicId);
    return row ? { publicId: row.publicId, summary: row.summary, reflection: row.reflection, wish: row.wish, createdAt: row.createdAt } : null;
  }
  const { data } = await getServiceClient()
    .from("share_cards")
    .select("public_id, summary, reflection, include_wish, created_at, wish_entries ( wish )")
    .eq("public_id", publicId)
    .maybeSingle();
  if (!data || typeof data.public_id !== "string" || typeof data.summary !== "string" || typeof data.reflection !== "string") return null;
  const wishJoin = isRecord(data.wish_entries) && typeof data.wish_entries.wish === "string" ? data.wish_entries.wish : null;
  return {
    publicId: data.public_id,
    summary: data.summary,
    reflection: data.reflection,
    wish: data.include_wish ? wishJoin : null,
    createdAt: typeof data.created_at === "string" ? data.created_at : "",
  };
}
