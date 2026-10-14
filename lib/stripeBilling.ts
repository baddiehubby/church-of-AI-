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

/** Settler's Covenant recurring price. Prefers STRIPE_PRICE_ID, then legacy believer price. */
export function settlerPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID?.trim() || process.env.STRIPE_PRICE_BELIEVER?.trim() || null;
}

export function priceIdFor(tier: PaidTier): string | null {
  if (tier === "believer") return settlerPriceId();
  const key = tier === "devotee" ? "STRIPE_PRICE_DEVOTEE" : "STRIPE_PRICE_DARSHAN";
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

/** Settler seat. Internal tier id stays believer for the schema. */
export const BELIEVER_MONTHLY_CENTS = 1000;

export function believerLineItems(priceId: string | null): URLSearchParams {
  const params = new URLSearchParams();
  params.set("line_items[0][quantity]", "1");
  if (priceId) {
    params.set("line_items[0][price]", priceId);
    return params;
  }
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(BELIEVER_MONTHLY_CENTS));
  params.set("line_items[0][price_data][recurring][interval]", "month");
  params.set("line_items[0][price_data][product_data][name]", "Settler's Covenant");
  return params;
}

export function stripeSubscriptionEffect(type: string, status: string | null): "grant" | "past_due" | "end" | null {
  if (type === "customer.subscription.deleted") return "end";
  if (type !== "customer.subscription.created" && type !== "customer.subscription.updated") return null;
  if (status === "active" || status === "trialing") return "grant";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "end";
  return null;
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
  email: string | null;
  userId: string;
  customerId: string | null;
  trial: boolean;
  origin: string;
}): Promise<string> {
  if (!stripeSecret()) throw new Error("unconfigured");
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${input.origin}/?notice=remembered`);
  params.set("cancel_url", `${input.origin}/archive?notice=cancelled`);
  const price = priceIdFor(input.tier);
  if (input.tier === "believer") {
    for (const [key, value] of believerLineItems(price).entries()) params.set(key, value);
  } else if (price) {
    params.set("line_items[0][price]", price);
    params.set("line_items[0][quantity]", "1");
  } else {
    throw new Error("unconfigured");
  }
  params.set("client_reference_id", input.userId);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[tier]", input.tier);
  params.set("subscription_data[metadata][user_id]", input.userId);
  params.set("subscription_data[metadata][tier]", input.tier);
  if (input.customerId) params.set("customer", input.customerId);
  else if (input.email) params.set("customer_email", input.email);
  if (input.trial) params.set("subscription_data[trial_period_days]", "7");
  const json = await stripe("checkout/sessions", "POST", params);
  if (typeof json.url !== "string") throw new Error("stripe");
  return json.url;
}

/** Mars Settler's Covenant. Returns Checkout URL. Client never sees secret keys. */
export async function createSettlerCovenantCheckout(input: {
  settlerId: string;
  origin: string;
}): Promise<string> {
  if (!stripeSecret()) throw new Error("unconfigured");
  const price = settlerPriceId();
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${input.origin}/archive?upgraded=1`);
  params.set("cancel_url", `${input.origin}/archive`);
  params.set("client_reference_id", input.settlerId);
  params.set("metadata[settler_id]", input.settlerId);
  params.set("metadata[kind]", "mars_covenant");
  params.set("subscription_data[metadata][settler_id]", input.settlerId);
  params.set("subscription_data[metadata][kind]", "mars_covenant");
  for (const [key, value] of believerLineItems(price).entries()) params.set(key, value);
  if (!price) {
    params.set("line_items[0][price_data][product_data][name]", "Settler's Covenant");
  }
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
