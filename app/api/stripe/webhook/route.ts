import { applyStripeState } from "@/lib/congregation";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { isSettlerId } from "@/lib/marsSession";
import { captureError } from "@/lib/monitor";
import { stripeId, stripeSubscriptionEffect, stripeWebhookSecret, subscriptionTier } from "@/lib/stripeBilling";
import { verifyStripeSignature } from "@/lib/stripeSign";
import { isTier } from "@/lib/tiers";
import {
  findSettlerByCustomer,
  getSettlerTier,
  setSettlerTier,
  updateSettlerBilling,
} from "@/lib/transmissionsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emailOf(object: Record<string, unknown>): string | null {
  if (!isRecord(object.customer_details) || typeof object.customer_details.email !== "string") {
    if (typeof object.customer_email === "string") return object.customer_email;
    return null;
  }
  return object.customer_details.email;
}

function settlerIdOf(object: Record<string, unknown>): string | null {
  if (typeof object.client_reference_id === "string" && isSettlerId(object.client_reference_id)) {
    return object.client_reference_id.trim().toUpperCase();
  }
  if (isRecord(object.metadata) && typeof object.metadata.settler_id === "string" && isSettlerId(object.metadata.settler_id)) {
    return object.metadata.settler_id.trim().toUpperCase();
  }
  return null;
}

async function promoteMarsSettler(object: Record<string, unknown>): Promise<void> {
  const settlerId = settlerIdOf(object);
  if (!settlerId) return;
  const customerId = stripeId(object.customer);
  const subscriptionId = stripeId(object.subscription);
  const email = emailOf(object);
  const current = await getSettlerTier(settlerId);
  // Idempotent: billing fields may refresh; tier write is a no-op when already practice.
  await updateSettlerBilling(settlerId, {
    tier: "practice_monthly",
    customerId,
    subscriptionId,
    email,
  });
  if (current === "practice_monthly") return;
  await setSettlerTier(settlerId, "practice_monthly");
}

async function demoteMarsSettler(object: Record<string, unknown>): Promise<void> {
  const customerId = stripeId(object.customer);
  const fromMeta = settlerIdOf(object);
  const fromCustomer = customerId ? await findSettlerByCustomer(customerId) : null;
  const settlerId = fromMeta ?? fromCustomer?.settler_id ?? null;
  if (!settlerId) return;
  const tier = await getSettlerTier(settlerId);
  if (tier === "wanderer") return;
  await setSettlerTier(settlerId, "wanderer");
  await updateSettlerBilling(settlerId, {
    tier: "wanderer",
    customerId: customerId ?? fromCustomer?.stripe_customer_id ?? null,
    subscriptionId: null,
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = stripeWebhookSecret();
  const payload = await request.text();
  if (!secret || !verifyStripeSignature(secret, payload, request.headers.get("stripe-signature"))) {
    return new Response(null, { status: 400 });
  }
  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isRecord(event) || typeof event.type !== "string" || !isRecord(event.data) || !isRecord(event.data.object)) {
    return new Response(null, { status: 400 });
  }
  const object = event.data.object;
  const metadata = isRecord(object.metadata) ? object.metadata : null;
  const userId =
    metadata && typeof metadata.user_id === "string"
      ? metadata.user_id
      : typeof object.client_reference_id === "string"
        ? object.client_reference_id
        : null;
  const tier = metadata && isTier(metadata.tier) ? metadata.tier : subscriptionTier(object);
  const status = typeof object.status === "string" ? object.status : null;
  try {
    if (event.type === "checkout.session.completed" && object.mode === "subscription") {
      await promoteMarsSettler(object);
      await applyStripeState({
        userId,
        customerId: stripeId(object.customer),
        subscriptionId: stripeId(object.subscription),
        tier: tier ?? "believer",
        status: "active",
        email: emailOf(object),
      });
    } else if (event.type === "customer.subscription.deleted") {
      await demoteMarsSettler(object);
      await applyStripeState({
        userId,
        customerId: stripeId(object.customer),
        subscriptionId: stripeId(object.id),
        tier,
        status: "canceled",
      });
    } else if (event.type === "invoice.payment_failed") {
      await applyStripeState({ customerId: stripeId(object.customer), status: "past_due" });
    } else {
      const effect = stripeSubscriptionEffect(event.type, status);
      if (effect === "grant") {
        if (settlerIdOf(object) || (isRecord(object.metadata) && object.metadata.kind === "mars_covenant")) {
          await promoteMarsSettler(object);
        }
        await applyStripeState({
          userId,
          customerId: stripeId(object.customer),
          subscriptionId: stripeId(object.id),
          tier,
          status: status === "trialing" ? "trialing" : "active",
        });
      } else if (effect === "past_due") {
        await applyStripeState({
          userId,
          customerId: stripeId(object.customer),
          subscriptionId: stripeId(object.id),
          tier,
          status: "past_due",
        });
      } else if (effect === "end") {
        await demoteMarsSettler(object);
        await applyStripeState({
          userId,
          customerId: stripeId(object.customer),
          subscriptionId: stripeId(object.id),
          tier,
          status: "canceled",
        });
      }
    }
  } catch (error) {
    logger.error("stripe webhook failed");
    captureError(error, { event_name: event.type, soul_id: settlerIdOf(object) ?? undefined });
    return new Response(null, { status: 500 });
  }
  return Response.json({ received: true });
}
