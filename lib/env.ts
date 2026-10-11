// Assumptions: server-side env readers. Existing LEMON_SQUEEZY_* names are kept; LEMON_SQUEEZY_VISA_VARIANT_ID is
// the $10 visa product and LEMON_SQUEEZY_VARIANT_ID stays the petition certificate. Nothing here reaches the client.

import { appUrl as origin, BRAND } from "@/lib/brand";

export function appUrl(): string {
  return origin();
}

export { BRAND };

type LemonBase = { apiKey: string; storeId: string };

function lemonBase(): LemonBase | null {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  if (!apiKey || !storeId) return null;
  return { apiKey, storeId };
}

export function lemonConfig(): (LemonBase & { variantId: string }) | null {
  const base = lemonBase();
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID?.trim();
  return base && variantId ? { ...base, variantId } : null;
}

export function visaLemonConfig(): (LemonBase & { variantId: string }) | null {
  const base = lemonBase();
  const variantId = process.env.LEMON_SQUEEZY_VISA_VARIANT_ID?.trim();
  return base && variantId ? { ...base, variantId } : null;
}

export function premiumLemonConfig(): (LemonBase & { variantId: string }) | null {
  const base = lemonBase();
  const variantId = process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID?.trim();
  return base && variantId ? { ...base, variantId } : null;
}

export type SeatTier = "believer" | "devotee" | "darshan";

const SEAT_VARIANT_ENV: Record<SeatTier, string> = {
  believer: "LEMON_SQUEEZY_BELIEVER_VARIANT_ID",
  devotee: "LEMON_SQUEEZY_DEVOTEE_VARIANT_ID",
  darshan: "LEMON_SQUEEZY_DARSHAN_VARIANT_ID",
};

export function seatVariantId(tier: SeatTier): string | null {
  const specific = process.env[SEAT_VARIANT_ENV[tier]]?.trim();
  if (specific) return specific;
  if (tier === "believer") return process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID?.trim() || null;
  return null;
}

export function seatLemonConfig(tier: SeatTier): (LemonBase & { variantId: string }) | null {
  const base = lemonBase();
  const variantId = seatVariantId(tier);
  return base && variantId ? { ...base, variantId } : null;
}

export function tierForSeatVariant(variantId: string): SeatTier | null {
  const id = variantId.trim();
  if (!id) return null;
  const seats: SeatTier[] = ["darshan", "devotee", "believer"];
  for (const tier of seats) {
    const specific = process.env[SEAT_VARIANT_ENV[tier]]?.trim();
    if (specific && specific === id) return tier;
  }
  const premium = process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID?.trim();
  if (premium && premium === id && !process.env.LEMON_SQUEEZY_BELIEVER_VARIANT_ID?.trim()) return "believer";
  return null;
}

export function lemonApiKey(): string | null {
  return process.env.LEMON_SQUEEZY_API_KEY?.trim() || null;
}

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret || null;
}

export function webhookSecret(): string | null {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  return secret || null;
}
