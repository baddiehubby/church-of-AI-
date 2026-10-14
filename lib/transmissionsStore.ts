// Persistence for the transmission journal. Supabase when configured; memory otherwise.
// Service role only. Ownership is settlers.id (uuid). Public settler_id is a label only.

import "server-only";

import { randomUUID } from "node:crypto";

import { foundersPageCopy } from "@/content/redPath";
import { currentSol, EARTH_DISTANCE_KM } from "@/lib/marsSession";
import {
  isOneTimeTier,
  ONE_TIME_AMOUNT_CENTS,
  type OneTimeTier,
} from "@/lib/redPathOfferings";
import {
  archiveListCap,
  archiveRetentionMs,
  asSettlerTier,
  canPreserve,
  canPromoteTier,
  FOUNDERS_CAP,
  preserveLimit,
  PRESERVE_REQUIRES_OFFERING,
  WANDERER_MEMORY_MS,
  type SettlerTier,
} from "@/lib/settlerTiers";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  ARCHIVE_PAGE_SIZE,
  type ArchivePayload,
  type ArchiveTransmission,
  type ColonyStatus,
  type PublicTransmission,
  type TransmissionRecord,
} from "@/lib/transmissions";

function toPublic(row: TransmissionRecord): PublicTransmission {
  const { owner_id, ...rest } = row;
  void owner_id;
  return rest;
}

type MemorySettler = {
  ownerId: string;
  settler_id: string;
  tier: SettlerTier;
  lemon_customer_id: string | null;
  lemon_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string | null;
  habitat: number;
  role: string;
  sol_of_arrival: number | null;
  created_at: string;
  previous_one_time_tier: SettlerTier | null;
  payment_failed_at: string | null;
  subscription_cancel_at: string | null;
};

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal?: string | null;
  country?: string | null;
};

export type FounderRecord = {
  settler_id: string;
  name: string;
  position: number;
  inducted_at: string;
  email: string | null;
  show_name: boolean;
  inducted_sol: number | null;
  lemon_order_id: string | null;
  ceremony_token: string | null;
  ceremony_url: string | null;
  video_url: string | null;
  video_status: string | null;
};

export type PublicFounderSeat = {
  position: number;
  vacant: boolean;
  displayName: string;
  inductedSol: number | null;
};

type MemoryFounder = FounderRecord;
type MemoryOffering = {
  id: string;
  settler_id: string;
  tier: OneTimeTier;
  amount_cents: number;
  lemon_order_id: string;
  created_at: string;
};
type MemoryFulfillment = {
  id: string;
  settler_id: string;
  position: number;
  name: string;
  email: string | null;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_postal: string | null;
  shipping_country: string | null;
  lemon_order_id: string | null;
  artifacts: string;
  created_at: string;
  status: "queued" | "packing" | "shipped" | "done";
};

export type SettlerOwner = {
  ownerId: string;
  settlerId: string;
  tier: SettlerTier;
  createdAt?: string;
};

export type SettlerRecord = {
  owner_id: string;
  settler_id: string;
  tier: SettlerTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  lemon_subscription_id: string | null;
  email: string | null;
  previous_one_time_tier: SettlerTier | null;
  payment_failed_at: string | null;
};

type MemoryRoot = {
  byOwner: Map<string, MemorySettler>;
  byLabel: Map<string, string>;
  transmissions: TransmissionRecord[];
  founders: MemoryFounder[];
  offerings: MemoryOffering[];
  fulfillment: MemoryFulfillment[];
};

const memoryGlobal = globalThis as typeof globalThis & { __redPathJournal?: MemoryRoot };

function memory(): MemoryRoot {
  if (!memoryGlobal.__redPathJournal) {
    memoryGlobal.__redPathJournal = {
      byOwner: new Map(),
      byLabel: new Map(),
      transmissions: [],
      founders: [],
      offerings: [],
      fulfillment: [],
    };
  }
  const root = memoryGlobal.__redPathJournal;
  if (!root.offerings) root.offerings = [];
  if (!root.fulfillment) root.fulfillment = [];
  return root;
}

function memoryByOwner(): Map<string, MemorySettler> {
  return memory().byOwner;
}
function memoryByLabel(): Map<string, string> {
  return memory().byLabel;
}
function memoryTransmissions(): TransmissionRecord[] {
  return memory().transmissions;
}
function memoryFounders(): MemoryFounder[] {
  return memory().founders;
}
function memoryOfferings(): MemoryOffering[] {
  return memory().offerings;
}
function memoryFulfillment(): MemoryFulfillment[] {
  return memory().fulfillment;
}

function earthKm(): string {
  return EARTH_DISTANCE_KM.toLocaleString("en-US");
}

