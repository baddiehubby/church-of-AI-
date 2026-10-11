import { cronAuthorized, remindPoojas } from "@/lib/cronJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const sent = await remindPoojas();
  return Response.json({ ok: true, sent });
}
