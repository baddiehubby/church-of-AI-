// Assumptions: the visa desk primary CTA is always a $10 one-time blessing on the
// offering/certificate variant (LEMON_SQUEEZY_VARIANT_ID), never Premium. The visa
// variant is optional and secondary. Pure module so tests do not need env or the SDK.

import { CHECKOUT_VARIANT_ENV, type CheckoutKind } from "@/lib/checkoutKinds";
import { OFFERING_MIN_CENTS, OFFERING_MIN_DOLLARS, parseOfferingDollars } from "@/lib/offering";

export const BLESSING_DOLLARS = OFFERING_MIN_DOLLARS;
export const BLESSING_CENTS = OFFERING_MIN_CENTS;

export type VisaDeskIntent = "blessing" | "visa";

export function blessingCheckoutKind(): CheckoutKind {
  return "certificate";
}

export function blessingVariantEnv(): (typeof CHECKOUT_VARIANT_ENV)["certificate"] {
  return CHECKOUT_VARIANT_ENV.certificate;
}

export function parseBlessingDollars(raw: unknown): { ok: true; dollars: number; cents: number } | { ok: false } {
  const parsed = parseOfferingDollars(raw);
  if (!parsed.ok) return { ok: false };
  return { ok: true, dollars: parsed.dollars, cents: parsed.dollars * 100 };
}

export function resolveVisaSubmitIntent(intent: unknown, visaConfigured: boolean): VisaDeskIntent {
  if (intent === "visa" && visaConfigured) return "visa";
  return "blessing";
}

export function blessingCheckoutAvailable(offeringConfigured: boolean): boolean {
  return offeringConfigured;
}
