import { deleteWishEntry, getWishEntry } from "@/lib/premium";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const missing = () => new Response(null, { status: 404 });

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await readSession();
  const { id } = await context.params;
  if (!session) return missing();
  const existing = await getWishEntry(id, session.profileId);
  if (!existing) return missing();
  await deleteWishEntry(id, session.profileId);
  return Response.json({ ok: true });
}
