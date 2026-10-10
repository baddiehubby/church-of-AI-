import { NextResponse } from "next/server";

import { appUrl } from "@/lib/env";
import { consumeLoginToken, writeSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const session = await consumeLoginToken(token);
  if (!session) return NextResponse.redirect(`${appUrl()}/login?notice=invalid`, 303);
  await writeSessionCookie(session.profileId);
  return NextResponse.redirect(`${appUrl()}/journal`, 303);
}
