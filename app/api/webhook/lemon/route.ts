// Red Path Lemon webhook. Raw body first. HMAC. Subscription + one-time. Idempotent.

import { NextResponse } from "next/server";

import { founderEmailCopy, founderFulfillmentEmailCopy } from "@/content/redPath";
import { sendFounderFulfillmentEmail, sendFounderInductionEmail, sendPracticePaymentFailedEmail } from "@/lib/email";
import { tierForRedPathVariant, webhookSecret } from "@/lib/env";
import { completeFounderFulfillment } from "@/lib/founderFulfillment";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { markPendingInductionPaid } from "@/lib/pendingInductions";
import {
  isCheckoutTier,
  isOneTimeTier,
  ONE_TIME_AMOUNT_CENTS,
  type CheckoutTier,
  type OneTimeTier,
} from "@/lib/redPathOfferings";
import {
  applyPracticeSubscription,
  applyRedPathOffering,
  expirePracticeSubscription,
  findSettlerByLemonSubscription,
  flagPracticePaymentFailed,
  markPracticeCancelled,
  type ShippingAddress,
} from "@/lib/transmissionsStore";
import { verifyWebhookSignature } from "@/lib/webhookSignature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = Record<string, unknown>;

function obj(value: unknown): Json {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function customData(payload: Json): Json {
  const data = obj(payload.data);
  const attributes = obj(data.attributes);
  const meta = obj(payload.meta);
  const fromMeta = obj(meta.custom_data);
  const fromAttrs = obj(attributes.custom_data);
  const fromCheckout = obj(obj(attributes.first_order_item).custom_data);
  return { ...fromCheckout, ...fromAttrs, ...fromMeta };
}

function orderIdOf(payload: Json): string {
  const data = obj(payload.data);
  const attributes = obj(data.attributes);
  return str(attributes.identifier) || str(data.id);
}

function subscriptionIdOf(payload: Json): string {
  const data = obj(payload.data);
  return str(data.id) || str(obj(data.attributes).subscription_id);
}

function variantIdOf(payload: Json): string {
  const data = obj(payload.data);
  const attributes = obj(data.attributes);
  const first = obj(attributes.first_order_item);
  return str(first.variant_id) || str(attributes.variant_id);
}

function emailOf(payload: Json): string | null {
  const attributes = obj(obj(payload.data).attributes);
  const email = str(attributes.user_email) || str(attributes.email);
  return email.includes("@") ? email : null;
}

function nameOf(payload: Json, custom: Json): string {
  const attributes = obj(obj(payload.data).attributes);
  return (
    str(custom.name).trim() ||
    str(attributes.user_name).trim() ||
    str(attributes.customer_name).trim() ||
    "settler"
  );
}

function amountCentsOf(payload: Json, tier: OneTimeTier): number {
  const attributes = obj(obj(payload.data).attributes);
  const total = Number(attributes.total);
  if (Number.isFinite(total) && total > 0) return Math.round(total);
  return ONE_TIME_AMOUNT_CENTS[tier];
}

function endsAtOf(payload: Json): string | null {
  const attributes = obj(obj(payload.data).attributes);
  const raw =
    str(attributes.ends_at) ||
    str(attributes.renews_at) ||
    str(attributes.trial_ends_at) ||
    str(attributes.billing_anchor);
  return raw || null;
}

function resolveTier(custom: Json, payload: Json): CheckoutTier | null {
  if (isCheckoutTier(custom.tier)) return custom.tier;
  return tierForRedPathVariant(variantIdOf(payload));
}

function storeIdOf(payload: Json): string {
  const attributes = obj(obj(payload.data).attributes);
  const meta = obj(payload.meta);
  return str(attributes.store_id) || str(meta.store_id);
}

function configuredStoreId(): string | null {
  return process.env.LEMON_SQUEEZY_STORE_ID?.trim() || null;
}

/** Reject events from a different Lemon store when STORE_ID is configured. */
function storeAllowed(payload: Json): boolean {
  const expected = configuredStoreId();
  if (!expected) return true;
  const incoming = storeIdOf(payload);
  if (!incoming) return true;
  return incoming === expected;
}

function boolish(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
  }
  return false;
}

