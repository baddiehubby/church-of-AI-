import { NextResponse } from "next/server";

import { redPathCopy } from "@/content/redPath";
import { attachMarsOwnerCookie, readMarsSession } from "@/lib/marsAuth";
import { CheckoutUnavailableError, lemonCustomerPortal } from "@/lib/lemon";
import { getSettlerLemonSubscriptionId } from "@/lib/transmissionsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lemon customer portal for the current settler's Daily Practice subscription. */
export async function GET(): Promise<Response> {
  const session = await readMarsSession();
  if (!session) {
    return NextResponse.json({ error: redPathCopy.signalFail, code: "unauthorized" }, { status: 401 });
  }

  try {
    const subId = await getSettlerLemonSubscriptionId(session.settlerId);
    if (!subId) {
      return NextResponse.json({ error: redPathCopy.signalFail, code: "no_subscription" }, { status: 404 });
    }
    const url = await lemonCustomerPortal(subId);
    const response = NextResponse.json({ url });
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError) {
      return NextResponse.json({ error: redPathCopy.signalFail, code: "portal" }, { status: 503 });
    }
    return NextResponse.json({ error: redPathCopy.signalFail, code: "portal" }, { status: 503 });
  }
}
