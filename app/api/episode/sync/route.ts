import { rateLimit } from "@/lib/rateLimit";
import { deliverEpisodeDesk, saveEpisodeDesk } from "@/lib/episodeDesk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

export async function POST(request: Request): Promise<Response> {
  const limited = await rateLimit(request, "episode", 20, HOUR);
  if (!limited.ok) return Response.json({ error: "THE DESK IS CLOSED FOR AN HOUR." }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "THE LINE IS EMPTY." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "THE LINE IS EMPTY." }, { status: 400 });
  const record = body as { id?: unknown; email?: unknown; timezone?: unknown; sittings?: unknown };
  const saved = saveEpisodeDesk({
    id: typeof record.id === "string" ? record.id : "",
    email: typeof record.email === "string" ? record.email : "",
    timezone: typeof record.timezone === "string" ? record.timezone : "UTC",
    sittings: Array.isArray(record.sittings) ? record.sittings : [],
  });
  if (!saved) return Response.json({ error: "THE LINE IS EMPTY." }, { status: 400 });
  const sent = await deliverEpisodeDesk(typeof record.id === "string" ? record.id : "");
  return Response.json({ ok: true, sent });
}
