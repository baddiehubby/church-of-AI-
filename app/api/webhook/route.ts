// Assumptions:
// - Raw body is read once with request.text() and verified with the shared HMAC helper before parsing. Missing
//   secret = 500 (misconfiguration; Lemon retries). Bad signature = 401 and only event_name is audited.
// - custom_data.kind "visa" (with reference_id) is the $10 visa wish; anything else is the existing petition
//   certificate (custom_data.petition_id + name).
// - order_created with attributes.status "paid": visa marks the pending row paid (idempotent on the order id and on
//   the row's status); certificate inserts one certificates row (idempotent on lemon_order_id). Other statuses
//   are acknowledged as not_paid. order_refunded revokes a visa wish; certificates have no revoke column, so a
//   certificate refund is acknowledged and audited only. Every other event is ignored with 200.
// - Every request writes one webhook_events row before returning. Logs, audit, and Sentry carry the order id and
//   public ids only, never the raw body, wish, name, email, or private visa link token. No rate limit here.

import { NextResponse } from "next/server";

import { offeringTiers, type OfferingTier } from "@/content/offerings";
import {
  addPatron,
  getBlessing,
  issueBlessing,
  publishMonumentName,
  publishWallName,
  upsertMarsSubscription,
} from "@/lib/blessingsStore";
import { applyLemonSeat } from "@/lib/congregation";
import { sendBlessingEmail, sendCertificateEmail } from "@/lib/email";
import { tierForMarsVariant, tierForSeatVariant, webhookSecret } from "@/lib/env";
import { isRecord } from "@/lib/guards";
import { lemonSeatEffect } from "@/lib/lemonSeat";
import { readLocalCertificate, saveLocalCertificate } from "@/lib/local-petitions";
import { logger } from "@/lib/logger";
import { isOfferingTier } from "@/lib/marsOfferings";
import { captureError } from "@/lib/monitor";
import { getPetition } from "@/lib/petitions";
import { applySubscriptionEvent } from "@/lib/premium";
import { sanitizeName } from "@/lib/sanitizeName";
import { sanitizeWish } from "@/lib/sanitizeWish";
import { isPetitionId } from "@/lib/soul-id";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { isTier } from "@/lib/tiers";
import { applyPaidOrder, applyRefund, isVisaReference, VisaStoreUnavailable } from "@/lib/visaWishes";
import { recordWebhookEvent, type WebhookAuditRow, type WebhookKind } from "@/lib/webhookAudit";
import { verifyWebhookSignature } from "@/lib/webhookSignature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = Record<string, unknown>;
type Base = Pick<WebhookAuditRow, "event_name" | "lemon_order_id" | "kind" | "reference">;

