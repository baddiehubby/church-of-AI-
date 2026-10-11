import { NextResponse } from "next/server";

import { currentSoul } from "@/lib/congregation";
import { seatLemonConfig, type SeatTier } from "@/lib/env";
import { changeSeatVariant, CheckoutUnavailableError, createSeatCheckout } from "@/lib/lemon";
import { rateLimit } from "@/lib/rateLimit";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request: Request, path: string): Response {
  return NextResponse.redirect(`${safeRedirectOrigin(request)}${path}`, 303);
}

function seatTier(value: FormDataEntryValue | null): SeatTier | null {
  return value === "believer" || value === "devotee" || value === "darshan" ? value : null;
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const tier = seatTier(form?.get("tier") ?? null);
  if (!tier) return back(request, "/pricing");
  const session = await readSession();
  if (!session) return back(request, "/login?next=/pricing");
  const soul = await currentSoul();
  if (!soul?.email) return back(request, "/login?next=/pricing");
  const config = seatLemonConfig(tier);
  if (!config) return back(request, "/pricing?notice=unconfigured");
  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return back(request, "/pricing?notice=busy");
  const origin = safeRedirectOrigin(request);
  try {
    if (soul.lemonSubscriptionId) {
      await changeSeatVariant(soul.lemonSubscriptionId, config.variantId);
      return back(request, "/account?notice=paid");
    }
    const url = await createSeatCheckout({ tier, userId: soul.userId, email: soul.email, origin });
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const busy = error instanceof CheckoutUnavailableError && error.reason !== "not configured";
    return back(request, busy ? "/pricing?notice=busy" : "/pricing?notice=unconfigured");
  }
}
