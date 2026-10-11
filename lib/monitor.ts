// Assumptions: the only identifiers ever attached to a Sentry event are the beforeSend allowlist
// (petition_id, soul_id, reference_id, order_id, tier, event_name, amount_cents). Safe when Sentry
// is not initialised (no-op). Never pass request bodies, wish text, names, or emails.

import * as Sentry from "@sentry/nextjs";

export type MonitorIds = {
  petition_id?: string;
  soul_id?: string;
  reference_id?: string;
  order_id?: string;
  tier?: string;
  event_name?: string;
  amount_cents?: number;
};

export function captureError(error: unknown, ids: MonitorIds = {}): void {
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(ids)) {
      if (typeof value === "string" && value) scope.setTag(key, value);
      if (typeof value === "number" && Number.isFinite(value)) scope.setTag(key, String(value));
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}
