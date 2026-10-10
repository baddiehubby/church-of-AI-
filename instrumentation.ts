// Assumptions: Next.js instrumentation hook. Sentry loads only when SENTRY_DSN is set; onRequestError forwards
// server render/route errors, and the scrubber strips request data before anything is sent.

import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (!process.env.SENTRY_DSN?.trim()) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

export const onRequestError = Sentry.captureRequestError;