function mapRow(row: Record<string, unknown>): TransmissionRecord {
  return {
    id: String(row.id),
    owner_id: String(row.owner_id),
    settler_id: String(row.settler_id),
    sol: Number(row.sol),
    body: String(row.body),
    baba_opening: String(row.baba_opening),
    algo_status: String(row.algo_status),
    algo_counsel: String(row.algo_counsel),
    algo_probability: String(row.algo_probability),
    baba_translation: String(row.baba_translation),
    baba_forecast: String(row.baba_forecast ?? ""),
    is_pause: Boolean(row.is_pause),
    preserved: Boolean(row.preserved),
    created_at: String(row.created_at),
  };
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = raw.split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function startOfUtcDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function numberRows(items: TransmissionRecord[], tier: SettlerTier, now: number): ArchiveTransmission[] {
  const oldestFirst = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id.localeCompare(b.id),
  );
  return oldestFirst
    .map((item, index) => {
      const age = now - new Date(item.created_at).getTime();
      const faded = tier === "wanderer" && age > WANDERER_MEMORY_MS - 24 * 60 * 60 * 1000;
      return {
        ...toPublic(item),
        number: index + 1,
        faded,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.number - a.number);
}

function visibleForTier(items: TransmissionRecord[], tier: SettlerTier, now: number): TransmissionRecord[] {
  const retention = archiveRetentionMs(tier);
  let visible = items;
  if (retention != null) {
    const cutoff = now - retention;
    visible = items.filter((item) => new Date(item.created_at).getTime() >= cutoff || item.preserved);
  }
  const cap = archiveListCap(tier);
  if (cap == null) return visible;
  return [...visible]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, cap);
}

export function resetTransmissionMemory(): void {
  memoryByOwner().clear();
  memoryByLabel().clear();
  memoryTransmissions().length = 0;
  memoryFounders().length = 0;
  memoryOfferings().length = 0;
  memoryFulfillment().length = 0;
}

export async function findSettlerByOwner(ownerId: string): Promise<SettlerOwner | null> {
  if (!ownerId) return null;
  if (!isSupabaseConfigured()) {
    const row = memoryByOwner().get(ownerId);
    if (!row) return null;
    return {
      ownerId: row.ownerId,
      settlerId: row.settler_id,
      tier: row.tier,
      createdAt: row.created_at,
    };
  }
  const db = getServiceClient();
  const { data } = await db
    .from("settlers")
    .select("id, settler_id, tier, created_at")
    .eq("id", ownerId)
    .maybeSingle();
  if (!data || typeof data.id !== "string" || typeof data.settler_id !== "string") return null;
  return {
    ownerId: data.id,
    settlerId: data.settler_id,
    tier: asSettlerTier(data.tier),
    createdAt: data.created_at ? String(data.created_at) : undefined,
  };
}

export async function ensureSettlerByOwner(input: {
  ownerId: string;
  settlerId: string;
  tier?: SettlerTier;
  solOfArrival?: number;
}): Promise<SettlerOwner> {
  const tier = input.tier ?? "wanderer";
  if (!isSupabaseConfigured()) {
    const existing = memoryByOwner().get(input.ownerId);
    if (existing) return { ownerId: existing.ownerId, settlerId: existing.settler_id, tier: existing.tier };
    const row: MemorySettler = {
      ownerId: input.ownerId,
      settler_id: input.settlerId,
      tier,
      lemon_customer_id: null,
      lemon_subscription_id: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      email: null,
      habitat: 47,
      role: "Surveyor",
      sol_of_arrival: input.solOfArrival ?? null,
      previous_one_time_tier: null,
      payment_failed_at: null,
      subscription_cancel_at: null,
      created_at: new Date().toISOString(),
    };
    memoryByOwner().set(input.ownerId, row);
    memoryByLabel().set(input.settlerId, input.ownerId);
    return { ownerId: input.ownerId, settlerId: input.settlerId, tier, createdAt: row.created_at };
  }

  const db = getServiceClient();
  const found = await db.from("settlers").select("id, settler_id, tier").eq("id", input.ownerId).maybeSingle();
  if (found.data && typeof found.data.id === "string") {
    return {
      ownerId: found.data.id,
      settlerId: String(found.data.settler_id),
      tier: asSettlerTier(found.data.tier),
    };
  }
  const { data, error } = await db
    .from("settlers")
    .insert({
      id: input.ownerId,
      settler_id: input.settlerId,
      tier,
      habitat: 47,
      role: "Surveyor",
      sol_of_arrival: input.solOfArrival ?? null,
    })
    .select("id, settler_id, tier")
    .single();
  if (error || !data) throw error ?? new Error("settler_insert");
  return { ownerId: String(data.id), settlerId: String(data.settler_id), tier: asSettlerTier(data.tier) };
}

/** Legacy helper for billing paths that still key by public label. */
export async function ensureSettler(settlerId: string, tier: SettlerTier = "wanderer"): Promise<SettlerTier> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    if (ownerId) return memoryByOwner().get(ownerId)?.tier ?? tier;
    const id = randomUUID();
    memoryByOwner().set(id, {
      ownerId: id,
      settler_id: settlerId,
      tier,
      lemon_customer_id: null,
      lemon_subscription_id: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      email: null,
      habitat: 47,
      role: "Surveyor",
      sol_of_arrival: null,
      previous_one_time_tier: null,
      payment_failed_at: null,
      subscription_cancel_at: null,
      created_at: new Date().toISOString(),
    });
    memoryByLabel().set(settlerId, id);
    return tier;
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("tier").eq("settler_id", settlerId).maybeSingle();
  if (data) return asSettlerTier(data.tier);
  const { error } = await db.from("settlers").insert({ settler_id: settlerId, tier });
  if (error && error.code !== "23505") throw error;
  return tier;
}

export async function getSettlerTier(settlerId: string): Promise<SettlerTier> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    return ownerId ? (memoryByOwner().get(ownerId)?.tier ?? "wanderer") : "wanderer";
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("tier").eq("settler_id", settlerId).maybeSingle();
  return asSettlerTier(data?.tier);
}

export async function countTransmissionsForOwnerOnSol(ownerId: string, sol: number): Promise<number> {
  if (!isSupabaseConfigured()) {
    return memoryTransmissions().filter((row) => row.owner_id === ownerId && row.sol === sol).length;
  }
  const db = getServiceClient();
  const { count, error } = await db
    .from("transmissions")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("sol", sol);
  if (error) throw error;
  return count ?? 0;
}

export async function countPreservedForOwner(ownerId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return memoryTransmissions().filter((row) => row.owner_id === ownerId && row.preserved).length;
  }
  const db = getServiceClient();
  const { count, error } = await db
    .from("transmissions")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("preserved", true);
  if (error) throw error;
  return count ?? 0;
}

