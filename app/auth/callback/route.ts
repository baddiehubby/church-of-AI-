import { NextResponse } from "next/server";

import { appUrl } from "@/lib/env";
import { safeNext } from "@/lib/safeNext";
import { consumeLoginToken, writeSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const session = await consumeLoginToken(token);
  if (!session) return NextResponse.redirect(`${appUrl()}/login?notice=invalid`, 303);
  await writeSessionCookie(session.profileId);
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  return NextResponse.redirect(`${appUrl()}${next}`, 303);
}
