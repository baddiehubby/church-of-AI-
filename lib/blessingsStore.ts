// Mars order drafts + issued confirmations. Memory desk when Supabase is unset (local only).

import "server-only";

import { pickBlessing } from "@/content/blessings";
import type { OfferingTier } from "@/content/offerings";
import { habitatIdFromSoul, moderatePublicName } from "@/lib/marsOfferings";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type BlessingRecord = {
  id: string;
  userId: string;
  tier: OfferingTier;
  lemonOrderId: string | null;
  name: string;
  message: string | null;
  blessingText: string;
  habitatId: string;
  sol: number;
  status: "pending" | "issued" | "revoked";
  createdAt: string;
};

export type WallEntry = {
  id: string;
  displayName: string;
  sol: number;
  status: "published" | "held";
  createdAt: string;
};

export type MonumentEntry = {
  id: string;
  displayName: string;
  sol: number;
  status: "published" | "held";
  createdAt: string;
};

type MemoryBag = {
  blessings: Map<string, BlessingRecord>;
  patrons: {
    userId: string;
    name: string;
    displayName: string;
    year: number;
    lemonOrderId: string;
    sol: number;
  }[];
  wall: {
    id: string;
    blessingId: string;
    lemonOrderId: string;
    displayName: string;
    sol: number;
    status: "published" | "held";
    createdAt: string;
  }[];
  monument: {
    id: string;
    blessingId: string;
    lemonOrderId: string;
    displayName: string;
    sol: number;
    status: "published" | "held";
    createdAt: string;
  }[];
  subscriptions: Map<
    string,
    { userId: string; lemonSubscriptionId: string; status: string; cancelledAt: string | null }
  >;
};

function memory(): MemoryBag {
  const g = globalThis as typeof globalThis & { __marsBlessings?: MemoryBag };
  if (!g.__marsBlessings) {
    g.__marsBlessings = {
      blessings: new Map(),
      patrons: [],
      wall: [],
      monument: [],
      subscriptions: new Map(),
    };
  }
  // Hot-reload older bag shapes.
  if (!g.__marsBlessings.wall) g.__marsBlessings.wall = [];
  if (!g.__marsBlessings.monument) g.__marsBlessings.monument = [];
  return g.__marsBlessings;
}

function newId(): string {
  return crypto.randomUUID();
}

function rowFromDb(row: Record<string, unknown>): BlessingRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tier: row.tier as OfferingTier,
    lemonOrderId: typeof row.lemon_order_id === "string" ? row.lemon_order_id : null,
    name: String(row.name),
    message: typeof row.message === "string" ? row.message : null,
    blessingText: String(row.blessing_text),
    habitatId: String(row.habitat_id),
    sol: Number(row.sol) || 1,
    status: (row.status as BlessingRecord["status"]) || "pending",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function createBlessingDraft(input: {
  userId: string;
  tier: OfferingTier;
  name: string;
  sol: number;
  message?: string | null;
}): Promise<BlessingRecord> {
  const habitatId = habitatIdFromSoul(input.userId);
  const blessingText = pickBlessing(`${input.userId}:${input.tier}:${input.sol}`);
  const draft: BlessingRecord = {
    id: newId(),
    userId: input.userId,
    tier: input.tier,
    lemonOrderId: null,
    name: input.name,
    message: input.message?.trim() || null,
    blessingText,
    habitatId,
    sol: input.sol,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("blessings store unavailable");
    memory().blessings.set(draft.id, draft);
    return draft;
  }

  const service = getServiceClient();
  const inserted = await service
    .from("blessings")
    .insert({
      id: draft.id,
      user_id: draft.userId,
      tier: draft.tier,
      name: draft.name,
      message: draft.message,
      blessing_text: draft.blessingText,
      habitat_id: draft.habitatId,
      sol: draft.sol,
      status: "pending",
    })
    .select("*")
    .single();
  if (inserted.error || !inserted.data) throw new Error("blessing draft failed");
  return rowFromDb(inserted.data as Record<string, unknown>);
}

