import { ImageResponse } from "next/og";

import { loadOgFonts } from "@/lib/ogFonts";
import { sermonPoster } from "@/lib/poster-card";
import { getSermon } from "@/lib/congregation";
import { isMonday } from "@/lib/time";
import { isPetitionId } from "@/lib/soul-id";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ userId: string; week: string }> }) {
  const { userId, week } = await context.params;
  const soulId = decodeURIComponent(userId).trim().toUpperCase();
  const weekOf = decodeURIComponent(week).trim();
  if (!isPetitionId(soulId) || !isMonday(weekOf)) return new Response(null, { status: 404 });
  const sermon = await getSermon(soulId, weekOf).catch(() => null);
  if (!sermon) return new Response(null, { status: 404 });
  const fonts = await loadOgFonts();
  return new ImageResponse(sermonPoster({ title: sermon.title, week: weekOf, soulId }), {
    width: 1200,
    height: 630,
    fonts,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