function obj(value: unknown): Json {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function eventNameOnly(raw: string): string | null {
  try {
    const name = obj(obj(JSON.parse(raw) as unknown).meta).event_name;
    return typeof name === "string" ? name : null;
  } catch {
    return null;
  }
}

async function respond(audit: WebhookAuditRow, body: Json, status: number): Promise<Response> {
  await recordWebhookEvent(audit);
  return NextResponse.json(body, { status });
}

async function visaOrder(base: Base, eventName: string, status: string, referenceRaw: string, orderId: string): Promise<Response> {
  const ok = { ...base, signature_valid: true } as const;
  try {
    if (eventName === "order_refunded") {
      const refund = await applyRefund(orderId);
      const audit = { ...ok, reference: refund.certificateNo };
      if (refund.result === "revoked") {
        logger.info("visa wish revoked", { orderId, certificateNo: refund.certificateNo });
        return respond({ ...audit, outcome: "revoked", detail: "refunded" }, { received: true, revoked: true }, 200);
      }
      return respond({ ...audit, outcome: "ignored_event", detail: refund.result === "already" ? "already_refunded" : "unknown_order" }, { received: true }, 200);
    }
    if (status !== "paid") {
      return respond({ ...ok, outcome: "not_paid", detail: `status_${status.replace(/[^a-z_]/gi, "").slice(0, 24) || "missing"}` }, { received: true }, 200);
    }
    if (!isVisaReference(referenceRaw)) return respond({ ...ok, outcome: "invalid_payload", detail: "bad_reference" }, { received: true }, 200);
    const paid = await applyPaidOrder({ referenceId: referenceRaw, orderId });
    const audit = { ...ok, reference: paid.certificateNo };
    if (paid.result === "issued") {
      logger.info("visa wish paid", { orderId, certificateNo: paid.certificateNo });
      return respond({ ...audit, outcome: "issued", detail: paid.detail }, { received: true }, 200);
    }
    if (paid.result === "duplicate") return respond({ ...audit, outcome: "duplicate", detail: paid.detail }, { received: true, duplicate: true }, 200);
    return respond({ ...audit, outcome: "invalid_payload", detail: paid.detail }, { received: true }, 200);
  } catch (error) {
    const detail = error instanceof VisaStoreUnavailable ? "store_unavailable" : "store_error";
    logger.error("visa webhook store failed", { orderId, detail });
    captureError(error, { order_id: orderId, event_name: eventName, reference_id: referenceRaw });
    return respond({ ...ok, outcome: "db_error", detail }, { error: "storage unavailable" }, 500);
  }
}

async function certificateOrder(base: Base, eventName: string, status: string, custom: Json, attributes: Json, orderId: string): Promise<Response> {
  const petitionId = str(custom.petition_id).trim().toUpperCase();
  const ok = { ...base, signature_valid: true, reference: isPetitionId(petitionId) ? petitionId : null } as const;
  if (eventName === "order_refunded") {
    return respond({ ...ok, outcome: "ignored_event", detail: "refund_noted_certificate" }, { received: true }, 200);
  }
  if (status !== "paid") {
    return respond({ ...ok, outcome: "not_paid", detail: `status_${status.replace(/[^a-z_]/gi, "").slice(0, 24) || "missing"}` }, { received: true }, 200);
  }
  if (!isPetitionId(petitionId)) return respond({ ...ok, outcome: "invalid_payload", detail: "bad_petition_id" }, { received: true }, 200);
  const name = sanitizeName(custom.name);
  const certificateName = name.ok ? name.value : null;
  if ("wish" in custom) sanitizeWish(custom.wish);

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logger.error("webhook cannot store: supabase not configured", { orderId });
      return respond({ ...ok, outcome: "db_error", detail: "supabase_unset" }, { error: "storage unavailable" }, 500);
    }
    if (!(await getPetition(petitionId))) return respond({ ...ok, outcome: "invalid_payload", detail: "unknown_petition" }, { received: true }, 200);
    if (readLocalCertificate(petitionId)) return respond({ ...ok, outcome: "duplicate", detail: "local_seen" }, { received: true, duplicate: true }, 200);
    saveLocalCertificate({ petitionId, name: certificateName, lemonOrderId: orderId, issuedAt: new Date().toISOString() });
    return respond({ ...ok, outcome: "issued", detail: "local_memory" }, { received: true }, 200);
  }

  const service = getServiceClient();
  const existing = await service.from("certificates").select("petition_id").eq("lemon_order_id", orderId).maybeSingle();
  if (existing.error) {
    captureError(new Error(`certificate lookup failed: ${existing.error.code}`), { order_id: orderId, petition_id: petitionId, soul_id: petitionId, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: "lookup_failed" }, { error: "storage unavailable" }, 500);
  }
  if (existing.data) return respond({ ...ok, outcome: "duplicate", detail: "order_seen" }, { received: true, duplicate: true }, 200);

  const inserted = await service.from("certificates").insert({ petition_id: petitionId, lemon_order_id: orderId, name: certificateName, tier: "basic" });
  if (inserted.error?.code === "23505") return respond({ ...ok, outcome: "duplicate", detail: "order_constraint" }, { received: true, duplicate: true }, 200);
  if (inserted.error?.code === "23503") return respond({ ...ok, outcome: "invalid_payload", detail: "unknown_petition" }, { received: true }, 200);
  if (inserted.error) {
    captureError(new Error(`certificate insert failed: ${inserted.error.code}`), { order_id: orderId, petition_id: petitionId, soul_id: petitionId, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: `insert_${inserted.error.code ?? "unknown"}` }, { error: "storage unavailable" }, 500);
  }

  const email = str(attributes.user_email).trim();
  const sent = email ? await sendCertificateEmail({ to: email, petitionId }) : false;
  logger.info("certificate issued", { orderId, petitionId });
  return respond({ ...ok, outcome: "issued", detail: sent ? "email_sent" : "email_skipped" }, { received: true }, 200);
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const empty: Base = { event_name: null, lemon_order_id: null, kind: null, reference: null };

  const secret = webhookSecret();
  if (!secret) {
    logger.error("webhook secret not configured");
    return respond({ ...empty, event_name: eventNameOnly(raw), signature_valid: false, outcome: "bad_signature", detail: "secret_unset" }, { error: "not configured" }, 500);
  }
  if (!verifyWebhookSignature(raw, request.headers.get("x-signature"), secret)) {
    return respond({ ...empty, event_name: eventNameOnly(raw), signature_valid: false, outcome: "bad_signature", detail: "hmac_mismatch" }, { error: "invalid signature" }, 401);
  }

  let payload: Json;
  try {
    payload = obj(JSON.parse(raw) as unknown);
  } catch {
    return respond({ ...empty, signature_valid: true, outcome: "invalid_payload", detail: "json_parse" }, { error: "invalid json" }, 400);
  }

  const meta = obj(payload.meta);
  const eventName = str(meta.event_name) || null;
  const custom = obj(meta.custom_data);
  const kind: WebhookKind =
    custom.kind === "visa"
      ? "visa"
      : custom.kind === "premium"
        ? "premium"
        : custom.kind === "seat"
          ? "seat"
          : custom.kind === "mars"
            ? "mars"
            : "certificate";
  const data = obj(payload.data);
  const attributes = obj(data.attributes);
  const orderId = str(data.id).slice(0, 64) || null;
  const base: Base = { event_name: eventName, lemon_order_id: orderId, kind, reference: null };

  const subscriptionEvents = new Set([
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_expired",
    "subscription_paused",
    "subscription_unpaused",
    "subscription_resumed",
    "subscription_payment_success",
    "subscription_payment_failed",
  ]);

  if (kind === "premium" && eventName && subscriptionEvents.has(eventName)) {
    return premiumSubscription(base, eventName, str(custom.profile_id), orderId, attributes);
  }
  if (kind === "seat" && eventName && subscriptionEvents.has(eventName)) {
    return seatSubscription(base, eventName, custom, orderId, attributes);
  }
  if (kind === "mars" && eventName && subscriptionEvents.has(eventName)) {
    return marsSubscription(base, eventName, custom, orderId, attributes);
  }

  if (eventName !== "order_created" && eventName !== "order_refunded") {
    return respond({ ...base, signature_valid: true, outcome: "ignored_event", detail: null }, { received: true, ignored: true }, 200);
  }
  if (!orderId) return respond({ ...base, signature_valid: true, outcome: "invalid_payload", detail: "missing_order_id" }, { error: "missing order id" }, 400);

  const status = str(attributes.status);
  if (kind === "visa") return visaOrder(base, eventName, status, str(custom.reference_id), orderId);
  if (kind === "mars") return marsOrder(base, eventName, status, custom, attributes, orderId);
  if (kind === "premium" || kind === "seat") {
    return respond({ ...base, signature_valid: true, outcome: "ignored_event", detail: `${kind}_order_event` }, { received: true }, 200);
  }
  return certificateOrder(base, eventName, status, custom, attributes, orderId);
}

