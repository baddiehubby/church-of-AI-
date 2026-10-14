// Client entitlement after a Lemon offering. Baba ji receives; the browser remembers the seat.

import type { OfferingTier } from "@/content/offerings";

const KEY = "sp-mars-entitlement";

export type MarsEntitlement = {
  tier: OfferingTier;
  blessingId: string;
  habitatId: string;
  issuedAt: number;
  /** Paid one-time offerings keep a local confirmation marker. */
  archiveForever: boolean;
  archiveUntil: number | null;
  unlimitedDaily: boolean;
};

function fromTier(tier: OfferingTier, blessingId: string, habitatId: string, issuedAt: number): MarsEntitlement {
  const forever =
    tier === "prayer" ||
    tier === "wall" ||
    tier === "wish" ||
    tier === "patron" ||
    tier === "founder_engraving";
  return {
    tier,
    blessingId,
    habitatId,
    issuedAt,
    archiveForever: forever,
    archiveUntil: null,
    unlimitedDaily: tier === "patron" || tier === "founder_engraving",
  };
}

export function rememberMarsEntitlement(input: {
  tier: OfferingTier;
  blessingId: string;
  habitatId: string;
  issuedAt?: number;
}): MarsEntitlement {
  const next = fromTier(input.tier, input.blessingId, input.habitatId, input.issuedAt ?? Date.now());
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export function loadMarsEntitlement(now = Date.now()): MarsEntitlement | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarsEntitlement>;
    if (!parsed || typeof parsed.tier !== "string" || typeof parsed.blessingId !== "string") return null;
    return fromTier(
      parsed.tier as OfferingTier,
      parsed.blessingId,
      String(parsed.habitatId ?? ""),
      Number(parsed.issuedAt) || now,
    );
  } catch {
    return null;
  }
}

export function archiveKeepsForever(entitlement: MarsEntitlement | null, _now = Date.now()): boolean {
  return Boolean(entitlement?.archiveForever);
}

export function dailyTransmissionsUnlimited(entitlement: MarsEntitlement | null, _now = Date.now()): boolean {
  return Boolean(entitlement?.unlimitedDaily);
}
