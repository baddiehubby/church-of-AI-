import { isRecord } from "@/lib/guards";
import { createShareCard } from "@/lib/premium";
import { rateLimit } from "@/lib/rateLimit";
import { readSession } from "@/lib/session";

const missing = () => new Response(null, { status: 404 });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await readSession();
  if (!session) return missing();
  const limit = await rateLimit(request, "share", 10, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: "slow down" }, { status: 429 });
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  const includeWish = isRecord(body) && body.includeWish === true;
  const card = await createShareCard({ entryId: id, profileId: session.profileId, includeWish });
  if (!card) return missing();
  return Response.json({ publicId: card.publicId });
}
