import { altar } from "@/content/landing";
import { addWishReading, hasPremium, listWishEntries } from "@/lib/premium";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeWish } from "@/lib/sanitizeWish";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const missing = () => new Response(null, { status: 404 });

export async function GET(): Promise<Response> {
  const session = await readSession();
  if (!session) return missing();
  if (!(await hasPremium(session.profileId))) return Response.json({ entries: [], gated: true });
  const entries = await listWishEntries(session.profileId);
  return Response.json({ entries: entries ?? [] });
}

export async function POST(request: Request): Promise<Response> {
  const session = await readSession();
  if (!session) return missing();
  const limit = await rateLimit(request, "wish", 3, 60 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: altar.errors.rate }, { status: 429 });
  const body = (await request.json()) as { wish?: unknown; category?: unknown; entryId?: unknown };
  const cleaned = sanitizeWish(body.wish);
  if (!cleaned.ok) return Response.json({ error: altar.errors[cleaned.code], field: "wish" }, { status: 400 });
  const entryId = typeof body.entryId === "string" ? body.entryId : null;
  const category = typeof body.category === "string" ? body.category : null;
  const entry = await addWishReading({ profileId: session.profileId, wish: cleaned.value, category, entryId });
  if (!entry) return missing();
  return Response.json({ entryId: entry.id });
}
