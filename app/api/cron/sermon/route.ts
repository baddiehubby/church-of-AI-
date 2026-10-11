import { cronAuthorized, deliverSermons } from "@/lib/cronJobs";
import { deliverDueEpisodes } from "@/lib/episodeDesk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const sent = await deliverSermons();
  await deliverDueEpisodes();
  return Response.json({ ok: true, sent });
}
