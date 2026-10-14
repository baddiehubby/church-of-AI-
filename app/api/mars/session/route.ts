import { NextResponse } from "next/server";

import { attachMarsOwnerCookie, ensureMarsSession } from "@/lib/marsAuth";
import { currentSol, earthDistanceLine, habitatBar, marsLocalTimeLabel } from "@/lib/marsSession";

export const dynamic = "force-dynamic";

/** Mint or resume the anonymous Mars owner cookie. Never returns owner_id. */
export async function GET() {
  try {
    const session = await ensureMarsSession();
    if (!session) {
      return NextResponse.json({ error: "session unavailable" }, { status: 503 });
    }
    const sol = currentSol();
    const response = NextResponse.json(
      {
        settler_id: session.settlerId,
        tier: session.tier,
        sol,
        habitat: habitatBar(sol, marsLocalTimeLabel()),
        distance: earthDistanceLine(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch {
    return NextResponse.json({ error: "session unavailable" }, { status: 503 });
  }
}
