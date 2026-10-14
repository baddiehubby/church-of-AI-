import { NextResponse } from "next/server";

import { currentSoul, ensureGuest } from "@/lib/congregation";
import { rateLimit } from "@/lib/rateLimit";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { createPortal, createSettlerCovenantCheckout, createSubscriptionCheckout } from "@/lib/stripeBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request: Request, path: string): Response {
  return NextResponse.redirect(`${safeRedirectOrigin(request)}${path}`, 303);
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";

  // Mars Settler's Covenant — JSON body, returns { url }.
  // Owner identity comes from the httpOnly mars_owner cookie, not a client settler_id.
  if (contentType.includes("application/json")) {
    const limited = await rateLimit(request, "stripe-checkout", 5, 10 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json({ error: "rate" }, { status: 429 });
    }
    const { ensureMarsSession } = await import("@/lib/marsAuth");
    const session = await ensureMarsSession();
    if (!session) return NextResponse.json({ error: "session" }, { status: 401 });
    try {
      const url = await createSettlerCovenantCheckout({
        settlerId: session.settlerId,
        origin: safeRedirectOrigin(request),
      });
      return NextResponse.json({ url });
    } catch {
      return NextResponse.json({ error: "unconfigured" }, { status: 503 });
    }
  }

  // Legacy pricing form — Believer seat redirect.
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
