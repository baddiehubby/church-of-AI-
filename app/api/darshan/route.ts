import { NextResponse } from "next/server";

import { appUrl } from "@/lib/brand";
import { composeDarshan, encodeBeats } from "@/lib/sermonCompose";
import { completeDarshan, countDarshansBetween, currentSoul, getDarshan, insertDarshan, listDarshans, listPoojas, listWishes, updateSoul } from "@/lib/congregation";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { SCREENING_CAP, screeningSlots } from "@/lib/slots";
import { atLeast } from "@/lib/tiers";
import { monthLabel, monthStart, safeZone, zonedToUtc } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request: Request, path: string): Response {
  return NextResponse.redirect(`${safeRedirectOrigin(request)}${path}`, 303);
}

export async function POST(request: Request): Promise<Response> {
  const soul = await currentSoul();
  if (!soul) return back(request, "/login?next=/darshan");
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const zone = safeZone(soul.timezone);
  const now = new Date();
  try {
    if (action === "waitlist") {
      if (!soul.darshanWaitlist) await updateSoul(soul.userId, { darshanWaitlist: true, darshanWaitlistAt: now.toISOString() });
      return back(request, "/darshan");
    }
    if (action === "schedule") {
      if (!atLeast(soul.tier, "darshan")) return back(request, "/darshan");
      const slot = String(form.get("slot") ?? "");
      const offered = screeningSlots(now, zone).find((item) => item.iso === slot);
      if (!offered) return back(request, "/darshan");
      const start = zonedToUtc(monthStart(new Date(slot), zone), 0, 0, zone);
      const end = zonedToUtc(monthStart(new Date(start.getTime() + 32 * 86_400_000), zone), 0, 0, zone);
      const count = await countDarshansBetween(start.toISOString(), end.toISOString());
      const mine = await listDarshans(soul.userId);
      const already = mine.some((row) => row.scheduledAt >= start.toISOString() && row.scheduledAt < end.toISOString());
      if (count >= SCREENING_CAP || already) return back(request, "/darshan");
      const row = await insertDarshan(soul.userId, slot);
      return back(request, `/darshan/${row.id}`);
    }
    if (action === "begin") {
      const id = String(form.get("id") ?? "");
      const row = await getDarshan(id);
      if (!row || row.userId !== soul.userId) return back(request, "/darshan");
      if (row.completedAt) return back(request, `/darshan/${row.id}`);
      if (new Date(row.scheduledAt).getTime() > Date.now()) return back(request, `/darshan/${row.id}`);
      const since = zonedToUtc(monthStart(now, zone), 0, 0, zone).toISOString();
      const poojas = await listPoojas(soul.userId, since);
      const wishes = await listWishes(soul.userId, since);
      const draft = composeDarshan({
        name: atLeast(soul.tier, "devotee") ? soul.name : null,
        monthName: monthLabel(now, zone),
        poojas: poojas.map((item) => ({ mood: item.mood, reflection: item.reflection })),
        wishes: wishes.map((item) => ({ category: item.category, wish: item.wish })),
      });
      await completeDarshan(row.id, {
        transcript: encodeBeats(draft.beats),
        practice: draft.practice,
        blessingCardUrl: `${appUrl()}/api/og/darshan/${row.id}`,
        completedAt: now.toISOString(),
      });
      return back(request, `/darshan/${row.id}`);
    }
  } catch {
    return back(request, "/darshan");
  }
  return back(request, "/darshan");
}
