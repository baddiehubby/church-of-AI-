// Client-safe list of Religion of Mars offering tiers (no server-only imports).

import type { OfferingTier } from "@/content/offerings";

export const MARS_TIERS: readonly OfferingTier[] = [
  "prayer",
  "wall",
  "wish",
  "patron",
  "founder_engraving",
] as const;
