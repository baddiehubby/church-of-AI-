/** Public shape for induction payment plans. Safe for client components. */
export type PublicInductionPlan = {
  tier: "founder_1000";
  label: string;
  amountCents: number;
  currency: "USD";
  kind: "one_time";
  available: boolean;
};

/** Reject client-supplied price or payment status — never trust the browser. */
export function clientTriedToSetPriceOrStatus(payload: Record<string, unknown>): boolean {
  const forbidden = [
    "amount",
    "amount_cents",
    "amountCents",
    "price",
    "price_cents",
    "total",
    "status",
    "payment_status",
    "paid",
  ] as const;
  return forbidden.some((key) => key in payload);
}
