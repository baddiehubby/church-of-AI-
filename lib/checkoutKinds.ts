// Assumptions: three Lemon products, three env names. Tip/certificate stays on LEMON_SQUEEZY_VARIANT_ID.
// Visa and Premium never share that variant. Pure module so tests do not need env or the Lemon SDK.

export type CheckoutKind = "certificate" | "visa" | "premium";

export const CHECKOUT_VARIANT_ENV = {
  certificate: "LEMON_SQUEEZY_VARIANT_ID",
  visa: "LEMON_SQUEEZY_VISA_VARIANT_ID",
  premium: "LEMON_SQUEEZY_PREMIUM_VARIANT_ID",
} as const;

export function variantEnvName(kind: CheckoutKind): (typeof CHECKOUT_VARIANT_ENV)[CheckoutKind] {
  return CHECKOUT_VARIANT_ENV[kind];
}

export function grantsPremiumEntitlement(kind: CheckoutKind): boolean {
  return kind === "premium";
}
