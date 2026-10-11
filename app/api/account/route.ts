import { NextResponse } from "next/server";

import { currentSoul, updateSoul } from "@/lib/congregation";
import { isRecord } from "@/lib/guards";
import { sanitizeName } from "@/lib/sanitizeName";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { safeZone } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isZone(value: string): boolean {
  return safeZone(value) === value;
}

export async function POST(request: Request): Promise<Response> {
  const soul = await currentSoul();
  const origin = safeRedirectOrigin(request);
  if (!soul) return NextResponse.redirect(`${origin}/login?next=/account`, 303);
  const type = request.headers.get("content-type") ?? "";
  let timezone = "";
  let name: string | null = null;
  let nameSent = false;
  let guess = false;
  let urgent: string | null = null;
  if (type.includes("json")) {
    const body: unknown = await request.json();
    if (!isRecord(body)) return Response.json({ error: "upstream" }, { status: 400 });
    timezone = typeof body.timezone === "string" ? body.timezone : "";
    guess = body.guess === true;
    if (typeof body.name === "string") {
      nameSent = true;
      name = body.name;
    }
  } else {
    const form = await request.formData();
    timezone = typeof form.get("timezone") === "string" ? String(form.get("timezone")) : "";
    if (typeof form.get("name") === "string") {
      nameSent = true;
      name = String(form.get("name"));
    }
    urgent = typeof form.get("urgent") === "string" ? String(form.get("urgent")) : null;
  }
  try {
    if (guess) {
      if (!soul.timezoneSet && timezone && isZone(timezone)) await updateSoul(soul.userId, { timezone, timezoneSet: true });
      return Response.json({ ok: true });
    }
    if (urgent === "1" || urgent === "0") {
      if (soul.tier === "darshan") await updateSoul(soul.userId, { urgentArmed: urgent === "1" });
      return NextResponse.redirect(`${origin}/account`, 303);
    }
    const patch: { timezone?: string; timezoneSet?: boolean; name?: string | null } = {};
    if (timezone) {
      if (!isZone(timezone)) return NextResponse.redirect(`${origin}/account?notice=name`, 303);
      patch.timezone = timezone;
      patch.timezoneSet = true;
    }
    if (nameSent) {
      if (!name?.trim()) patch.name = null;
      else {
        const cleaned = sanitizeName(name);
        if (!cleaned.ok) return NextResponse.redirect(`${origin}/account?notice=name`, 303);
        patch.name = cleaned.value;
      }
    }
    if (Object.keys(patch).length > 0) await updateSoul(soul.userId, patch);
  } catch {
    return NextResponse.redirect(`${origin}/account?notice=name`, 303);
  }
  if (type.includes("json")) return Response.json({ ok: true });
  return NextResponse.redirect(`${origin}/account`, 303);
}
