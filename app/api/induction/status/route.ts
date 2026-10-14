import { NextResponse } from "next/server";

import { ensureMarsSession } from "@/lib/marsAuth";
import { latestPendingForSettler } from "@/lib/pendingInductions";
import { findFounderBySettler } from "@/lib/transmissionsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public status for the induction confirmation page.
 * Membership is never implied by browser redirect alone — founder row / paid pending only.
 */
export async function GET(): Promise<Response> {
  const session = await ensureMarsSession();
  if (!session) {
    return NextResponse.json({ inducted: false, pending: false, code: "session" }, { status: 200 });
  }

  const founder = await findFounderBySettler(session.settlerId).catch(() => null);
  if (founder) {
    return NextResponse.json({
      inducted: true,
      pending: false,
      position: founder.position,
      show_name: founder.show_name,
      ceremony_url: founder.ceremony_url,
    });
  }

  const pending = await latestPendingForSettler(session.settlerId).catch(() => null);
  return NextResponse.json({
    inducted: false,
    pending: pending?.status === "pending",
    pending_status: pending?.status ?? null,
  });
}
