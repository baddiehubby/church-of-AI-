import { NextResponse } from "next/server";

import { attachMarsOwnerCookie, ensureMarsSession } from "@/lib/marsAuth";
import { listArchiveForOwner } from "@/lib/transmissionsStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await ensureMarsSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limitRaw = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

  // Ignore settler_id query/header/body — ownership is the httpOnly session only.
  try {
    const archive = await listArchiveForOwner(session.ownerId, { cursor, limit });
    const response = NextResponse.json(archive, { headers: { "Cache-Control": "no-store" } });
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch {
    return NextResponse.json({ error: "archive unavailable" }, { status: 503 });
  }
}
