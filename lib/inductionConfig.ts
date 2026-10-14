// Induction Lemon readiness. Names only — never return secret values.

import "server-only";

import { redPathVariantId } from "@/lib/redPathOfferings";

export type InductionConfigStatus = {
  ready: boolean;
  /** Env var NAMES that are empty or unset. Never includes values. */
  missing: string[];
};

/**
 * Trace: checkoutReady requires API key + store id + induction variant.
 * When any are missing, the payment form used to be hidden entirely.
 */
export function getInductionConfigStatus(): InductionConfigStatus {
  const missing: string[] = [];
  if (!process.env.LEMON_SQUEEZY_API_KEY?.trim()) missing.push("LEMON_SQUEEZY_API_KEY");
  if (!process.env.LEMON_SQUEEZY_STORE_ID?.trim()) missing.push("LEMON_SQUEEZY_STORE_ID");
  if (!redPathVariantId("founder_1000")) {
    missing.push("LEMON_SQUEEZY_VARIANT_ID_INDUCTION");
  }
  return { ready: missing.length === 0, missing };
}
