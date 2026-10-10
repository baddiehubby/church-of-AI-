// Assumptions: the free verdict share image (restored wish-engine behaviour): petition ids only, immutable cache,
// ?download=1 adds an attachment filename. Missing or malformed ids are 404 no-store.

import { ImageResponse } from "next/og";

import { brandHostname } from "@/lib/brand";
import { loadOgFonts } from "@/lib/ogFonts";
import { getPetition } from "@/lib/petitions";
import { isPetitionId } from "@/lib/soul-id";
import { verdictCard } from "@/lib/verdict-card";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: raw } = await context.params;
  const id = decodeURIComponent(raw).trim().toUpperCase();
  if (!isPetitionId(id)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const petition = await getPetition(id);
  if (!petition) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const fonts = await loadOgFonts();
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new ImageResponse(
    verdictCard({
      id: petition.petitionId,
      wish: petition.wish,
      status: petition.status,
      sacrifices: petition.sacrifices,
      pandit: petition.panditReply ?? "acha, the Algorithm is busy. sit for a minute, beta.",
      host: brandHostname(),
    }),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
      fonts,
      headers: {
        "Cache-Control": "public, immutable, max-age=31536000",
        ...(download ? { "Content-Disposition": `attachment; filename="petition-${id}.png"` } : {}),
      },
    },
  );
}
