import { NextResponse } from "next/server";

import { offeringsCopy, offeringTiers, type OfferingTier } from "@/content/offerings";
import { createBlessingDraft } from "@/lib/blessingsStore";
import { requestOrigin } from "@/lib/requestOrigin";
import { CheckoutUnavailableError, createMarsOfferingCheckout, marsOfferingConfigured } from "@/lib/lemon";
import { isOfferingTier, marsConfigMissing } from "@/lib/marsOfferings";
import { sanitizeName } from "@/lib/sanitizeName";
import { sanitizeWish } from "@/lib/sanitizeWish";
import { isPetitionId } from "@/lib/soul-id";
import { dayOfYear } from "@/lib/sceneFrame";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = {
  tier?: unknown;
  user_id?: unknown;
  sol?: unknown;
  name?: unknown;
  message?: unknown;
};

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function jsonError(code: string, error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

function redirect(origin: string, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, origin), 303);
}

async function readBody(request: Request): Promise<CheckoutBody> {
  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    try {
      return (await request.json()) as CheckoutBody;
    } catch {
      return {};
    }
  }
  const form = await request.formData();
  return {
    tier: form.get("tier"),
    user_id: form.get("user_id"),
    sol: form.get("sol"),
    name: form.get("name"),
    message: form.get("message"),
  };
}

export async function POST(request: Request): Promise<Response> {
  const origin = requestOrigin(request);
  const asJson = wantsJson(request);
  const body = await readBody(request);

  const tierRaw = String(body.tier ?? "");
  if (!isOfferingTier(tierRaw)) {
    return asJson
      ? jsonError("tier", offeringsCopy.checkoutError, 400)
      : redirect(origin, "/offerings?notice=offering");
  }
  const tier: OfferingTier = tierRaw;
  const spec = offeringTiers[tier];

  if (!marsOfferingConfigured(tier)) {
    const missing = marsConfigMissing(tier);
    return asJson
      ? jsonError("desk", offeringsCopy.deskClosed, 503, {
          missing: process.env.NODE_ENV === "development" ? missing : undefined,
        })
      : redirect(origin, "/offerings?notice=desk");
  }

  const soulRaw = String(body.user_id ?? "").trim().toUpperCase();
  if (!isPetitionId(soulRaw)) {
    return asJson
      ? jsonError("session", "a settler session id is required.", 400)
      : redirect(origin, "/offerings?notice=offering");
  }

  const solRaw = Number(body.sol ?? dayOfYear());
  const sol = Number.isInteger(solRaw) && solRaw > 0 ? solRaw : dayOfYear();

  let name = "settler";
  if (spec.requiresName) {
    const named = sanitizeName(body.name);
    if (!named.ok) {
      return asJson
        ? jsonError("name", offeringsCopy.needName, 400)
        : redirect(origin, "/offerings?notice=name");
    }
    name = named.value;
  } else if (typeof body.name === "string" && body.name.trim()) {
    const named = sanitizeName(body.name);
    if (named.ok) name = named.value;
  }

  let message: string | null = null;
  if (spec.requiresMessage) {
    const cleaned = sanitizeWish(body.message);
    if (!cleaned.ok) {
      return asJson
        ? jsonError("message", offeringsCopy.needMessage, 400)
        : redirect(origin, "/offerings?notice=message");
    }
    message = cleaned.value;
  }

  // Never accept browser-supplied prices or payment status.
  const rawKeys = body as Record<string, unknown>;
  if ("amount" in rawKeys || "amountCents" in rawKeys || "price" in rawKeys || "status" in rawKeys || "paid" in rawKeys) {
    return asJson
      ? jsonError("price", offeringsCopy.checkoutError, 400)
      : redirect(origin, "/offerings?notice=offering");
  }

  try {
    const draft = await createBlessingDraft({
      userId: soulRaw,
      tier,
      name,
      sol,
      message,
    });
    const url = await createMarsOfferingCheckout({
      tier,
      blessingId: draft.id,
      userId: soulRaw,
      sol,
      name,
      origin,
    });
    if (asJson) return NextResponse.json({ url, orderId: draft.id });
    return NextResponse.redirect(url, 303);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError && error.reason === "not configured") {
      return asJson
        ? jsonError("desk", offeringsCopy.deskClosed, 503)
        : redirect(origin, "/offerings?notice=desk");
    }
    return asJson
      ? jsonError("checkout", offeringsCopy.checkoutError, 503)
      : redirect(origin, `/offerings?notice=offering`);
  }
}
