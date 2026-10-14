// Religion of Mars offering tiers. Prices live on Lemon variants. Client never sends an amount.

import { offeringTiers, type OfferingTier } from "@/content/offerings";

export type { OfferingTier };

export const MARS_TIERS: readonly OfferingTier[] = [
  "prayer",
  "wall",
  "wish",
  "patron",
  "founder_engraving",
] as const;

export const MARS_AMOUNT_CENTS: Record<OfferingTier, number> = {
  prayer: offeringTiers.prayer.amountCents,
  wall: offeringTiers.wall.amountCents,
  wish: offeringTiers.wish.amountCents,
  patron: offeringTiers.patron.amountCents,
  founder_engraving: offeringTiers.founder_engraving.amountCents,
};

export function isOfferingTier(value: unknown): value is OfferingTier {
  return typeof value === "string" && (MARS_TIERS as readonly string[]).includes(value);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function habitatIdFromSoul(soulId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < soulId.length; index += 1) {
    hash ^= soulId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let out = "HAB-";
  let n = hash >>> 0;
  for (let i = 0; i < 4; i += 1) {
    out += ALPHABET[n % ALPHABET.length] ?? "A";
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}

/** Preferred env keys for the five Religion of Mars products. */
export function marsVariantEnv(tier: OfferingTier): string {
  const map: Record<OfferingTier, string> = {
    prayer: "LEMON_SQUEEZY_VARIANT_ID_PRAYER_10",
    wall: "LEMON_SQUEEZY_VARIANT_ID_WALL_20",
    wish: "LEMON_SQUEEZY_VARIANT_ID_WISH_25",
    patron: "LEMON_SQUEEZY_VARIANT_ID_PATRON_50",
    founder_engraving: "LEMON_SQUEEZY_VARIANT_ID_FOUNDER_ENGRAVING_1000",
  };
  return map[tier];
}

/** Legacy env names still accepted so older .env files keep working when remapped. */
const LEGACY_MARS_VARIANT_ENV: Partial<Record<OfferingTier, string[]>> = {
  prayer: ["LEMON_SQUEEZY_SETTLERS_MARK_VARIANT_ID"],
  wall: ["LEMON_SQUEEZY_DEEPER_VARIANT_ID"],
  patron: ["LEMON_SQUEEZY_PATRON_VARIANT_ID"],
  founder_engraving: ["LEMON_SQUEEZY_FOUNDER_ENGRAVING_VARIANT_ID"],
};

export function marsVariantId(tier: OfferingTier): string | null {
  const preferred = process.env[marsVariantEnv(tier)]?.trim();
  if (preferred) return preferred;
  for (const key of LEGACY_MARS_VARIANT_ENV[tier] ?? []) {
    const legacy = process.env[key]?.trim();
    if (legacy) return legacy;
  }
  return null;
}

export function marsConfigMissing(tier: OfferingTier): string[] {
  const missing: string[] = [];
  if (!process.env.LEMON_SQUEEZY_API_KEY?.trim()) missing.push("LEMON_SQUEEZY_API_KEY");
  if (!process.env.LEMON_SQUEEZY_STORE_ID?.trim()) missing.push("LEMON_SQUEEZY_STORE_ID");
  if (!marsVariantId(tier)) missing.push(marsVariantEnv(tier));
  return missing;
}

export function marsDeskReady(tier: OfferingTier): boolean {
  return marsConfigMissing(tier).length === 0;
}

/** Names that fail moderation stay held — never auto-published. */
const HELD_NAME_PATTERN =
  /\b(admin|moderator|fuck|shit|nazi|http|www\.|\.com|script|select|drop)\b/i;

export type NameModeration = { ok: true } | { ok: false; reason: "blocked" };

export function moderatePublicName(name: string): NameModeration {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "blocked" };
  if (HELD_NAME_PATTERN.test(trimmed)) return { ok: false, reason: "blocked" };
  return { ok: true };
}
