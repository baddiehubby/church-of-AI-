import { NextResponse } from "next/server";

import { currentSoul, getSermon, listPoojas, listWishes, saveSermon } from "@/lib/congregation";
import { safeRedirectOrigin } from "@/lib/requestOrigin";
import { composeSermon } from "@/lib/sermonCompose";
import { atLeast } from "@/lib/tiers";
import { addDays, mondayOf, safeZone, zonedToUtc } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const origin = safeRedirectOrigin(request);
  const soul = await currentSoul();
  if (!soul) return NextResponse.redirect(`${origin}/login?next=/sermon/archive`, 303);
  if (!atLeast(soul.tier, "believer")) return NextResponse.redirect(`${origin}/pricing`, 303);
  const zone = safeZone(soul.timezone);
  const now = new Date();
  const week = mondayOf(now, zone);
  try {
    const existing = await getSermon(soul.userId, week);
    if (existing) return NextResponse.redirect(`${origin}/sermon/${week}`, 303);
    const since = zonedToUtc(addDays(week, -7), 0, 0, zone).toISOString();
    const poojas = await listPoojas(soul.userId, since);
    const wishes = await listWishes(soul.userId, since);
    const draft = composeSermon({
      soulId: soul.userId,
      name: soul.name,
      tier: soul.tier,
      weekOf: week,
      poojas: poojas.map((row) => ({ mood: row.mood, reflection: row.reflection })),
      wishes: wishes.map((row) => ({ category: row.category, wish: row.wish })),
    });
    await saveSermon({ userId: soul.userId, weekOf: week, ...draft });
  } catch {
    return NextResponse.redirect(`${origin}/sermon/archive`, 303);
  }
  return NextResponse.redirect(`${origin}/sermon/${week}`, 303);
}
