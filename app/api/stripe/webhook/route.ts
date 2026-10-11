import { applyStripeState } from "@/lib/congregation";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { stripeId, stripeSubscriptionEffect, stripeWebhookSecret, subscriptionTier } from "@/lib/stripeBilling";
import { verifyStripeSignature } from "@/lib/stripeSign";
import { isTier } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emailOf(object: Record<string, unknown>): string | null {
  if (!isRecord(object.customer_details)) return null;
  return typeof object.customer_details.email === "string" ? object.customer_details.email : null;
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
  const userId = metadata && typeof metadata.user_id === "string" ? metadata.user_id : typeof object.client_reference_id === "string" ? object.client_reference_id : null;
  const tier = metadata && isTier(metadata.tier) ? metadata.tier : subscriptionTier(object);
  const status = typeof object.status === "string" ? object.status : null;
  try {
    if (event.type === "checkout.session.completed" && object.mode === "subscription") {
      await applyStripeState({
        userId,
        customerId: stripeId(object.customer),
        subscriptionId: stripeId(object.subscription),
        tier: tier ?? "believer",
        status: "active",
        email: emailOf(object),
      });
    } else if (event.type === "invoice.payment_failed") {
      await applyStripeState({ customerId: stripeId(object.customer), status: "past_due" });
    } else {
      const effect = stripeSubscriptionEffect(event.type, status);
      if (effect === "grant") {
        await applyStripeState({
          userId,
          customerId: stripeId(object.customer),
          subscriptionId: stripeId(object.id),
          tier,
          status: status === "trialing" ? "trialing" : "active",
        });
      } else if (effect === "past_due") {
        await applyStripeState({ userId, customerId: stripeId(object.customer), subscriptionId: stripeId(object.id), tier, status: "past_due" });
      } else if (effect === "end") {
        await applyStripeState({ userId, customerId: stripeId(object.customer), subscriptionId: stripeId(object.id), tier, status: "canceled" });
      }
    }
  } catch {
    logger.error("stripe webhook failed");
    return new Response(null, { status: 500 });
  }
  return Response.json({ received: true });
}
