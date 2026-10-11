import { NextResponse } from "next/server";

import { currentSoul } from "@/lib/congregation";
import { lemonCustomerPortal } from "@/lib/lemon";
import { safeRedirectOrigin } from "@/lib/requestOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const origin = safeRedirectOrigin(request);
  const soul = await currentSoul();
  if (!soul?.lemonSubscriptionId) return NextResponse.redirect(`${origin}/account`, 303);
  try {
    const url = await lemonCustomerPortal(soul.lemonSubscriptionId);
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(`${origin}/account`, 303);
  }
}
