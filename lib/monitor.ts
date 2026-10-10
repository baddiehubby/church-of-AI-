// Assumptions: the only identifiers ever attached to a Sentry event are petition_id, certificate_no, and order_id
// (as tags). The private visa reference link token is never sent. Safe when Sentry is not initialised (no-op).
// Never pass request bodies, wish text, names, or emails.

import * as Sentry from "@sentry/nextjs";

export type MonitorIds = { petition_id?: string; certificate_no?: string; order_id?: string; subscription_id?: string };

export function captureError(error: unknown, ids: MonitorIds = {}): void {
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(ids)) {
      if (typeof value === "string" && value) scope.setTag(key, value);
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}
