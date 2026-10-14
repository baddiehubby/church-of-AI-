import { NextResponse } from "next/server";

import { attachMarsOwnerCookie, readMarsSession } from "@/lib/marsAuth";
import { PRESERVE_REQUIRES_OFFERING } from "@/lib/settlerTiers";
import { preserveTransmissionForOwner } from "@/lib/transmissionsStore";

export const dynamic = "force-dynamic";

const SIGNAL_FAIL = "the signal didn't reach us. try again, beta.";

export async function POST(request: Request) {
  const session = await readMarsSession();
  if (!session) {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "body" }, { status: 400 });
  }

  const transmissionId = typeof payload.transmission_id === "string" ? payload.transmission_id.trim() : "";
  if (!transmissionId || !/^[0-9a-f-]{36}$/i.test(transmissionId)) {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "id" }, { status: 400 });
  }

  try {
    const result = await preserveTransmissionForOwner(transmissionId, session.ownerId);
    if (!result.ok) {
      if (result.reason === "tier" || result.reason === "limit") {
        return NextResponse.json(
          { error: result.message ?? PRESERVE_REQUIRES_OFFERING, code: result.reason },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: SIGNAL_FAIL, code: result.reason },
        { status: result.reason === "missing" ? 404 : 403 },
      );
    }
    const response = NextResponse.json({ ok: true, preserved: true, already: result.already });
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "store" }, { status: 503 });
  }
}