export async function getBlessing(id: string): Promise<BlessingRecord | null> {
  if (!isSupabaseConfigured()) {
    return memory().blessings.get(id) ?? null;
  }
  const service = getServiceClient();
  const found = await service.from("blessings").select("*").eq("id", id).maybeSingle();
  if (found.error || !found.data) return null;
  return rowFromDb(found.data as Record<string, unknown>);
}

export async function issueBlessing(input: {
  blessingId: string;
  lemonOrderId: string;
}): Promise<"issued" | "duplicate" | "missing"> {
  if (!isSupabaseConfigured()) {
    const bag = memory();
    const existing = [...bag.blessings.values()].find((row) => row.lemonOrderId === input.lemonOrderId);
    if (existing) return "duplicate";
    const draft = bag.blessings.get(input.blessingId);
    if (!draft) return "missing";
    bag.blessings.set(input.blessingId, {
      ...draft,
      lemonOrderId: input.lemonOrderId,
      status: "issued",
    });
    return "issued";
  }

  const service = getServiceClient();
  const byOrder = await service.from("blessings").select("id").eq("lemon_order_id", input.lemonOrderId).maybeSingle();
  if (byOrder.data) return "duplicate";
  const updated = await service
    .from("blessings")
    .update({ lemon_order_id: input.lemonOrderId, status: "issued" })
    .eq("id", input.blessingId)
    .eq("status", "pending")
    .select("id");
  if (updated.error) throw new Error("blessing issue failed");
  if (!updated.data?.length) {
    const again = await service.from("blessings").select("id, status").eq("id", input.blessingId).maybeSingle();
    if (!again.data) return "missing";
    if (again.data.status === "issued") return "duplicate";
    return "missing";
  }
  return "issued";
}

export async function countPatrons(year: number): Promise<number> {
  if (!isSupabaseConfigured()) {
    return memory().patrons.filter((row) => row.year === year).length;
  }
  const service = getServiceClient();
  const found = await service.from("patrons").select("id", { count: "exact", head: true }).eq("year", year);
  return found.count ?? 0;
}

export async function listPatrons(year: number): Promise<{ displayName: string; year: number; sol: number }[]> {
  if (!isSupabaseConfigured()) {
    return memory()
      .patrons.filter((row) => row.year === year)
      .sort((a, b) => b.sol - a.sol)
      .map((row) => ({ displayName: row.displayName, year: row.year, sol: row.sol }));
  }
  const service = getServiceClient();
  const found = await service
    .from("patrons")
    .select("display_name, year, sol, created_at")
    .eq("year", year)
    .order("created_at", { ascending: false });
  if (found.error || !found.data) return [];
  return found.data.map((row) => ({
    displayName: String(row.display_name),
    year: Number(row.year),
    sol: Number(row.sol),
  }));
}

export async function addPatron(input: {
  userId: string;
  name: string;
  lemonOrderId: string;
  sol: number;
  year: number;
}): Promise<"added" | "duplicate" | "held"> {
  const mod = moderatePublicName(input.name);
  if (!mod.ok) return "held";

  if (!isSupabaseConfigured()) {
    const bag = memory();
    if (bag.patrons.some((row) => row.lemonOrderId === input.lemonOrderId)) return "duplicate";
    bag.patrons.push({
      userId: input.userId,
      name: input.name,
      displayName: input.name,
      year: input.year,
      lemonOrderId: input.lemonOrderId,
      sol: input.sol,
    });
    return "added";
  }
  const service = getServiceClient();
  const inserted = await service.from("patrons").insert({
    user_id: input.userId,
    name: input.name,
    display_name: input.name,
    year: input.year,
    lemon_order_id: input.lemonOrderId,
    sol: input.sol,
  });
  if (inserted.error?.code === "23505") return "duplicate";
  if (inserted.error) throw new Error("patron insert failed");
  return "added";
}

