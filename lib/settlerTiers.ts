// Red Path seats. Free wanderer fades. Paid tiers keep the record.

export const SETTLER_TIERS = [
  "wanderer",
  "offering_5",
  "settler_10",
  "covenant_20",
  "practice_monthly",
  "founder_1000",
] as const;

export type SettlerTier = (typeof SETTLER_TIERS)[number];

/** Legacy labels still present in older rows / webhooks. */
const LEGACY: Record<string, SettlerTier> = {
  pilgrim: "wanderer",
  settler: "practice_monthly",
};

export const FOUNDERS_CAP = 108;
export const WANDERER_MEMORY_MS = 7 * 24 * 60 * 60 * 1000;

export function isSettlerTier(value: unknown): value is SettlerTier {
  return typeof value === "string" && (SETTLER_TIERS as readonly string[]).includes(value);
}

/** Normalize DB / legacy labels into the current seat enum. */
export function asSettlerTier(value: unknown): SettlerTier {
  if (typeof value !== "string") return "wanderer";
  if (isSettlerTier(value)) return value;
  return LEGACY[value] ?? "wanderer";
}

export function isWanderer(tier: SettlerTier): boolean {
  return tier === "wanderer";
}

export function hasForecast(tier: SettlerTier): boolean {
  return tier !== "wanderer";
}

export function canPreserve(tier: SettlerTier): boolean {
  return tier !== "wanderer";
}

/** Max preserved rows. null = unlimited. */
export function preserveLimit(tier: SettlerTier): number | null {
  switch (tier) {
    case "wanderer":
      return 0;
    case "offering_5":
      return 7;
    case "settler_10":
      return 30;
    case "covenant_20":
      return 100;
    case "practice_monthly":
    case "founder_1000":
      return null;
  }
}

/** Archive retention. null = keep all (subject to preserve caps for listing paid). */
export function archiveRetentionMs(tier: SettlerTier): number | null {
  return isWanderer(tier) ? WANDERER_MEMORY_MS : null;
}

/** Paid seats that keep the full journal. */
export function keepsFullArchive(tier: SettlerTier): boolean {
  return !isWanderer(tier);
}

/** Soft list cap for paid one-time seats (most recent N). Unlimited for practice/founder. */
export function archiveListCap(tier: SettlerTier): number | null {
  switch (tier) {
    case "wanderer":
      return null;
    case "offering_5":
      return 7;
    case "settler_10":
      return 30;
    case "covenant_20":
      return 100;
    case "practice_monthly":
    case "founder_1000":
      return null;
  }
}

export const PRESERVE_REQUIRES_OFFERING = "preservation requires an offering.";

const TIER_RANK: Record<SettlerTier, number> = {
  wanderer: 0,
  offering_5: 1,
  settler_10: 2,
  covenant_20: 3,
  practice_monthly: 4,
  founder_1000: 5,
};

/** True when next seat is at least as lasting as the current one. */
export function canPromoteTier(current: SettlerTier, next: SettlerTier): boolean {
  return TIER_RANK[next] >= TIER_RANK[current];
}

export function isPaidTier(tier: SettlerTier): boolean {
  return tier !== "wanderer";
}
