import { NextResponse } from "next/server";

import { createBlessingDraft, issueBlessing } from "@/lib/blessingsStore";
import { requestOrigin } from "@/lib/requestOrigin";
import { dayOfYear } from "@/lib/sceneFrame";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local desk only. Issues a prayer confirmation so the order page can be eyeballed. Never a real payment. */
export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const origin = requestOrigin(request);
  const draft = await createBlessingDraft({
    userId: "SOUL-DEV1-A2",
    tier: "prayer",
    name: "settler",
    sol: dayOfYear(),
    message: "a quiet prayer for the red dust",
  });
  await issueBlessing({ blessingId: draft.id, lemonOrderId: `dev-${draft.id}` });
  return NextResponse.redirect(new URL(`/blessing/${draft.id}`, origin), 303);
}
