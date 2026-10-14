// Red Path Lemon products — one-time + Daily Practice subscription.
// Reviewer copy never says AI or donation (except "Not a donation").

export const ONE_TIME_TIERS = ["offering_5", "settler_10", "covenant_20", "founder_1000"] as const;
export type OneTimeTier = (typeof ONE_TIME_TIERS)[number];

/** All tiers that open Lemon checkout (includes subscription). */
export const CHECKOUT_TIERS = [
  "offering_5",
  "settler_10",
  "covenant_20",
  "practice_monthly",
  "founder_1000",
] as const;
export type CheckoutTier = (typeof CHECKOUT_TIERS)[number];

export const REVIEWER_DESCRIPTION =
  "A digital novelty artifact. Satirical fictional project. Instant delivery. Not a donation. Not a charity. Not tax-deductible.";

export const ONE_TIME_AMOUNT_CENTS: Record<OneTimeTier, number> = {
  offering_5: 500,
  settler_10: 1000,
  covenant_20: 2000,
  founder_1000: 100_000,
};

/** Preferred env keys (Prompt 7). Legacy keys still accepted as fallback. */
export const RED_PATH_VARIANT_ENV: Record<CheckoutTier, string> = {
  offering_5: "LEMON_SQUEEZY_VARIANT_ID_OFFERING_5",
  settler_10: "LEMON_SQUEEZY_VARIANT_ID_SETTLER_10",
  covenant_20: "LEMON_SQUEEZY_VARIANT_ID_COVENANT_20",
  practice_monthly: "LEMON_SQUEEZY_VARIANT_ID_PRACTICE_MONTHLY",
  founder_1000: "LEMON_SQUEEZY_VARIANT_ID_INDUCTION",
};

const LEGACY_VARIANT_ENV: Partial<Record<CheckoutTier, string>> = {
  offering_5: "LEMON_SQUEEZY_OFFERING_5_VARIANT_ID",
  settler_10: "LEMON_SQUEEZY_SETTLER_10_VARIANT_ID",
  covenant_20: "LEMON_SQUEEZY_COVENANT_20_VARIANT_ID",
  founder_1000: "LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID",
};

export function isOneTimeTier(value: unknown): value is OneTimeTier {
  return typeof value === "string" && (ONE_TIME_TIERS as readonly string[]).includes(value);
}

export function isCheckoutTier(value: unknown): value is CheckoutTier {
  return typeof value === "string" && (CHECKOUT_TIERS as readonly string[]).includes(value);
}

export function redPathVariantEnv(tier: CheckoutTier): string {
  return RED_PATH_VARIANT_ENV[tier];
}

/** Resolve variant id from preferred env, then legacy name. */
export function redPathVariantId(tier: CheckoutTier): string | null {
  const preferred = process.env[RED_PATH_VARIANT_ENV[tier]]?.trim();
  if (preferred) return preferred;
  const legacyKey = LEGACY_VARIANT_ENV[tier];
  if (legacyKey) {
    const legacy = process.env[legacyKey]?.trim();
    if (legacy) return legacy;
  }
  return null;
}

export function isSubscriptionCheckout(tier: CheckoutTier): boolean {
  return tier === "practice_monthly";
}

/** Dashboard product specs — create these in Lemon Squeezy. */
export const RED_PATH_PRODUCTS: Record<
  CheckoutTier,
  { name: string; priceUsd: number; description: string; inventory?: number; subscription?: boolean }
> = {
  offering_5: {
    name: "The First Offering",
    priceUsd: 5,
    description: REVIEWER_DESCRIPTION,
  },
  settler_10: {
    name: "The Settler's Mark",
    priceUsd: 10,
    description: REVIEWER_DESCRIPTION,
  },
  covenant_20: {
    name: "The Dust Covenant",
    priceUsd: 20,
    description: REVIEWER_DESCRIPTION,
  },
  practice_monthly: {
    name: "The Daily Practice",
    priceUsd: 5,
    description: REVIEWER_DESCRIPTION,
    subscription: true,
  },
  founder_1000: {
    name: "The Induction",
    priceUsd: 1000,
    inventory: 108,
    description: REVIEWER_DESCRIPTION,
  },
};
