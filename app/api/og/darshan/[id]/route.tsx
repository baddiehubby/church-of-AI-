import { ImageResponse } from "next/og";

import { getDarshan, getSoulByUserId } from "@/lib/congregation";
import { loadOgFonts } from "@/lib/ogFonts";
import { darshanPoster } from "@/lib/poster-card";

export const runtime = "nodejs";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID.test(id)) return new Response(null, { status: 404 });
  const row = await getDarshan(id).catch(() => null);
  if (!row) return new Response(null, { status: 404 });
  const soul = await getSoulByUserId(row.userId).catch(() => null);
  const fonts = await loadOgFonts();
  const when = row.scheduledAt.slice(0, 10);
  return new ImageResponse(darshanPoster({ soulId: soul?.userId ?? row.userId, when }), {
    width: 1200,
    height: 630,
    fonts,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
