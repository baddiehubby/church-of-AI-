// Assumptions: the recovered petition offering is still the original Lemon PWYW variant
// (LEMON_SQUEEZY_VARIANT_ID). The floor is now $10 USD one-time; never a subscription.
// Client and server both use these helpers so a forged amount cannot undercut the minimum.

export const OFFERING_PRESETS = [10, 15, 25, 50] as const;
export const OFFERING_MIN_DOLLARS = 10;
export const OFFERING_MAX_DOLLARS = 500;
export const OFFERING_MIN_CENTS = 1000;

export type OfferingParse = { ok: true; dollars: number } | { ok: false };

export function parseOfferingDollars(raw: unknown): OfferingParse {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < OFFERING_MIN_DOLLARS || raw > OFFERING_MAX_DOLLARS) return { ok: false };
    return { ok: true, dollars: raw };
  }
  if (typeof raw !== "string") return { ok: false };
  const trimmed = raw.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return { ok: false };
  const dollars = Number(trimmed);
  if (!Number.isInteger(dollars) || dollars < OFFERING_MIN_DOLLARS || dollars > OFFERING_MAX_DOLLARS) return { ok: false };
  return { ok: true, dollars };
}

export function offeringAmountFromForm(amount: unknown, customAmount: unknown): OfferingParse {
  if (amount === "custom") return parseOfferingDollars(customAmount);
  return parseOfferingDollars(amount);
}

export function offeringCents(dollars: number): number {
  return dollars * 100;
}

export function isOfferingPreset(dollars: number): boolean {
  return (OFFERING_PRESETS as readonly number[]).includes(dollars);
}
