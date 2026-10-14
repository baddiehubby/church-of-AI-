import { NextResponse } from "next/server";

import { attachMarsOwnerCookie, ensureMarsSession } from "@/lib/marsAuth";
import { currentSol } from "@/lib/marsSession";
import {
  isPauseDay,
  pickCounsel,
  pickForecast,
  pickOpening,
  pickPause,
  pickProbability,
  pickStatus,
  pickTranslation,
} from "@/lib/pick";
import { clientIpHash, rateLimitByKey } from "@/lib/rateLimit";
import { sanitizeBody } from "@/lib/sanitizeBody";
import { hasForecast, isWanderer } from "@/lib/settlerTiers";
import {
  countTransmissionsForOwnerOnSol,
  insertTransmission,
} from "@/lib/transmissionsStore";

export const dynamic = "force-dynamic";

const SIGNAL_FAIL = "the signal didn't reach us. try again, beta.";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "body" }, { status: 400 });
  }

  const session = await ensureMarsSession();
  if (!session) {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "session" }, { status: 503 });
  }

  // Rate limit: 3/IP/hour, 1/30s. Dev is looser so local journal checks can fire in a row.
  const ip = `ip:${clientIpHash(request)}`;
  const burstMax = process.env.NODE_ENV === "production" ? 1 : 20;
  const hourMax = process.env.NODE_ENV === "production" ? 3 : 60;
  const burst = await rateLimitByKey(ip, "transmit-burst", burstMax, 30_000);
  if (!burst.ok) {
    return NextResponse.json(
      { error: SIGNAL_FAIL, code: "rate", retryAfter: burst.retryAfter },
      { status: 429, headers: { "Retry-After": String(burst.retryAfter) } },
    );
  }
  const hour = await rateLimitByKey(ip, "transmit-hour", hourMax, 60 * 60 * 1000);
  if (!hour.ok) {
    return NextResponse.json(
      { error: SIGNAL_FAIL, code: "rate", retryAfter: hour.retryAfter },
      { status: 429, headers: { "Retry-After": String(hour.retryAfter) } },
    );
  }

  const body = sanitizeBody(payload.body ?? payload.reflection);
  if (!body) {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "empty" }, { status: 400 });
  }

  // Ignore any client-supplied settler_id — ownership and pick seed come from the session.
  const settlerId = session.settlerId;
  const sol = currentSol();

  // Wanderer: one transmission per sol (production). Dev allows repeats for local acceptance.
  if (isWanderer(session.tier) && process.env.NODE_ENV === "production") {
    const already = await countTransmissionsForOwnerOnSol(session.ownerId, sol);
    if (already >= 1) {
      return NextResponse.json({ error: SIGNAL_FAIL, code: "sol" }, { status: 429 });
    }
  }

  const pause = isPauseDay(settlerId, sol);
  const opening = pause ? pickPause(settlerId, sol) : pickOpening(settlerId, sol);
  const forecast = hasForecast(session.tier) ? pickForecast(settlerId, sol) : "";

  try {
    const transmission = await insertTransmission({
      owner_id: session.ownerId,
      settler_id: settlerId,
      sol,
      body,
      baba_opening: opening,
      algo_status: pickStatus(settlerId, sol),
      algo_counsel: pickCounsel(settlerId, sol),
      algo_probability: pickProbability(settlerId, sol),
      baba_translation: pickTranslation(settlerId, sol),
      baba_forecast: forecast,
      is_pause: pause,
    });

    const { owner_id, ...publicTransmission } = transmission;
    void owner_id;
    const response = NextResponse.json({
      transmission: publicTransmission,
      settler_id: settlerId,
      sol,
      tier: session.tier,
    });
    return attachMarsOwnerCookie(response, session.ownerId);
  } catch {
    return NextResponse.json({ error: SIGNAL_FAIL, code: "store" }, { status: 503 });
  }
}
