import { altarErrors } from "@/content/altarScene";
import { poojaErrors } from "@/content/congregation";
import { AltarDeskClosed, crisisAltarReading, generateAltarReading, readCachedReading } from "@/lib/altarReading";
import { ensureGuest, updateSoul } from "@/lib/congregation";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { isCrisisText } from "@/lib/poojaLine";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeReflection } from "@/lib/reflection";
import { canSit } from "@/lib/seat";
import { atLeast } from "@/lib/tiers";
import { safeZone } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: altarErrors.upstream, code: "upstream" }, { status: 400 });
  }
  if (!isRecord(body)) return Response.json({ error: altarErrors.upstream, code: "upstream" }, { status: 400 });
  const cleaned = sanitizeReflection(body.reflection);
  if (!cleaned.ok) {
    const error = cleaned.code === "empty" ? altarErrors.empty : poojaErrors[cleaned.code];
    return Response.json({ error, code: cleaned.code }, { status: 400 });
  }
  if (isCrisisText(cleaned.value)) return Response.json(crisisAltarReading());
  const soul = await ensureGuest();
  const zone = safeZone(typeof body.timezone === "string" ? body.timezone : soul?.timezone);
  const now = new Date();
  if (soul && !canSit({ tier: soul.tier, lastPoojaAt: soul.lastPoojaAt, now, timeZone: zone })) {
    return Response.json({ error: poojaErrors.already, code: "already" }, { status: 429 });
  }
  const cached = readCachedReading(cleaned.value);
  if (cached) {
    if (soul) await updateSoul(soul.userId, { lastPoojaAt: now.toISOString(), timezone: zone, timezoneSet: true }).catch(() => null);
    return Response.json(cached);
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return Response.json({ error: altarErrors.unconfigured, code: "unconfigured" }, { status: 503 });
  }
  if (!soul || !atLeast(soul.tier, "believer")) {
    const limit = await rateLimit(request, "altar", 3, HOUR_MS);
    if (!limit.ok) {
      return Response.json({ error: altarErrors.rate, code: "rate" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    }
  }
  try {
    const reading = await generateAltarReading(cleaned.value);
    if (!reading) return Response.json({ error: altarErrors.upstream, code: "upstream" }, { status: 503 });
    if (soul) await updateSoul(soul.userId, { lastPoojaAt: now.toISOString(), timezone: zone, timezoneSet: true }).catch(() => null);
    return Response.json(reading);
  } catch (error) {
    if (error instanceof AltarDeskClosed) {
      return Response.json({ error: altarErrors.unconfigured, code: "unconfigured" }, { status: 503 });
    }
    logger.error("altar reading failed");
    return Response.json({ error: altarErrors.upstream, code: "upstream" }, { status: 503 });
  }
}
