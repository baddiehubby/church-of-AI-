// Assumptions: the ladder is pilgrim, believer, devotee, darshan. A higher tier includes the lower rites.
// Urgent petitions are a flag on the record, not a promise that a human reviews them.

export type Tier = "pilgrim" | "believer" | "devotee" | "darshan";

export const TIERS: readonly Tier[] = ["pilgrim", "believer", "devotee", "darshan"];

const RANK: Record<Tier, number> = { pilgrim: 0, believer: 1, devotee: 2, darshan: 3 };

export function isTier(value: unknown): value is Tier {
  return value === "pilgrim" || value === "believer" || value === "devotee" || value === "darshan";
}

export function atLeast(tier: Tier, need: Tier): boolean {
  return RANK[tier] >= RANK[need];
}

export function devTier(): Tier | null {
  if (process.env.NODE_ENV === "production") return null;
  const value = process.env.DEV_TIER?.trim();
  return isTier(value) ? value : null;
}

export function withinWeeklyCap(input: {
  tier: Tier;
  wishesThisWeek: number;
  urgentArmed: boolean;
  urgentUsedThisMonth: number;
}): { ok: boolean; priority: boolean; urgent: boolean } {
  const priority = atLeast(input.tier, "devotee");
  const urgent = input.tier === "darshan" && input.urgentArmed && input.urgentUsedThisMonth < 1;
  if (urgent) return { ok: true, priority: true, urgent: true };
  if (atLeast(input.tier, "believer")) return { ok: true, priority, urgent: false };
  if (input.wishesThisWeek < 1) return { ok: true, priority: false, urgent: false };
  return { ok: false, priority: false, urgent: false };
}
