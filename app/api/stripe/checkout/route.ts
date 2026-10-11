import { NextResponse } from "next/server";

import { currentSoul, ensureGuest } from "@/lib/congregation";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { createPortal, createSubscriptionCheckout } from "@/lib/stripeBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request: Request, path: string): Response {
  return NextResponse.redirect(`${safeRedirectOrigin(request)}${path}`, 303);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const tier = form?.get("tier");
  if (tier !== "believer") return back(request, "/pricing?notice=unconfigured");
  const soul = (await currentSoul()) ?? (await ensureGuest());
  if (!soul) return back(request, "/pricing?notice=unconfigured");
  const origin = safeRedirectOrigin(request);
  try {
    if (soul.stripeSubscriptionId && soul.stripeCustomerId) {
      const url = await createPortal(soul.stripeCustomerId, origin);
      return NextResponse.redirect(url, 303);
    }
    const url = await createSubscriptionCheckout({
      tier: "believer",
      email: soul.email,
      userId: soul.userId,
      customerId: soul.stripeCustomerId,
      trial: false,
      origin,
    });
    return NextResponse.redirect(url, 303);
  } catch {
    return back(request, "/pricing?notice=unconfigured");
  }
}
