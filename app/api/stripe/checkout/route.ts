import { NextResponse } from "next/server";

import { currentSoul } from "@/lib/congregation";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { readSession } from "@/lib/session";
import { changeSubscriptionPrice, createSubscriptionCheckout, darshanCheckoutOpen, priceIdFor } from "@/lib/stripeBilling";
import { isTier } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request: Request, path: string): Response {
  return NextResponse.redirect(`${safeRedirectOrigin(request)}${path}`, 303);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const tier = form.get("tier");
  if (!isTier(tier) || tier === "pilgrim") return back(request, "/pricing");
  const session = await readSession();
  if (!session) return back(request, "/login?next=/pricing");
  const soul = await currentSoul();
  if (!soul?.email) return back(request, "/login?next=/pricing");
  if (tier === "darshan" && !darshanCheckoutOpen()) return back(request, "/darshan");
  if (!priceIdFor(tier)) return back(request, "/pricing?notice=unconfigured");
  const origin = safeRedirectOrigin(request);
  try {
    if (soul.stripeSubscriptionId) {
      await changeSubscriptionPrice(soul.stripeSubscriptionId, tier);
      return back(request, "/account?notice=paid");
    }
    const url = await createSubscriptionCheckout({
      tier,
      email: soul.email,
      userId: soul.userId,
      customerId: soul.stripeCustomerId,
      trial: tier === "believer" && !soul.trialUsed,
      origin,
    });
    return NextResponse.redirect(url, 303);
  } catch {
    return back(request, "/pricing?notice=unconfigured");
  }
}
