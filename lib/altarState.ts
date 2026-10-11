import type { Tier } from "@/lib/tiers";

export type AltarState = {
  soulId: string | null;
  tier: Tier;
  streakCurrent: number;
  streakLongest: number;
  lit: boolean;
  quiet: boolean;
  quietFrom: number;
  timezoneSet: boolean;
  signedIn: boolean;
  canAnother: boolean;
  listening: number;
  today: { reflection: string; algo: string; pandit: string } | null;
};
