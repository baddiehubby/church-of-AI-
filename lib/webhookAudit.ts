// Assumptions: one webhook_events row per request, written before the route returns. Rows never contain the raw
// body, wish text, names, emails, or the private visa link token; `reference` is a petition id or a public
// certificate number, and detail is a short code. A failed audit insert is logged and sent to Sentry but never
// throws, never blocks fulfilment, and never changes the status code.

import "server-only";

import { logger } from "@/lib/logger";
import { captureError } from "@/lib/monitor";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type WebhookOutcome =
  | "issued"
  | "duplicate"
  | "granted"
  | "revoked"
  | "ignored_event"
  | "not_paid"
  | "bad_signature"
  | "invalid_payload"
  | "db_error";

export type WebhookKind = "visa" | "certificate" | "premium" | "seat" | "mars";

export type WebhookAuditRow = {
  event_name: string | null;
  lemon_order_id: string | null;
  kind: WebhookKind | null;
  reference: string | null;
  signature_valid: boolean;
  outcome: WebhookOutcome;
  detail: string | null;
};

function clip(value: string | null, max: number): string | null {
  return value === null ? null : value.slice(0, max);
}

export async function recordWebhookEvent(row: WebhookAuditRow): Promise<void> {
  const safe = {
    event_name: clip(row.event_name, 64),
    lemon_order_id: clip(row.lemon_order_id, 64),
    kind: row.kind,
    reference: clip(row.reference, 24),
    signature_valid: row.signature_valid,
    outcome: row.outcome,
    detail: clip(row.detail, 64),
  };
  if (!isSupabaseConfigured()) {
    logger.warn("webhook audit skipped: supabase not configured", { outcome: row.outcome, kind: row.kind });
    return;
  }
  try {
    const { error } = await getServiceClient().from("webhook_events").insert(safe);
    if (error) throw new Error(`webhook_events insert failed: ${error.code}`);
  } catch (error) {
    logger.error("webhook audit insert failed", { outcome: row.outcome, orderId: safe.lemon_order_id });
    captureError(error, { order_id: safe.lemon_order_id ?? undefined });
  }
}
