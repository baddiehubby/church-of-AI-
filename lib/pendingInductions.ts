// Pending induction intents. Never grants membership — webhook does.

import "server-only";

import { randomUUID } from "node:crypto";

import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ShippingAddress } from "@/lib/transmissionsStore";

export type PendingInduction = {
  id: string;
  settler_id: string;
  name: string;
  show_name: boolean;
  email: string | null;
  shipping: ShippingAddress;
  lemon_checkout_id: string | null;
  status: "pending" | "paid" | "failed" | "cancelled";
  lemon_order_id: string | null;
  error: string | null;
  created_at: string;
};

type MemoryRoot = { rows: PendingInduction[] };
const g = globalThis as typeof globalThis & { __pendingInductions?: MemoryRoot };

function memory(): PendingInduction[] {
  if (!g.__pendingInductions) g.__pendingInductions = { rows: [] };
  return g.__pendingInductions.rows;
}

export function resetPendingInductionMemory(): void {
  memory().length = 0;
}

export async function createPendingInduction(input: {
  settlerId: string;
  name: string;
  showName: boolean;
  email?: string | null;
  shipping?: ShippingAddress | null;
}): Promise<PendingInduction> {
  const ship = input.shipping ?? {};
  const row: PendingInduction = {
    id: randomUUID(),
    settler_id: input.settlerId.trim().toUpperCase(),
    name: input.name.trim().slice(0, 80) || "settler",
    show_name: Boolean(input.showName),
    email: input.email?.trim() || null,
    shipping: {
      name: ship.name ?? null,
      line1: ship.line1 ?? null,
      line2: ship.line2 ?? null,
      city: ship.city ?? null,
      region: ship.region ?? null,
      postal: ship.postal ?? null,
      country: ship.country ?? null,
    },
    lemon_checkout_id: null,
    status: "pending",
    lemon_order_id: null,
    error: null,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    memory().push(row);
    return row;
  }

  const db = getServiceClient();
  const { error } = await db.from("pending_inductions").insert({
    id: row.id,
    settler_id: row.settler_id,
    name: row.name,
    show_name: row.show_name,
    email: row.email,
    shipping_name: row.shipping.name,
    shipping_line1: row.shipping.line1,
    shipping_line2: row.shipping.line2,
    shipping_city: row.shipping.city,
    shipping_region: row.shipping.region,
    shipping_postal: row.shipping.postal,
    shipping_country: row.shipping.country,
    status: "pending",
  });
  if (error) throw error;
  return row;
}

export async function markPendingInductionPaid(input: {
  settlerId: string;
  lemonOrderId: string;
}): Promise<void> {
  const settlerId = input.settlerId.trim().toUpperCase();
  const orderId = input.lemonOrderId.trim();
  if (!settlerId || !orderId) return;

  if (!isSupabaseConfigured()) {
    const open = [...memory()]
      .filter((row) => row.settler_id === settlerId && row.status === "pending")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (open) {
      open.status = "paid";
      open.lemon_order_id = orderId;
    }
    return;
  }

  const db = getServiceClient();
  const { data } = await db
    .from("pending_inductions")
    .select("id")
    .eq("settler_id", settlerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return;
  await db
    .from("pending_inductions")
    .update({
      status: "paid",
      lemon_order_id: orderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);
}

export async function markPendingInductionFailed(input: {
  settlerId: string;
  error?: string;
}): Promise<void> {
  const settlerId = input.settlerId.trim().toUpperCase();
  if (!isSupabaseConfigured()) {
    const open = [...memory()]
      .filter((row) => row.settler_id === settlerId && row.status === "pending")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (open) {
      open.status = "failed";
      open.error = input.error ?? "checkout_failed";
    }
    return;
  }
  const db = getServiceClient();
  const { data } = await db
    .from("pending_inductions")
    .select("id")
    .eq("settler_id", settlerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return;
  await db
    .from("pending_inductions")
    .update({
      status: "failed",
      error: input.error ?? "checkout_failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);
}

export async function latestPendingForSettler(settlerId: string): Promise<PendingInduction | null> {
  const id = settlerId.trim().toUpperCase();
  if (!id) return null;
  if (!isSupabaseConfigured()) {
    return (
      [...memory()]
        .filter((row) => row.settler_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    );
  }
  const db = getServiceClient();
  const { data } = await db
    .from("pending_inductions")
    .select("*")
    .eq("settler_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    settler_id: String(data.settler_id),
    name: String(data.name),
    show_name: Boolean(data.show_name),
    email: data.email != null ? String(data.email) : null,
    shipping: {
      name: data.shipping_name != null ? String(data.shipping_name) : null,
      line1: data.shipping_line1 != null ? String(data.shipping_line1) : null,
      line2: data.shipping_line2 != null ? String(data.shipping_line2) : null,
      city: data.shipping_city != null ? String(data.shipping_city) : null,
      region: data.shipping_region != null ? String(data.shipping_region) : null,
      postal: data.shipping_postal != null ? String(data.shipping_postal) : null,
      country: data.shipping_country != null ? String(data.shipping_country) : null,
    },
    lemon_checkout_id: data.lemon_checkout_id != null ? String(data.lemon_checkout_id) : null,
    status: (data.status as PendingInduction["status"]) || "pending",
    lemon_order_id: data.lemon_order_id != null ? String(data.lemon_order_id) : null,
    error: data.error != null ? String(data.error) : null,
    created_at: String(data.created_at),
  };
}