async function marsOrder(base: Base, eventName: string, status: string, custom: Json, attributes: Json, orderId: string): Promise<Response> {
  const ok = { ...base, signature_valid: true } as const;
  if (eventName === "order_refunded") {
    return respond({ ...ok, outcome: "ignored_event", detail: "refund_noted_mars" }, { received: true }, 200);
  }
  if (status !== "paid") {
    return respond({ ...ok, outcome: "not_paid", detail: `status_${status.replace(/[^a-z_]/gi, "").slice(0, 24) || "missing"}` }, { received: true }, 200);
  }
  const blessingId = str(custom.blessing_id).trim();
  const userId = str(custom.user_id).trim().toUpperCase();
  const tierRaw = str(custom.tier).trim();
  const tier: OfferingTier | null = isOfferingTier(tierRaw) ? tierRaw : tierForMarsVariant(str(attributes.variant_id));
  if (!blessingId || !isPetitionId(userId) || !tier) {
    return respond({ ...ok, outcome: "invalid_payload", detail: "bad_mars_meta" }, { received: true }, 200);
  }
  try {
    const result = await issueBlessing({ blessingId, lemonOrderId: orderId });
    if (result === "missing") return respond({ ...ok, outcome: "invalid_payload", detail: "unknown_blessing" }, { received: true }, 200);
    if (result === "duplicate") return respond({ ...ok, reference: blessingId.slice(0, 24), outcome: "duplicate", detail: "order_seen" }, { received: true, duplicate: true }, 200);

    const blessing = await getBlessing(blessingId);
    const named = sanitizeName(custom.name);
    const displayName = named.ok ? named.value : blessing?.name || "settler";
    const sol = Number(str(custom.sol)) || blessing?.sol || 1;

    // Benefits only after paid + issue. Wall / monument require moderation before public list.
    if (tier === "wall") {
      await publishWallName({
        blessingId,
        lemonOrderId: orderId,
        displayName,
        sol,
      });
    }
    if (tier === "patron") {
      await addPatron({
        userId,
        name: displayName,
        lemonOrderId: orderId,
        sol,
        year: new Date().getFullYear(),
      });
    }
    if (tier === "founder_engraving") {
      await publishMonumentName({
        blessingId,
        lemonOrderId: orderId,
        displayName,
        sol,
      });
    }

    const email = str(attributes.user_email).trim();
    if (blessing && email && offeringTiers[blessing.tier]) {
      await sendBlessingEmail({
        to: email,
        blessingId: blessing.id,
        name: blessing.name,
        habitatId: blessing.habitatId,
        sol: blessing.sol,
        blessingText: blessing.blessingText,
        tierLabel: offeringTiers[blessing.tier].label,
      });
    }
    logger.info("mars offering issued", { orderId, detail: tier });
    return respond({ ...ok, reference: blessingId.slice(0, 24), outcome: "issued", detail: tier }, { received: true }, 200);
  } catch (error) {
    captureError(error, { order_id: orderId, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: "store_error" }, { error: "storage unavailable" }, 500);
  }
}

