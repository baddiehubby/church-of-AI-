import { NextResponse } from "next/server";

import { redPathCopy } from "@/content/redPath";
import { isAllowedInductionTier } from "@/lib/inductionAllowlist";
import { clientTriedToSetPriceOrStatus } from "@/lib/inductionPlanTypes";
import { attachMarsOwnerCookie, ensureMarsSession } from "@/lib/marsAuth";
import { CheckoutUnavailableError, createRedPathOfferingCheckout, redPathCheckoutConfigured } from "@/lib/lemon";
import { createPendingInduction, markPendingInductionFailed } from "@/lib/pendingInductions";
import { requestOrigin } from "@/lib/requestOrigin";
import { isCheckoutTier } from "@/lib/redPathOfferings";
import { countFoundersInducted, foundersRemaining } from "@/lib/transmissionsStore";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request): Promise<Response> {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "body" }, { status: 400 });
  }

  // Never trust browser prices, product IDs, or payment status.
  if (clientTriedToSetPriceOrStatus(payload)) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "price" }, { status: 400 });
  }
  if ("variant_id" in payload || "product_id" in payload || "variantId" in payload) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "variant" }, { status: 400 });
  }

  const tierRaw = payload.tier;
  if (!isCheckoutTier(tierRaw)) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "tier" }, { status: 400 });
  }

  if (!redPathCheckoutConfigured(tierRaw)) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "desk" }, { status: 503 });
  }

  if (tierRaw === "founder_1000" && !isAllowedInductionTier(tierRaw)) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "tier" }, { status: 400 });
  }

  if (tierRaw === "founder_1000") {
    const inducted = await countFoundersInducted();
    if (inducted >= FOUNDERS_CAP) {
      return NextResponse.json(
        { error: redPathCopy.soldOut, code: "sold_out", remaining: await foundersRemaining() },
        { status: 409 },
      );
    }
  }

  const session = await ensureMarsSession();
  if (!session) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "session" }, { status: 503 });
  }

  const name = str(payload.name).slice(0, 80);
  const showName = payload.show_name === true || payload.show_name === "1" || payload.show_name === 1;
  const shipping =
    tierRaw === "founder_1000"
      ? {
          name: str(payload.shipping_name) || name || undefined,
          line1: str(payload.shipping_line1) || undefined,
          line2: str(payload.shipping_line2) || undefined,
          city: str(payload.shipping_city) || undefined,
          region: str(payload.shipping_region) || undefined,
          postal: str(payload.shipping_postal) || undefined,
          country: str(payload.shipping_country) || undefined,
        }
      : undefined;

  if (tierRaw === "founder_1000") {
    if (!name) {
      return NextResponse.json({ error: redPathCopy.signalFail, code: "name" }, { status: 400 });
    }
    if (!shipping?.line1 || !shipping.city || !shipping.country) {
      return NextResponse.json({ error: redPathCopy.signalFail, code: "shipping" }, { status: 400 });
    }
    await createPendingInduction({
      settlerId: session.settlerId,
      name,
      showName,
      shipping,
    });
  }

  try {
    const url = await createRedPathOfferingCheckout({
      tier: tierRaw,
      settlerId: session.settlerId,
      origin: requestOrigin(request),
      ...(name ? { name } : {}),
      ...(tierRaw === "founder_1000" ? { showName, shipping } : {}),
    });
    const response = NextResponse.json({ url });
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch (error) {
    if (tierRaw === "founder_1000") {
      await markPendingInductionFailed({
        settlerId: session.settlerId,
        error: error instanceof CheckoutUnavailableError ? error.reason : "checkout_failed",
      }).catch(() => undefined);
    }
    if (error instanceof CheckoutUnavailableError && error.reason === "not configured") {
      return NextResponse.json({ error: redPathCopy.signalFail, code: "desk" }, { status: 503 });
    }
    return NextResponse.json({ error: redPathCopy.signalFail, code: "checkout" }, { status: 503 });
  }
}
