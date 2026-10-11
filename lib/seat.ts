// Pilgrim: one pooja on the local day, no episode. Believer and above: the day does not close, the episode opens.

import type { Tier } from "@/lib/tiers";
import { atLeast } from "@/lib/tiers";
import { localYmd } from "@/lib/time";

export function alreadySatToday(lastPoojaAt: string | null, now: Date, timeZone: string): boolean {
  if (!lastPoojaAt) return false;
  const when = new Date(lastPoojaAt);
  if (Number.isNaN(when.getTime())) return false;
  return localYmd(when, timeZone) === localYmd(now, timeZone);
}

export function canSit(input: { tier: Tier; lastPoojaAt: string | null; now: Date; timeZone: string }): boolean {
  if (atLeast(input.tier, "believer")) return true;
  return !alreadySatToday(input.lastPoojaAt, input.now, input.timeZone);
}

export function episodeAllowed(tier: Tier): boolean {
  return atLeast(tier, "believer");
}
