import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";
import { safeRedirectOrigin } from "@/lib/requestOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  await clearSessionCookie();
  return NextResponse.redirect(`${safeRedirectOrigin(request)}/`, 303);
}