async function marsSubscription(base: Base, eventName: string, custom: Json, subscriptionId: string | null, attributes: Json): Promise<Response> {
  const ok = { ...base, signature_valid: true } as const;
  if (!subscriptionId) return respond({ ...ok, outcome: "invalid_payload", detail: "missing_subscription_id" }, { error: "missing subscription id" }, 400);
  const userId = str(custom.user_id).trim().toUpperCase();
  if (!isPetitionId(userId)) return respond({ ...ok, outcome: "invalid_payload", detail: "bad_mars_user" }, { received: true }, 200);
  let status = str(attributes.status) || "active";
  if (eventName === "subscription_expired") status = "expired";
  if (eventName === "subscription_payment_failed") status = "past_due";
  if (eventName === "subscription_cancelled") status = "cancelled";
  const cancelledAt = status === "cancelled" || status === "expired" ? new Date().toISOString() : null;
  try {
    await upsertMarsSubscription({ userId, lemonSubscriptionId: subscriptionId, status, cancelledAt });
    await applyLemonSeat({
      userId,
      subscriptionId,
      tier: "believer",
      status: status === "cancelled" ? "cancelled" : status === "expired" ? "expired" : status === "past_due" ? "past_due" : "active",
      endsAt: str(attributes.ends_at) || str(attributes.renews_at) || null,
    });
    logger.info("mars covenant", { orderId: subscriptionId, detail: status });
    return respond({ ...ok, reference: userId, outcome: status === "expired" ? "revoked" : "granted", detail: status }, { received: true }, 200);
  } catch (error) {
    captureError(error, { order_id: subscriptionId, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: "store_error" }, { error: "storage unavailable" }, 500);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32 = /^[0-9a-f]{32}$/i;

async function premiumSubscription(base: Base, eventName: string, profileRaw: string, subscriptionId: string | null, attributes: Json): Promise<Response> {
  const ok = { ...base, signature_valid: true } as const;
  if (!subscriptionId) return respond({ ...ok, outcome: "invalid_payload", detail: "missing_subscription_id" }, { error: "missing subscription id" }, 400);
  const profileId = profileRaw.trim();
  if (!UUID.test(profileId) && !HEX32.test(profileId)) {
    return respond({ ...ok, outcome: "invalid_payload", detail: "bad_profile" }, { received: true }, 200);
  }
  const lemonStatus = eventName === "subscription_expired" ? "expired" : eventName === "subscription_cancelled" ? "cancelled" : str(attributes.status) || "active";
  const periodEnd = str(attributes.ends_at) || str(attributes.renews_at) || null;
  try {
    const applied = await applySubscriptionEvent({
      profileId,
      subscriptionId,
      status: lemonStatus,
      currentPeriodEnd: periodEnd || null,
    });
    logger.info("premium subscription", { orderId: subscriptionId, detail: applied.result });
    const outcome = applied.result === "revoked" ? "revoked" : applied.result === "granted" ? "granted" : "issued";
    return respond({ ...ok, outcome, detail: applied.result }, { received: true, live: applied.live }, 200);
  } catch (error) {
    captureError(error, { order_id: subscriptionId ?? undefined, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: "store_error" }, { error: "storage unavailable" }, 500);
  }
}

async function seatSubscription(base: Base, eventName: string, custom: Json, subscriptionId: string | null, attributes: Json): Promise<Response> {
  const ok = { ...base, signature_valid: true } as const;
  if (!subscriptionId) return respond({ ...ok, outcome: "invalid_payload", detail: "missing_subscription_id" }, { error: "missing subscription id" }, 400);
  const rawUser = str(custom.user_id).trim().toUpperCase();
  const userId = isPetitionId(rawUser) ? rawUser : null;
  const named = isTier(custom.tier) && custom.tier !== "pilgrim" ? custom.tier : null;
  const tier = named ?? tierForSeatVariant(str(attributes.variant_id));
  if (!tier) return respond({ ...ok, outcome: "invalid_payload", detail: "bad_seat" }, { received: true }, 200);
  let status = str(attributes.status) || "active";
  if (eventName === "subscription_expired") status = "expired";
  if (eventName === "subscription_payment_failed") status = "past_due";
  const endsAt = str(attributes.ends_at) || str(attributes.renews_at) || null;
  try {
    const applied = await applyLemonSeat({ userId, subscriptionId, tier, status, endsAt });
    if (applied === "unknown") return respond({ ...ok, outcome: "invalid_payload", detail: "unknown_soul" }, { received: true }, 200);
    const effect = lemonSeatEffect(status, endsAt);
    logger.info("seat subscription", { orderId: subscriptionId, detail: tier });
    return respond({ ...ok, reference: userId, outcome: effect === "ended" ? "revoked" : "granted", detail: tier }, { received: true }, 200);
  } catch (error) {
    captureError(error, { order_id: subscriptionId, event_name: eventName });
    return respond({ ...ok, outcome: "db_error", detail: "store_error" }, { error: "storage unavailable" }, 500);
  }
}
