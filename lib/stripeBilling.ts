// Assumptions: Stripe Billing is the subscription merchant. Lemon Squeezy stays on one-time certificates.
// Price ids come from the dashboard. The client never sends an amount. Darshan checkout stays closed
// until STRIPE_DARSHAN_OPEN=true; the waitlist is the public door.

import "server-only";

import { isRecord } from "@/lib/guards";
import { isTier, type Tier } from "@/lib/tiers";

type PaidTier = Exclude<Tier, "pilgrim">;

export function stripeSecret(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function priceIdFor(tier: PaidTier): string | null {
  const key = tier === "believer" ? "STRIPE_PRICE_BELIEVER" : tier === "devotee" ? "STRIPE_PRICE_DEVOTEE" : "STRIPE_PRICE_DARSHAN";
  return process.env[key]?.trim() || null;
}

export function tierForPrice(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  for (const tier of ["believer", "devotee", "darshan"] as const) {
    if (priceIdFor(tier) === priceId) return tier;
  }
  return null;
}

export function darshanCheckoutOpen(): boolean {
  return process.env.STRIPE_DARSHAN_OPEN?.trim() === "true" && Boolean(priceIdFor("darshan"));
}

export function stripeId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  return null;
}

function priceFromSubscription(obj: Record<string, unknown>): string | null {
  if (!isRecord(obj.items) || !Array.isArray(obj.items.data)) return null;
  const first = obj.items.data[0];
  if (!isRecord(first)) return null;
  if (typeof first.price === "string") return first.price;
  if (isRecord(first.price) && typeof first.price.id === "string") return first.price.id;
  return null;
}

export function subscriptionTier(obj: Record<string, unknown>): Tier | null {
  if (isRecord(obj.metadata) && isTier(obj.metadata.tier)) return obj.metadata.tier;
  return tierForPrice(priceFromSubscription(obj));
}

async function stripe(path: string, method: "GET" | "POST", body?: URLSearchParams): Promise<Record<string, unknown>> {
  const secret = stripeSecret();
  if (!secret) throw new Error("unconfigured");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body,
    signal: AbortSignal.timeout(12_000),
  });
  const json: unknown = await response.json();
  if (!response.ok || !isRecord(json)) throw new Error("stripe");
  return json;
}

export async function createSubscriptionCheckout(input: {
  tier: PaidTier;
  email: string;
  userId: string;
  customerId: string | null;
  trial: boolean;
  origin: string;
}): Promise<string> {
  const price = priceIdFor(input.tier);
  if (!stripeSecret() || !price) throw new Error("unconfigured");
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${input.origin}/account?notice=paid`);
  params.set("cancel_url", `${input.origin}/pricing?notice=cancelled`);
  params.set("line_items[0][price]", price);
  params.set("line_items[0][quantity]", "1");
  params.set("client_reference_id", input.userId);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[tier]", input.tier);
  params.set("subscription_data[metadata][user_id]", input.userId);
  params.set("subscription_data[metadata][tier]", input.tier);
  if (input.customerId) params.set("customer", input.customerId);
  else params.set("customer_email", input.email);
  if (input.trial) params.set("subscription_data[trial_period_days]", "7");
  const json = await stripe("checkout/sessions", "POST", params);
  if (typeof json.url !== "string") throw new Error("stripe");
  return json.url;
}

export async function changeSubscriptionPrice(subscriptionId: string, tier: PaidTier): Promise<void> {
  const price = priceIdFor(tier);
  if (!price) throw new Error("unconfigured");
  const current = await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`, "GET");
  if (!isRecord(current.items) || !Array.isArray(current.items.data) || !isRecord(current.items.data[0]) || typeof current.items.data[0].id !== "string") {
    throw new Error("stripe");
  }
  const params = new URLSearchParams();
  params.set("items[0][id]", current.items.data[0].id);
  params.set("items[0][price]", price);
  params.set("proration_behavior", "create_prorations");
  params.set("metadata[tier]", tier);
  await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`, "POST", params);
}

export async function createPortal(customerId: string, origin: string): Promise<string> {
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("return_url", `${origin}/account`);
  const json = await stripe("billing_portal/sessions", "POST", params);
  if (typeof json.url !== "string") throw new Error("stripe");
  return json.url;
}
