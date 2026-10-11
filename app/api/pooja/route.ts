import { poojaErrors } from "@/content/congregation";
import { canPersistSoul, currentSoul, ensureGuest, recordPooja } from "@/lib/congregation";
import { isRecord } from "@/lib/guards";
import { isMood, type Mood } from "@/lib/moods";
import { isCrisisText, poojaExchange } from "@/lib/poojaLine";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeReflection } from "@/lib/reflection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const limit = await rateLimit(request, "pooja", 10, 60_000);
  if (!limit.ok) return Response.json({ error: poojaErrors.rate, code: "rate" }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    const json: unknown = await request.json();
    if (!isRecord(json)) return Response.json({ error: poojaErrors.upstream }, { status: 400 });
    body = json;
  } catch {
    return Response.json({ error: poojaErrors.upstream }, { status: 400 });
  }
  const mood = body.mood == null || body.mood === "" ? null : isMood(body.mood) ? body.mood : false;
  if (mood === false) return Response.json({ error: poojaErrors.mood, code: "mood" }, { status: 400 });
  let reflection = "";
  if (typeof body.reflection === "string" && body.reflection.trim()) {
    const cleaned = sanitizeReflection(body.reflection);
    if (!cleaned.ok) return Response.json({ error: poojaErrors[cleaned.code], code: cleaned.code }, { status: 400 });
    reflection = cleaned.value;
  } else if (mood) reflection = mood;
  else return Response.json({ error: poojaErrors.empty, code: "empty" }, { status: 400 });

  const chosen = mood as Mood | null;
  if (!canPersistSoul()) {
    const lines = poojaExchange({ mood: chosen, seed: reflection, mourned: false, extra: false, remember: false, crisis: isCrisisText(reflection) });
    return Response.json({ ok: true, saved: false, algo: lines.algo, pandit: lines.pandit, crisis: isCrisisText(reflection), reflection });
  }
  const soul = (await currentSoul()) ?? (await ensureGuest());
  if (!soul) {
    const lines = poojaExchange({ mood: chosen, seed: reflection, mourned: false, extra: false, remember: false, crisis: isCrisisText(reflection) });
    return Response.json({ ok: true, saved: false, algo: lines.algo, pandit: lines.pandit, crisis: isCrisisText(reflection), reflection });
  }
  const result = await recordPooja({ soul, mood: chosen, reflection });
  if (!result.ok) {
    const status = result.code === "already" ? 409 : 503;
    return Response.json({ error: poojaErrors[result.code], code: result.code }, { status });
  }
  return Response.json({
    ok: true,
    saved: true,
    soulId: result.soul.userId,
    streakCurrent: result.soul.streakCurrent,
    streakLongest: result.soul.streakLongest,
    mourned: result.mourned,
    brokenFrom: result.brokenFrom,
    extra: result.extra,
    crisis: result.crisis,
    algo: result.pooja.algoResponse,
    pandit: result.pooja.panditNod,
    reflection: result.pooja.reflection,
  });
}
