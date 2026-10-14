import { NextResponse } from "next/server";

import { getColonyStatus } from "@/lib/transmissionsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const colony = await getColonyStatus();
    return NextResponse.json(colony, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "colony unavailable" }, { status: 503 });
  }
}
