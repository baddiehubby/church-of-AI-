// Assumptions: Lemon subscription status strings, mapped without the SDK so the webhook and tests share one rule.
// A failed payment keeps the seat (Lemon retries). Cancelled access lasts until ends_at. Expired drops the seat.

export type LemonSeatEffect = "live" | "past_due" | "ended";

export function lemonSeatEffect(status: string, endsAt: string | null, now = Date.now()): LemonSeatEffect {
  const value = status.trim().toLowerCase();
  if (value === "past_due" || value === "unpaid" || value === "paused") return "past_due";
  if (value === "active" || value === "on_trial") return "live";
  if ((value === "cancelled" || value === "canceled") && endsAt && new Date(endsAt).getTime() > now) return "live";
  return "ended";
}