function shippingOf(payload: Json, custom: Json): ShippingAddress {
  const attributes = obj(obj(payload.data).attributes);
  const fromOrder = obj(attributes.shipping_address);
  const fromBilling = obj(attributes.billing_address);
  const addr = Object.keys(fromOrder).length ? fromOrder : fromBilling;
  return {
    name:
      str(custom.shipping_name).trim() ||
      str(addr.name).trim() ||
      str(attributes.user_name).trim() ||
      null,
    line1: str(custom.shipping_line1).trim() || str(addr.line1).trim() || str(addr.address_1).trim() || null,
    line2: str(custom.shipping_line2).trim() || str(addr.line2).trim() || str(addr.address_2).trim() || null,
    city: str(custom.shipping_city).trim() || str(addr.city).trim() || null,
    region: str(custom.shipping_region).trim() || str(addr.region).trim() || str(addr.state).trim() || null,
    postal: str(custom.shipping_postal).trim() || str(addr.postal_code).trim() || str(addr.zip).trim() || null,
    country: str(custom.shipping_country).trim() || str(addr.country).trim() || null,
  };
}

async function handleOrderCreated(payload: Json): Promise<Response> {
  if (!storeAllowed(payload)) {
    logger.warn("red path webhook: store mismatch");
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const custom = customData(payload);
  const kind = str(custom.kind);
  if (kind && kind !== "red_path") {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const status = str(obj(obj(payload.data).attributes).status).toLowerCase();
  // Only settled payments activate membership. Pending/unpaid never enroll.
  if (status && status !== "paid") {
    return NextResponse.json({ received: true, unpaid: true }, { status: 200 });
  }

  const tier = resolveTier(custom, payload);
  if (!tier || !isOneTimeTier(tier)) {
    // Subscription first payments also emit order_created — ignore non one-time here.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const settlerId = str(custom.settler_id).trim().toUpperCase();
  if (!settlerId) {
    logger.warn("red path webhook: missing settler_id", { tier });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const lemonOrderId = orderIdOf(payload);
  if (!lemonOrderId) return NextResponse.json({ received: true }, { status: 200 });

  const email = emailOf(payload);
  const name = nameOf(payload, custom);
  const showName = boolish(custom.show_name);
  const result = await applyRedPathOffering({
    settlerId,
    tier,
    lemonOrderId,
    amountCents: amountCentsOf(payload, tier),
    email,
    name,
    lemonCustomerId: str(obj(obj(payload.data).attributes).customer_id) || null,
    showName,
  });

  if (!result.ok) {
    logger.warn("red path offering refused", { reason: result.reason, settlerId, tier });
    return NextResponse.json({ received: true, reason: result.reason }, { status: 200 });
  }

  let ceremonyUrl: string | null = null;
  let founderPosition = result.founderPosition ?? null;

  if (tier === "founder_1000" && (result.founderPosition != null || !result.already)) {
    try {
      const fulfillment = await completeFounderFulfillment({
        settlerId,
        name,
        email,
        showName,
        lemonOrderId,
        shipping: shippingOf(payload, custom),
        position: result.founderPosition,
      });
      founderPosition = fulfillment.position;
      ceremonyUrl = fulfillment.ceremonyUrl;
      await markPendingInductionPaid({ settlerId, lemonOrderId });

      if (!fulfillment.already) {
        if (email) {
          await sendFounderInductionEmail({
            to: email,
            name,
            position: fulfillment.position,
            note: founderEmailCopy.note({
              name,
              position: fulfillment.position,
              ceremonyUrl: fulfillment.ceremonyUrl,
            }),
            subject: founderEmailCopy.subject,
            ceremonyUrl: fulfillment.ceremonyUrl,
          });
        }
        await sendFounderFulfillmentEmail({
          subject: founderFulfillmentEmailCopy.subject(fulfillment.position),
          body: founderFulfillmentEmailCopy.body({
            name,
            email: email ?? "",
            position: fulfillment.position,
            lemonOrderId,
            shipping: fulfillment.shippingText,
          }),
        });
      }
    } catch {
      // 5xx so Lemon retries — do not drop a paid induction.
      logger.error("founder fulfillment failed", { settlerId, lemonOrderId });
      throw new Error("founder_fulfillment_failed");
    }
  }

  return NextResponse.json({
    received: true,
    already: result.already,
    tier: result.tier,
    founderPosition,
    ceremonyUrl,
  });
}

async function handleSubscription(payload: Json, eventName: string): Promise<Response> {
  if (!storeAllowed(payload)) {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const custom = customData(payload);
  const kind = str(custom.kind);
  if (kind && kind !== "red_path") {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const subscriptionId = subscriptionIdOf(payload);
  if (!subscriptionId) return NextResponse.json({ received: true }, { status: 200 });

  const settlerId = str(custom.settler_id).trim().toUpperCase();
  const tier = resolveTier(custom, payload);
  const email = emailOf(payload);
  const customerId = str(obj(obj(payload.data).attributes).customer_id) || null;
  const eventId = str(obj(payload.meta).event_id) || `${eventName}:${subscriptionId}`;

  if (eventName === "subscription_created" || eventName === "subscription_updated") {
    let target = settlerId;
    if (!target) {
      const existing = await findSettlerByLemonSubscription(subscriptionId);
      target = existing?.settler_id ?? "";
    }
    if (!target) {
      logger.warn("red path subscription: missing settler_id", { eventName, subscriptionId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const status = str(obj(obj(payload.data).attributes).status).toLowerCase();
    if (status === "cancelled") {
      await markPracticeCancelled({ lemonSubscriptionId: subscriptionId, endsAt: endsAtOf(payload) });
      return NextResponse.json({ received: true, status }, { status: 200 });
    }
    if (status === "expired") {
      await expirePracticeSubscription({ lemonSubscriptionId: subscriptionId });
      return NextResponse.json({ received: true, status }, { status: 200 });
    }

    // Upgrades/downgrades of the practice seat still land on practice_monthly.
    void tier;
    await applyPracticeSubscription({
      settlerId: target,
      lemonSubscriptionId: subscriptionId,
      lemonCustomerId: customerId,
      email,
      eventId,
    });
    return NextResponse.json({ received: true, tier: "practice_monthly" }, { status: 200 });
  }

  if (eventName === "subscription_cancelled") {
    await markPracticeCancelled({
      lemonSubscriptionId: subscriptionId,
      endsAt: endsAtOf(payload),
    });
    return NextResponse.json({ received: true, cancelled: true }, { status: 200 });
  }

  if (eventName === "subscription_expired") {
    const reverted = await expirePracticeSubscription({ lemonSubscriptionId: subscriptionId });
    return NextResponse.json({ received: true, expired: true, tier: reverted }, { status: 200 });
  }

  if (eventName === "subscription_payment_failed") {
    const flagged = await flagPracticePaymentFailed({ lemonSubscriptionId: subscriptionId });
    if (flagged?.email) {
      await sendPracticePaymentFailedEmail({ to: flagged.email, settlerId: flagged.settler_id });
    }
    return NextResponse.json({ received: true, payment_failed: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "webhook misconfigured" }, { status: 500 });
  }
  const signature = request.headers.get("x-signature");
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Json = {};
  try {
    payload = obj(JSON.parse(raw) as unknown);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const eventName = str(obj(payload.meta).event_name);

  try {
    if (eventName === "order_created") return await handleOrderCreated(payload);
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired" ||
      eventName === "subscription_payment_failed"
    ) {
      return await handleSubscription(payload, eventName);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    logger.error("red path webhook failed", { eventName });
    return NextResponse.json({ error: "store unavailable" }, { status: 500 });
  }
}