export async function publishWallName(input: {
  blessingId: string;
  lemonOrderId: string;
  displayName: string;
  sol: number;
}): Promise<"published" | "held" | "duplicate"> {
  const mod = moderatePublicName(input.displayName);
  const status: "published" | "held" = mod.ok ? "published" : "held";
  const id = newId();
  const createdAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const bag = memory();
    if (bag.wall.some((row) => row.lemonOrderId === input.lemonOrderId)) return "duplicate";
    bag.wall.push({
      id,
      blessingId: input.blessingId,
      lemonOrderId: input.lemonOrderId,
      displayName: input.displayName,
      sol: input.sol,
      status,
      createdAt,
    });
    return status === "published" ? "published" : "held";
  }

  const service = getServiceClient();
  const inserted = await service.from("wall_of_mars").insert({
    id,
    blessing_id: input.blessingId,
    lemon_order_id: input.lemonOrderId,
    display_name: input.displayName,
    sol: input.sol,
    status,
  });
  if (inserted.error?.code === "23505") return "duplicate";
  if (inserted.error) throw new Error("wall insert failed");
  return status === "published" ? "published" : "held";
}

export async function listPublishedWall(): Promise<WallEntry[]> {
  if (!isSupabaseConfigured()) {
    return memory()
      .wall.filter((row) => row.status === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({
        id: row.id,
        displayName: row.displayName,
        sol: row.sol,
        status: row.status,
        createdAt: row.createdAt,
      }));
  }
  const service = getServiceClient();
  const found = await service
    .from("wall_of_mars")
    .select("id, display_name, sol, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (found.error || !found.data) return [];
  return found.data.map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name),
    sol: Number(row.sol) || 1,
    status: "published" as const,
    createdAt: String(row.created_at),
  }));
}

export async function publishMonumentName(input: {
  blessingId: string;
  lemonOrderId: string;
  displayName: string;
  sol: number;
}): Promise<"published" | "held" | "duplicate"> {
  const mod = moderatePublicName(input.displayName);
  const status: "published" | "held" = mod.ok ? "published" : "held";
  const id = newId();
  const createdAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const bag = memory();
    if (bag.monument.some((row) => row.lemonOrderId === input.lemonOrderId)) return "duplicate";
    bag.monument.push({
      id,
      blessingId: input.blessingId,
      lemonOrderId: input.lemonOrderId,
      displayName: input.displayName,
      sol: input.sol,
      status,
      createdAt,
    });
    return status === "published" ? "published" : "held";
  }

  const service = getServiceClient();
  const inserted = await service.from("founder_monument").insert({
    id,
    blessing_id: input.blessingId,
    lemon_order_id: input.lemonOrderId,
    display_name: input.displayName,
    sol: input.sol,
    status,
  });
  if (inserted.error?.code === "23505") return "duplicate";
  if (inserted.error) throw new Error("monument insert failed");
  return status === "published" ? "published" : "held";
}

export async function listPublishedMonument(): Promise<MonumentEntry[]> {
  if (!isSupabaseConfigured()) {
    return memory()
      .monument.filter((row) => row.status === "published")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((row) => ({
        id: row.id,
        displayName: row.displayName,
        sol: row.sol,
        status: row.status,
        createdAt: row.createdAt,
      }));
  }
  const service = getServiceClient();
  const found = await service
    .from("founder_monument")
    .select("id, display_name, sol, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (found.error || !found.data) return [];
  return found.data.map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name),
    sol: Number(row.sol) || 1,
    status: "published" as const,
    createdAt: String(row.created_at),
  }));
}

export async function upsertMarsSubscription(input: {
  userId: string;
  lemonSubscriptionId: string;
  status: string;
  cancelledAt?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    memory().subscriptions.set(input.lemonSubscriptionId, {
      userId: input.userId,
      lemonSubscriptionId: input.lemonSubscriptionId,
      status: input.status,
      cancelledAt: input.cancelledAt ?? null,
    });
    return;
  }
  const service = getServiceClient();
  await service.from("mars_subscriptions").upsert(
    {
      user_id: input.userId,
      lemon_subscription_id: input.lemonSubscriptionId,
      status: input.status,
      cancelled_at: input.cancelledAt ?? null,
    },
    { onConflict: "lemon_subscription_id" },
  );
}
