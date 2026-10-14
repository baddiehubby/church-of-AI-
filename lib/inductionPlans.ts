// Induction payment plans: only what Lemon is actually configured to sell.
// No invented installments. Browser never sees secret keys or raw variant IDs.

import "server-only";

import { getInductionConfigStatus } from "@/lib/inductionConfig";
import { ONE_TIME_AMOUNT_CENTS, type CheckoutTier } from "@/lib/redPathOfferings";

export type { PublicInductionPlan } from "@/lib/inductionPlanTypes";
export { clientTriedToSetPriceOrStatus } from "@/lib/inductionPlanTypes";
import type { PublicInductionPlan } from "@/lib/inductionPlanTypes";

/** Plans the induction page may offer. Empty when Lemon induction variant is missing. */
export function listConfiguredInductionPlans(): PublicInductionPlan[] {
  const available = inductionCheckoutReady();
  if (!available) return [];
  return [
    {
      tier: "founder_1000",
      label: "THE INDUCTION — $1,000 USD ONE-TIME",
      amountCents: ONE_TIME_AMOUNT_CENTS.founder_1000,
      currency: "USD",
      kind: "one_time",
      available: true,
    },
  ];
}

export function inductionCheckoutReady(): boolean {
  return getInductionConfigStatus().ready;
}

export function isInductionTier(tier: CheckoutTier): tier is "founder_1000" {
  return tier === "founder_1000";
}