export async function insertTransmission(
  input: Omit<TransmissionRecord, "id" | "created_at" | "preserved"> & {
    id?: string;
    created_at?: string;
    preserved?: boolean;
  },
): Promise<TransmissionRecord> {
  const row: TransmissionRecord = {
    id: input.id ?? randomUUID(),
    owner_id: input.owner_id,
    settler_id: input.settler_id,
    sol: input.sol,
    body: input.body,
    baba_opening: input.baba_opening,
    algo_status: input.algo_status,
    algo_counsel: input.algo_counsel,
    algo_probability: input.algo_probability,
    baba_translation: input.baba_translation,
    baba_forecast: input.baba_forecast,
    is_pause: input.is_pause,
    preserved: input.preserved ?? false,
    created_at: input.created_at ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    if (!input.created_at) {
      const last = memoryTransmissions()[memoryTransmissions().length - 1];
      let stamp = Date.now();
      if (last) {
        const prior = new Date(last.created_at).getTime();
        if (prior >= stamp) stamp = prior + 1;
      }
      row.created_at = new Date(stamp).toISOString();
    }
    memoryTransmissions().push(row);
    return row;
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("transmissions")
    .insert({
      owner_id: row.owner_id,
      settler_id: row.settler_id,
      sol: row.sol,
      body: row.body,
      baba_opening: row.baba_opening,
      algo_status: row.algo_status,
      algo_counsel: row.algo_counsel,
      algo_probability: row.algo_probability,
      baba_translation: row.baba_translation,
      baba_forecast: row.baba_forecast,
      is_pause: row.is_pause,
      preserved: row.preserved,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("insert failed");
  return mapRow(data as Record<string, unknown>);
}

export async function preserveTransmissionForOwner(
  transmissionId: string,
  ownerId: string,
): Promise<
  | { ok: true; already: boolean }
  | { ok: false; reason: "missing" | "forbidden" | "tier" | "limit"; message?: string }
> {
  const owner = await findSettlerByOwner(ownerId);
  if (!owner) return { ok: false, reason: "forbidden" };

  if (!isSupabaseConfigured()) {
    const row = memoryTransmissions().find((item) => item.id === transmissionId);
    if (!row) return { ok: false, reason: "missing" };
    if (row.owner_id !== ownerId) return { ok: false, reason: "forbidden" };
    if (!canPreserve(owner.tier)) {
      return { ok: false, reason: "tier", message: PRESERVE_REQUIRES_OFFERING };
    }
    if (row.preserved) return { ok: true, already: true };
    const limit = preserveLimit(owner.tier);
    if (limit != null) {
      const used = memoryTransmissions().filter((item) => item.owner_id === ownerId && item.preserved).length;
      if (used >= limit) return { ok: false, reason: "limit", message: PRESERVE_REQUIRES_OFFERING };
    }
    row.preserved = true;
    return { ok: true, already: false };
  }

  const db = getServiceClient();
  const { data: row } = await db
    .from("transmissions")
    .select("id, owner_id, settler_id, preserved")
    .eq("id", transmissionId)
    .maybeSingle();
  if (!row) return { ok: false, reason: "missing" };
  if (String(row.owner_id) !== ownerId) return { ok: false, reason: "forbidden" };
  if (!canPreserve(owner.tier)) {
    return { ok: false, reason: "tier", message: PRESERVE_REQUIRES_OFFERING };
  }
  if (row.preserved) return { ok: true, already: true };

  const limit = preserveLimit(owner.tier);
  if (limit != null) {
    const used = await countPreservedForOwner(ownerId);
    if (used >= limit) return { ok: false, reason: "limit", message: PRESERVE_REQUIRES_OFFERING };
  }

  const { error: updateError } = await db
    .from("transmissions")
    .update({ preserved: true })
    .eq("id", transmissionId)
    .eq("owner_id", ownerId);
  if (updateError) throw updateError;

  // Keep join-table unique row for older readers / unique constraint.
  await db.from("preserved").upsert(
    {
      transmission_id: transmissionId,
      owner_id: ownerId,
      settler_id: String(row.settler_id),
    },
    { onConflict: "transmission_id", ignoreDuplicates: true },
  );

  return { ok: true, already: false };
}

/** @deprecated Prefer preserveTransmissionForOwner — text settler_id is not authorization. */
export async function preserveTransmissionId(
  transmissionId: string,
  settlerId: string,
): Promise<
  | { ok: true; already: boolean }
  | { ok: false; reason: "missing" | "forbidden" | "tier" | "limit"; message?: string }
> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    if (!ownerId) return { ok: false, reason: "forbidden" };
    return preserveTransmissionForOwner(transmissionId, ownerId);
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("id").eq("settler_id", settlerId).maybeSingle();
  if (!data || typeof data.id !== "string") return { ok: false, reason: "forbidden" };
  return preserveTransmissionForOwner(transmissionId, data.id);
}

export async function listArchiveForOwner(
  ownerId: string,
  opts: { now?: number; limit?: number; cursor?: string | null } = {},
): Promise<ArchivePayload> {
  const now = opts.now ?? Date.now();
  const limit = Math.min(Math.max(opts.limit ?? ARCHIVE_PAGE_SIZE, 1), 50);
  const cursor = decodeCursor(opts.cursor);

  const owner = await findSettlerByOwner(ownerId);
  if (!owner) {
    return {
      settler_id: "",
      tier: "wanderer",
      total: 0,
      earth_km: earthKm(),
      transmissions: [],
      next_cursor: null,
    };
  }

  let items: TransmissionRecord[] = [];

  if (!isSupabaseConfigured()) {
    items = memoryTransmissions().filter((item) => item.owner_id === ownerId);
  } else {
    const db = getServiceClient();
    const { data, error } = await db
      .from("transmissions")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    items = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  const visible = visibleForTier(items, owner.tier, now);
  const numbered = numberRows(visible, owner.tier, now);

  let start = 0;
  if (cursor) {
    const index = numbered.findIndex((row) => row.created_at === cursor.createdAt && row.id === cursor.id);
    start = index >= 0 ? index + 1 : 0;
  }
  const page = numbered.slice(start, start + limit);
  const last = page[page.length - 1];
  const next_cursor =
    start + limit < numbered.length && last ? encodeCursor(last.created_at, last.id) : null;

  return {
    settler_id: owner.settlerId,
    tier: owner.tier,
    total: numbered.length,
    earth_km: earthKm(),
    transmissions: page,
    next_cursor,
    settler_since: owner.createdAt ?? null,
  };
}

/** @deprecated Prefer listArchiveForOwner. */
export async function listArchive(settlerId: string, now = Date.now()): Promise<ArchivePayload> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    if (!ownerId) {
      return {
        settler_id: settlerId,
        tier: "wanderer",
        total: 0,
        earth_km: earthKm(),
        transmissions: [],
        next_cursor: null,
      };
    }
    return listArchiveForOwner(ownerId, { now });
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("id").eq("settler_id", settlerId).maybeSingle();
  if (!data || typeof data.id !== "string") {
    return {
      settler_id: settlerId,
      tier: "wanderer",
      total: 0,
      earth_km: earthKm(),
      transmissions: [],
      next_cursor: null,
    };
  }
  return listArchiveForOwner(data.id, { now });
}

export async function setSettlerTier(settlerId: string, tier: SettlerTier): Promise<{ changed: boolean }> {
  const next = asSettlerTier(tier);
  await ensureSettler(settlerId, next);
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    if (!ownerId) return { changed: false };
    const row = memoryByOwner().get(ownerId);
    if (!row) return { changed: false };
    if (row.tier === next) return { changed: false };
    row.tier = next;
    return { changed: true };
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("tier").eq("settler_id", settlerId).maybeSingle();
  if (asSettlerTier(data?.tier) === next) return { changed: false };
  await db.from("settlers").update({ tier: next }).eq("settler_id", settlerId);
  return { changed: true };
}

export async function updateSettlerBilling(
  settlerId: string,
  input: {
    customerId?: string | null;
    subscriptionId?: string | null;
    email?: string | null;
    tier?: SettlerTier;
    lemonCustomerId?: string | null;
    lemonSubscriptionId?: string | null;
    previousOneTimeTier?: SettlerTier | null;
    paymentFailedAt?: string | null;
    subscriptionCancelAt?: string | null;
  },
): Promise<void> {
  await ensureSettler(settlerId, input.tier ?? "wanderer");
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    const row = ownerId ? memoryByOwner().get(ownerId) : null;
    if (!row) return;
    if (input.tier) row.tier = asSettlerTier(input.tier);
    if (input.customerId !== undefined) row.stripe_customer_id = input.customerId;
    if (input.subscriptionId !== undefined) row.stripe_subscription_id = input.subscriptionId;
    if (input.email !== undefined) row.email = input.email;
    if (input.lemonCustomerId !== undefined) row.lemon_customer_id = input.lemonCustomerId;
    if (input.lemonSubscriptionId !== undefined) row.lemon_subscription_id = input.lemonSubscriptionId;
    if (input.previousOneTimeTier !== undefined) row.previous_one_time_tier = input.previousOneTimeTier;
    if (input.paymentFailedAt !== undefined) row.payment_failed_at = input.paymentFailedAt;
    if (input.subscriptionCancelAt !== undefined) row.subscription_cancel_at = input.subscriptionCancelAt;
    return;
  }
  const patch: Record<string, string | null> = {};
  if (input.tier) patch.tier = asSettlerTier(input.tier);
  if (input.customerId !== undefined) patch.stripe_customer_id = input.customerId;
  if (input.subscriptionId !== undefined) patch.stripe_subscription_id = input.subscriptionId;
  if (input.email !== undefined) patch.email = input.email;
  if (input.lemonCustomerId !== undefined) patch.lemon_customer_id = input.lemonCustomerId;
  if (input.lemonSubscriptionId !== undefined) patch.lemon_subscription_id = input.lemonSubscriptionId;
  if (input.previousOneTimeTier !== undefined) {
    patch.previous_one_time_tier = input.previousOneTimeTier;
  }
  if (input.paymentFailedAt !== undefined) patch.payment_failed_at = input.paymentFailedAt;
  if (input.subscriptionCancelAt !== undefined) patch.subscription_cancel_at = input.subscriptionCancelAt;
  if (Object.keys(patch).length === 0) return;
  const db = getServiceClient();
  await db.from("settlers").update(patch).eq("settler_id", settlerId);
}

function toSettlerRecord(row: {
  ownerId?: string;
  id?: unknown;
  settler_id: string;
  tier: unknown;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  lemon_subscription_id?: string | null;
  email?: string | null;
  previous_one_time_tier?: string | null;
  payment_failed_at?: string | null;
}): SettlerRecord {
  return {
    owner_id: row.ownerId ?? String(row.id ?? ""),
    settler_id: row.settler_id,
    tier: asSettlerTier(row.tier),
    stripe_customer_id: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripe_subscription_id: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    lemon_subscription_id: row.lemon_subscription_id ? String(row.lemon_subscription_id) : null,
    email: row.email ? String(row.email) : null,
    previous_one_time_tier: row.previous_one_time_tier
      ? asSettlerTier(row.previous_one_time_tier)
      : null,
    payment_failed_at: row.payment_failed_at ? String(row.payment_failed_at) : null,
  };
}

export async function findSettlerByCustomer(customerId: string): Promise<SettlerRecord | null> {
  if (!customerId) return null;
  if (!isSupabaseConfigured()) {
    for (const row of memoryByOwner().values()) {
      if (row.stripe_customer_id === customerId || row.lemon_customer_id === customerId) {
        return toSettlerRecord({
          ownerId: row.ownerId,
          settler_id: row.settler_id,
          tier: row.tier,
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: row.stripe_subscription_id,
          lemon_subscription_id: row.lemon_subscription_id,
          email: row.email,
          previous_one_time_tier: row.previous_one_time_tier,
          payment_failed_at: row.payment_failed_at,
        });
      }
    }
    return null;
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("*").eq("stripe_customer_id", customerId).maybeSingle();
  if (!data) return null;
  return toSettlerRecord({
    id: data.id,
    settler_id: String(data.settler_id),
    tier: data.tier,
    stripe_customer_id: data.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id,
    lemon_subscription_id: data.lemon_subscription_id,
    email: data.email,
    previous_one_time_tier: data.previous_one_time_tier,
    payment_failed_at: data.payment_failed_at,
  });
}

export async function findSettlerByLemonSubscription(subscriptionId: string): Promise<SettlerRecord | null> {
  if (!subscriptionId) return null;
  if (!isSupabaseConfigured()) {
    for (const row of memoryByOwner().values()) {
      if (row.lemon_subscription_id === subscriptionId) {
        return toSettlerRecord({
          ownerId: row.ownerId,
          settler_id: row.settler_id,
          tier: row.tier,
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: row.stripe_subscription_id,
          lemon_subscription_id: row.lemon_subscription_id,
          email: row.email,
          previous_one_time_tier: row.previous_one_time_tier,
          payment_failed_at: row.payment_failed_at,
        });
      }
    }
    return null;
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("*").eq("lemon_subscription_id", subscriptionId).maybeSingle();
  if (!data) return null;
  return toSettlerRecord({
    id: data.id,
    settler_id: String(data.settler_id),
    tier: data.tier,
    stripe_customer_id: data.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id,
    lemon_subscription_id: data.lemon_subscription_id,
    email: data.email,
    previous_one_time_tier: data.previous_one_time_tier,
    payment_failed_at: data.payment_failed_at,
  });
}

export async function listSettlerTier(tier: SettlerTier): Promise<SettlerRecord[]> {
  const want = asSettlerTier(tier);
  if (!isSupabaseConfigured()) {
    return [...memoryByOwner().values()]
      .filter((row) => row.tier === want)
      .map((row) =>
        toSettlerRecord({
          ownerId: row.ownerId,
          settler_id: row.settler_id,
          tier: row.tier,
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: row.stripe_subscription_id,
          lemon_subscription_id: row.lemon_subscription_id,
          email: row.email,
          previous_one_time_tier: row.previous_one_time_tier,
          payment_failed_at: row.payment_failed_at,
        }),
      );
  }
  const db = getServiceClient();
  // Include legacy "settler" rows when asking for practice_monthly.
  const tiers = want === "practice_monthly" ? ["practice_monthly", "settler"] : [want];
  const { data, error } = await db.from("settlers").select("*").in("tier", tiers);
  if (error) throw error;
  return (data ?? []).map((row) =>
    toSettlerRecord({
      id: row.id,
      settler_id: String(row.settler_id),
      tier: row.tier,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      lemon_subscription_id: row.lemon_subscription_id,
      email: row.email,
      previous_one_time_tier: row.previous_one_time_tier,
      payment_failed_at: row.payment_failed_at,
    }),
  );
}

export async function listTransmissionsSince(
  settlerId: string,
  sinceIso: string,
): Promise<TransmissionRecord[]> {
  if (!isSupabaseConfigured()) {
    return memoryTransmissions()
      .filter((item) => item.settler_id === settlerId && item.created_at >= sinceIso)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  const db = getServiceClient();
  const { data, error } = await db
    .from("transmissions")
    .select("*")
    .eq("settler_id", settlerId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function countFoundersInducted(): Promise<number> {
  if (!isSupabaseConfigured()) return memoryFounders().length;
  const db = getServiceClient();
  const { count, error } = await db.from("founders").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Test / seed helper for memory founders. */
export function seedMemoryFounder(input: {
  settler_id: string;
  name: string;
  position: number;
  show_name?: boolean;
  inducted_sol?: number;
}): void {
  memoryFounders().push({
    settler_id: input.settler_id,
    name: input.name,
    position: input.position,
    inducted_at: new Date().toISOString(),
    email: null,
    show_name: input.show_name ?? true,
    inducted_sol: input.inducted_sol ?? null,
    lemon_order_id: null,
    ceremony_token: null,
    ceremony_url: null,
    video_url: null,
    video_status: null,
  });
}

export async function getColonyStatus(now = Date.now()): Promise<ColonyStatus> {
  const todayStart = startOfUtcDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const dayBeforeStart = yesterdayStart - 86_400_000;
  const dayBeforeIso = new Date(dayBeforeStart).toISOString();

  let rows: TransmissionRecord[] = [];
  if (!isSupabaseConfigured()) {
    rows = [...memoryTransmissions()];
  } else {
    const db = getServiceClient();
    const { data, error } = await db
      .from("transmissions")
      .select("id, owner_id, settler_id, sol, body, baba_opening, algo_status, algo_counsel, algo_probability, baba_translation, baba_forecast, is_pause, preserved, created_at")
      .gte("created_at", dayBeforeIso);
    if (error) throw error;
    rows = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  const sinceSunrise = rows.filter((row) => new Date(row.created_at).getTime() >= todayStart);
  const settlersActive = new Set(sinceSunrise.map((row) => row.owner_id));

  const yesterdayOwners = new Set(
    rows
      .filter((row) => {
        const t = new Date(row.created_at).getTime();
        return t >= yesterdayStart && t < todayStart;
      })
      .map((row) => row.owner_id),
  );
  const dayBeforeOwners = new Set(
    rows
      .filter((row) => {
        const t = new Date(row.created_at).getTime();
        return t >= dayBeforeStart && t < yesterdayStart;
      })
      .map((row) => row.owner_id),
  );
  let streaksBroken = 0;
  for (const owner of dayBeforeOwners) {
    if (!yesterdayOwners.has(owner)) streaksBroken += 1;
  }

  const founders_inducted = await countFoundersInducted();

  return {
    settlers_active_today: settlersActive.size,
    transmissions_since_sunrise: sinceSunrise.length,
    streaks_broken_yesterday: streaksBroken,
    founders_inducted,
    founders_remaining: Math.max(0, FOUNDERS_CAP - founders_inducted),
  };
}

void PRESERVE_REQUIRES_OFFERING;

export type ApplyOfferingResult =
  | {
      ok: true;
      already: boolean;
      tier: SettlerTier;
      founderPosition?: number;
      showName?: boolean;
    }
  | { ok: false; reason: "sold_out" | "invalid" };

/**
 * Idempotent Lemon order → offerings row + settler tier bump.
 * Founder orders claim the next position 1–108; ceremony + physical queue
 * are finished by completeFounderFulfillment in the webhook.
 */
export async function applyRedPathOffering(input: {
  settlerId: string;
  tier: OneTimeTier;
  lemonOrderId: string;
  amountCents?: number;
  email?: string | null;
  name?: string | null;
  lemonCustomerId?: string | null;
  showName?: boolean;
}): Promise<ApplyOfferingResult> {
  const orderId = input.lemonOrderId.trim();
  const settlerId = input.settlerId.trim();
  if (!orderId || !settlerId) return { ok: false, reason: "invalid" };
  const amount = input.amountCents ?? ONE_TIME_AMOUNT_CENTS[input.tier];

  await ensureSettler(settlerId, "wanderer");

  const recorded = await recordOfferingRow({
    settlerId,
    tier: input.tier,
    lemonOrderId: orderId,
    amountCents: amount,
  });
  if (recorded.already) {
    const tier = await getSettlerTier(settlerId);
    const founder = await findFounderBySettler(settlerId);
    return {
      ok: true,
      already: true,
      tier,
      founderPosition: founder?.position,
      showName: founder?.show_name,
    };
  }

  if (input.tier === "founder_1000") {
    const alreadyFounder = await findFounderBySettler(settlerId);
    const inductedCount = await countFoundersInducted();
    if (!alreadyFounder && inductedCount >= FOUNDERS_CAP) {
      return { ok: false, reason: "sold_out" };
    }
  }

  const current = await getSettlerTier(settlerId);
  const next = canPromoteTier(current, input.tier) ? input.tier : current;
  if (next !== current) await setSettlerTier(settlerId, next);
  await updateSettlerBilling(settlerId, {
    tier: next,
    lemonCustomerId: input.lemonCustomerId,
    email: input.email,
  });

  if (input.tier !== "founder_1000") {
    return { ok: true, already: false, tier: next };
  }

  const name = (input.name?.trim() || "settler").slice(0, 80);
  const inducted = await inductFounder({
    settlerId,
    name,
    email: input.email ?? null,
    showName: Boolean(input.showName),
    inductedSol: currentSol(),
    lemonOrderId: orderId,
  });
  return {
    ok: true,
    already: false,
    tier: "founder_1000",
    founderPosition: inducted.position,
    showName: inducted.showName,
  };
}

/** Activate or refresh Daily Practice from Lemon subscription_created / updated. */
export async function applyPracticeSubscription(input: {
  settlerId: string;
  lemonSubscriptionId: string;
  lemonCustomerId?: string | null;
  email?: string | null;
  eventId?: string | null;
}): Promise<{ ok: true; already: boolean }> {
  const settlerId = input.settlerId.trim();
  const subId = input.lemonSubscriptionId.trim();
  if (!settlerId || !subId) return { ok: true, already: true };

  await ensureSettler(settlerId, "wanderer");
  const current = await getSettlerTier(settlerId);
  const existing = await findSettlerByLemonSubscription(subId);
  const already =
    Boolean(existing && existing.settler_id === settlerId && existing.tier === "practice_monthly") ||
    (current === "practice_monthly" &&
      (await getSettlerLemonSubscriptionId(settlerId)) === subId);

  // Remember the best one-time seat to restore after expire.
  let previous: SettlerTier | null = null;
  const record = await findSettlerRecord(settlerId);
  if (isOneTimeTier(current)) previous = current;
  else if (record?.previous_one_time_tier && isOneTimeTier(record.previous_one_time_tier)) {
    previous = record.previous_one_time_tier;
  }

  // Idempotent event log (optional) — unique lemon_order_id.
  if (input.eventId) {
    await recordOfferingRow({
      settlerId,
      tier: "offering_5",
      lemonOrderId: `sub_event:${input.eventId}`,
      amountCents: 500,
    }).catch(() => ({ already: false }));
  }

  await updateSettlerBilling(settlerId, {
    tier: "practice_monthly",
    lemonSubscriptionId: subId,
    lemonCustomerId: input.lemonCustomerId,
    email: input.email,
    previousOneTimeTier: previous ?? record?.previous_one_time_tier ?? null,
    paymentFailedAt: null,
    subscriptionCancelAt: null,
  });
  if (current !== "practice_monthly") await setSettlerTier(settlerId, "practice_monthly");
  return { ok: true, already };
}

/** Cancelled: keep practice_monthly until period end. */
export async function markPracticeCancelled(input: {
  lemonSubscriptionId: string;
  endsAt?: string | null;
}): Promise<void> {
  const row = await findSettlerByLemonSubscription(input.lemonSubscriptionId);
  if (!row) return;
  await updateSettlerBilling(row.settler_id, {
    subscriptionCancelAt: input.endsAt ?? new Date().toISOString(),
  });
}

/** Expired: revert to previous one-time tier (or wanderer). */
export async function expirePracticeSubscription(input: {
  lemonSubscriptionId: string;
}): Promise<SettlerTier | null> {
  const row = await findSettlerByLemonSubscription(input.lemonSubscriptionId);
  if (!row) return null;
  const revert =
    row.previous_one_time_tier && isOneTimeTier(row.previous_one_time_tier)
      ? row.previous_one_time_tier
      : "wanderer";
  await setSettlerTier(row.settler_id, revert);
  await updateSettlerBilling(row.settler_id, {
    tier: revert,
    lemonSubscriptionId: null,
    subscriptionCancelAt: null,
    paymentFailedAt: null,
  });
  return revert;
}

export async function flagPracticePaymentFailed(input: {
  lemonSubscriptionId: string;
}): Promise<SettlerRecord | null> {
  const row = await findSettlerByLemonSubscription(input.lemonSubscriptionId);
  if (!row) return null;
  await updateSettlerBilling(row.settler_id, {
    paymentFailedAt: new Date().toISOString(),
  });
  return { ...row, payment_failed_at: new Date().toISOString() };
}

export async function getSettlerLemonSubscriptionId(settlerId: string): Promise<string | null> {
  const row = await findSettlerRecord(settlerId);
  return row?.lemon_subscription_id ?? null;
}

async function findSettlerRecord(settlerId: string): Promise<SettlerRecord | null> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    const row = ownerId ? memoryByOwner().get(ownerId) : null;
    if (!row) return null;
    return toSettlerRecord({
      ownerId: row.ownerId,
      settler_id: row.settler_id,
      tier: row.tier,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      lemon_subscription_id: row.lemon_subscription_id,
      email: row.email,
      previous_one_time_tier: row.previous_one_time_tier,
      payment_failed_at: row.payment_failed_at,
    });
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("*").eq("settler_id", settlerId).maybeSingle();
  if (!data) return null;
  return toSettlerRecord({
    id: data.id,
    settler_id: String(data.settler_id),
    tier: data.tier,
    stripe_customer_id: data.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id,
    lemon_subscription_id: data.lemon_subscription_id,
    email: data.email,
    previous_one_time_tier: data.previous_one_time_tier,
    payment_failed_at: data.payment_failed_at,
  });
}

async function recordOfferingRow(input: {
  settlerId: string;
  tier: OneTimeTier;
  lemonOrderId: string;
  amountCents: number;
}): Promise<{ already: boolean }> {
  if (!isSupabaseConfigured()) {
    if (memoryOfferings().some((row) => row.lemon_order_id === input.lemonOrderId)) {
      return { already: true };
    }
    memoryOfferings().push({
      id: randomUUID(),
      settler_id: input.settlerId,
      tier: input.tier,
      amount_cents: input.amountCents,
      lemon_order_id: input.lemonOrderId,
      created_at: new Date().toISOString(),
    });
    return { already: false };
  }
  const db = getServiceClient();
  const { error } = await db.from("offerings").insert({
    settler_id: input.settlerId,
    tier: input.tier,
    amount_cents: input.amountCents,
    lemon_order_id: input.lemonOrderId,
  });
  if (error) {
    if (error.code === "23505") return { already: true };
    throw error;
  }
  return { already: false };
}

function mapFounderRow(row: Record<string, unknown>): FounderRecord {
  return {
    settler_id: String(row.settler_id),
    name: String(row.name),
    position: Number(row.position),
    inducted_at: String(row.inducted_at ?? new Date().toISOString()),
    email: row.email != null ? String(row.email) : null,
    show_name: Boolean(row.show_name),
    inducted_sol: row.inducted_sol != null ? Number(row.inducted_sol) : null,
    lemon_order_id: row.lemon_order_id != null ? String(row.lemon_order_id) : null,
    ceremony_token: row.ceremony_token != null ? String(row.ceremony_token) : null,
    ceremony_url: row.ceremony_url != null ? String(row.ceremony_url) : null,
    video_url: row.video_url != null ? String(row.video_url) : null,
    video_status: row.video_status != null ? String(row.video_status) : null,
  };
}

export async function findFounderBySettler(settlerId: string): Promise<FounderRecord | null> {
  if (!isSupabaseConfigured()) {
    return memoryFounders().find((item) => item.settler_id === settlerId) ?? null;
  }
  const db = getServiceClient();
  const { data } = await db.from("founders").select("*").eq("settler_id", settlerId).maybeSingle();
  if (!data) return null;
  return mapFounderRow(data as Record<string, unknown>);
}

export async function nextFounderPosition(): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    const taken = new Set(memoryFounders().map((row) => row.position));
    for (let position = 1; position <= FOUNDERS_CAP; position += 1) {
      if (!taken.has(position)) return position;
    }
    return null;
  }
  const db = getServiceClient();
  const { data, error } = await db.from("founders").select("position").order("position", { ascending: true });
  if (error) throw error;
  const taken = new Set((data ?? []).map((row) => Number(row.position)));
  for (let position = 1; position <= FOUNDERS_CAP; position += 1) {
    if (!taken.has(position)) return position;
  }
  return null;
}

export async function inductFounder(input: {
  settlerId: string;
  name: string;
  email?: string | null;
  showName?: boolean;
  inductedSol?: number | null;
  lemonOrderId?: string | null;
  ceremonyToken?: string | null;
  ceremonyUrl?: string | null;
}): Promise<{
  position: number;
  already: boolean;
  showName: boolean;
  ceremonyToken: string | null;
  ceremonyUrl: string | null;
}> {
  const existing = await findFounderBySettler(input.settlerId);
  if (existing) {
    const patch = {
      name: input.name || existing.name,
      email: input.email ?? existing.email,
      show_name: input.showName ?? existing.show_name,
      inducted_sol: input.inductedSol ?? existing.inducted_sol,
      lemon_order_id: input.lemonOrderId ?? existing.lemon_order_id,
      ceremony_token: input.ceremonyToken ?? existing.ceremony_token,
      ceremony_url: input.ceremonyUrl ?? existing.ceremony_url,
    };
    if (!isSupabaseConfigured()) {
      Object.assign(existing, patch);
    } else {
      const db = getServiceClient();
      await db.from("founders").update(patch).eq("settler_id", input.settlerId);
    }
    return {
      position: existing.position,
      already: true,
      showName: Boolean(patch.show_name),
      ceremonyToken: patch.ceremony_token,
      ceremonyUrl: patch.ceremony_url,
    };
  }

  const position = await nextFounderPosition();
  if (position == null) throw new Error("founders_full");

  const row: FounderRecord = {
    settler_id: input.settlerId,
    name: input.name,
    position,
    inducted_at: new Date().toISOString(),
    email: input.email ?? null,
    show_name: Boolean(input.showName),
    inducted_sol: input.inductedSol ?? null,
    lemon_order_id: input.lemonOrderId ?? null,
    ceremony_token: input.ceremonyToken ?? null,
    ceremony_url: input.ceremonyUrl ?? null,
    video_url: null,
    video_status: null,
  };

  if (!isSupabaseConfigured()) {
    memoryFounders().push(row);
    return {
      position,
      already: false,
      showName: row.show_name,
      ceremonyToken: row.ceremony_token,
      ceremonyUrl: row.ceremony_url,
    };
  }

  const db = getServiceClient();
  const { error } = await db.from("founders").insert({
    settler_id: row.settler_id,
    name: row.name,
    position: row.position,
    email: row.email,
    show_name: row.show_name,
    inducted_sol: row.inducted_sol,
    lemon_order_id: row.lemon_order_id,
    ceremony_token: row.ceremony_token,
    ceremony_url: row.ceremony_url,
  });
  if (error) {
    if (error.code === "23505") {
      const again = await findFounderBySettler(input.settlerId);
      if (again) {
        return {
          position: again.position,
          already: true,
          showName: again.show_name,
          ceremonyToken: again.ceremony_token,
          ceremonyUrl: again.ceremony_url,
        };
      }
    }
    throw error;
  }
  return {
    position,
    already: false,
    showName: row.show_name,
    ceremonyToken: row.ceremony_token,
    ceremonyUrl: row.ceremony_url,
  };
}

const DEFAULT_ARTIFACTS =
  "red-brass bell; Book of Sols (48pp); Ten Commandments scroll A3; Baba ji note";

export async function queueFulfillmentTask(input: {
  settlerId: string;
  position: number;
  name: string;
  email?: string | null;
  lemonOrderId?: string | null;
  shipping?: ShippingAddress | null;
}): Promise<{ id: string; already: boolean }> {
  const ship = input.shipping ?? {};

  if (!isSupabaseConfigured()) {
    const existing = memoryFulfillment().find(
      (row) =>
        row.settler_id === input.settlerId ||
        (input.lemonOrderId && row.lemon_order_id === input.lemonOrderId),
    );
    if (existing) return { id: existing.id, already: true };
    const id = randomUUID();
    memoryFulfillment().push({
      id,
      settler_id: input.settlerId,
      position: input.position,
      name: input.name,
      email: input.email ?? null,
      shipping_name: ship.name ?? null,
      shipping_line1: ship.line1 ?? null,
      shipping_line2: ship.line2 ?? null,
      shipping_city: ship.city ?? null,
      shipping_region: ship.region ?? null,
      shipping_postal: ship.postal ?? null,
      shipping_country: ship.country ?? null,
      lemon_order_id: input.lemonOrderId ?? null,
      artifacts: DEFAULT_ARTIFACTS,
      created_at: new Date().toISOString(),
      status: "queued",
    });
    return { id, already: false };
  }

  const db = getServiceClient();
  if (input.lemonOrderId) {
    const { data: prior } = await db
      .from("fulfillment_tasks")
      .select("id")
      .eq("lemon_order_id", input.lemonOrderId)
      .maybeSingle();
    if (prior?.id) return { id: String(prior.id), already: true };
  }

  const id = randomUUID();
  const { error } = await db.from("fulfillment_tasks").insert({
    id,
    settler_id: input.settlerId,
    position: input.position,
    name: input.name,
    email: input.email ?? null,
    shipping_name: ship.name ?? null,
    shipping_line1: ship.line1 ?? null,
    shipping_line2: ship.line2 ?? null,
    shipping_city: ship.city ?? null,
    shipping_region: ship.region ?? null,
    shipping_postal: ship.postal ?? null,
    shipping_country: ship.country ?? null,
    lemon_order_id: input.lemonOrderId ?? null,
    artifacts: DEFAULT_ARTIFACTS,
    status: "queued",
  });
  if (error) {
    if (error.code === "23505") return { id, already: true };
    throw error;
  }
  return { id, already: false };
}

export async function listFulfillmentQueue(): Promise<MemoryFulfillment[]> {
  if (!isSupabaseConfigured()) return [...memoryFulfillment()];
  const db = getServiceClient();
  const { data, error } = await db
    .from("fulfillment_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    settler_id: String(row.settler_id),
    position: Number(row.position),
    name: String(row.name),
    email: row.email != null ? String(row.email) : null,
    shipping_name: row.shipping_name != null ? String(row.shipping_name) : null,
    shipping_line1: row.shipping_line1 != null ? String(row.shipping_line1) : null,
    shipping_line2: row.shipping_line2 != null ? String(row.shipping_line2) : null,
    shipping_city: row.shipping_city != null ? String(row.shipping_city) : null,
    shipping_region: row.shipping_region != null ? String(row.shipping_region) : null,
    shipping_postal: row.shipping_postal != null ? String(row.shipping_postal) : null,
    shipping_country: row.shipping_country != null ? String(row.shipping_country) : null,
    lemon_order_id: row.lemon_order_id != null ? String(row.lemon_order_id) : null,
    artifacts: String(row.artifacts ?? DEFAULT_ARTIFACTS),
    created_at: String(row.created_at),
    status: (row.status as MemoryFulfillment["status"]) || "queued",
  }));
}

export function formatShippingAddress(ship: ShippingAddress | null | undefined): string {
  if (!ship) return "";
  const lines = [
    ship.name,
    ship.line1,
    ship.line2,
    [ship.city, ship.region, ship.postal].filter(Boolean).join(", "),
    ship.country,
  ]
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean);
  return lines.join("\n");
}

export async function listFoundersRoster(): Promise<PublicFounderSeat[]> {
  let rows: FounderRecord[] = [];
  if (!isSupabaseConfigured()) {
    rows = [...memoryFounders()];
  } else {
    const db = getServiceClient();
    const { data, error } = await db.from("founders").select("*").order("position", { ascending: true });
    if (error) throw error;
    rows = (data ?? []).map((row) => mapFounderRow(row as Record<string, unknown>));
  }
  const byPosition = new Map(rows.map((row) => [row.position, row]));
  const seats: PublicFounderSeat[] = [];
  for (let position = 1; position <= FOUNDERS_CAP; position += 1) {
    const row = byPosition.get(position);
    if (!row) {
      seats.push({
        position,
        vacant: true,
        displayName: foundersPageCopy.vacant,
        inductedSol: null,
      });
      continue;
    }
    seats.push({
      position,
      vacant: false,
      displayName: row.show_name ? row.name : foundersPageCopy.anonymous,
      inductedSol: row.inducted_sol,
    });
  }
  return seats;
}

export async function getFirstTransmissionBody(settlerId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    const rows = memoryTransmissions()
      .filter((row) => row.settler_id === settlerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return rows[0]?.body ?? null;
  }
  const db = getServiceClient();
  const { data } = await db
    .from("transmissions")
    .select("body")
    .eq("settler_id", settlerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.body != null ? String(data.body) : null;
}

export async function getSettlerArrivalSol(settlerId: string): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    const ownerId = memoryByLabel().get(settlerId);
    const row = ownerId ? memoryByOwner().get(ownerId) : null;
    return row?.sol_of_arrival ?? null;
  }
  const db = getServiceClient();
  const { data } = await db.from("settlers").select("sol_of_arrival").eq("settler_id", settlerId).maybeSingle();
  return data?.sol_of_arrival != null ? Number(data.sol_of_arrival) : null;
}

export async function foundersRemaining(): Promise<number> {
  const inducted = await countFoundersInducted();
  return Math.max(0, FOUNDERS_CAP - inducted);
}
