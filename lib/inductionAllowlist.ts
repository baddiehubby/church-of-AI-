// Explicit server-side allowlist for induction checkout. No installments configured.

import type { CheckoutTier } from "@/lib/redPathOfferings";

/** Only this tier opens induction checkout. Installments are not configured. */
export const INDUCTION_ALLOWED_TIERS = ["founder_1000"] as const;
export type InductionAllowedTier = (typeof INDUCTION_ALLOWED_TIERS)[number];

export function isAllowedInductionTier(value: unknown): value is InductionAllowedTier {
  return typeof value === "string" && (INDUCTION_ALLOWED_TIERS as readonly string[]).includes(value);
}

export function inductionInstallmentsConfigured(): boolean {
  // No Lemon installment / payment-plan variant is wired for induction.
  return false;
}

export function assertCheckoutTierAllowed(tier: CheckoutTier): boolean {
  // Shared offering route still accepts all Red Path tiers; induction UI only offers founder_1000.
  void tier;
  return true;
}
