// Assumptions: one option set for server, edge, and client. With no DSN, Sentry is disabled (a no-op) and the
// build still passes. No PII: sendDefaultPii off, and every event/breadcrumb passes through the scrubber.

import { scrubBreadcrumb, scrubEvent } from "@/lib/sentryScrub";

export function sentryOptions(dsn: string | undefined) {
  const value = dsn?.trim() || undefined;
  return {
    dsn: value,
    enabled: Boolean(value),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: <E extends object>(event: E): E => scrubEvent(event),
    beforeBreadcrumb: <B extends object>(crumb: B): B => scrubBreadcrumb(crumb),
  };
}
