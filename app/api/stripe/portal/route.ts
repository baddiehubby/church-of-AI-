import { NextResponse } from "next/server";

import { currentSoul } from "@/lib/congregation";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { createPortal } from "@/lib/stripeBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const origin = safeRedirectOrigin(request);
  const soul = await currentSoul();
  if (!soul?.stripeCustomerId) return NextResponse.redirect(`${origin}/account`, 303);
  try {
    const url = await createPortal(soul.stripeCustomerId, origin);
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(`${origin}/account?notice=name`, 303);
  }
}
