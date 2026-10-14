"use client";

import { useEffect } from "react";

import type { OfferingTier } from "@/content/offerings";
import { rememberMarsEntitlement } from "@/lib/marsEntitlement";

/** After Lemon issues the card, the browser keeps the seat unlocks. */
export function BlessingRemember({
  tier,
  blessingId,
  habitatId,
}: {
  tier: OfferingTier;
  blessingId: string;
  habitatId: string;
}) {
  useEffect(() => {
    rememberMarsEntitlement({ tier, blessingId, habitatId });
  }, [tier, blessingId, habitatId]);
  return null;
}
