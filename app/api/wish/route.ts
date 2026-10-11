// Assumptions: the wish desk endpoint (JSON from the enhanced form, urlencoded without JS).
// Free categories: existing flow, AI reading generated now, rate limited 1 per 30s and 3 per hour per hashed IP,
// stored as a public petition, then /verdict/<id>.
// Visa categories: the primary intent is a $10 blessing on the offering/certificate variant. The wish is filed
// as a petition, then createPetitionCheckout runs at 1000 cents (kind certificate). An optional intent=visa
// still uses the Visa Wish Certificate variant when that env is set. Missing Lemon config is an in-page bowl
// message, never a bounce to another host. Logs and Sentry never carry the wish text.

import { altar, type AltarErrorCode } from "@/content/landing";
import { currentSoul, linkWish, wishGate } from "@/lib/congregation";
import { visaOffer } from "@/content/visa";
import { BLESSING_CENTS, resolveVisaSubmitIntent } from "@/lib/altarCheckout";
import { generateVerdict } from "@/lib/algorithm";
import { occupiedFallback } from "@/lib/fallbackVerdict";
import { isRecord } from "@/lib/guards";
import {
  CheckoutUnavailableError,
  createPetitionCheckout,
  createVisaCheckout,
  petitionCheckoutConfigured,
  visaCheckoutConfigured,
} from "@/lib/lemon";
import { localRedirect, safeRedirectOrigin } from "@/lib/requestOrigin";
import { saveLocalPetition } from "@/lib/local-petitions";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/monitor";
import { parseWishInput, type WishSuccess } from "@/lib/petitionInput";
import { rateLimit } from "@/lib/rateLimit";
import { generatePetitionId } from "@/lib/soul-id";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { createPendingVisaWish, VisaStoreUnavailable, visaStoreAvailable } from "@/lib/visaWishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Fields = Record<string, unknown>;

function fail(
  request: Request,
  wantsJson: boolean,
  code: AltarErrorCode | "unconfigured" | "visa_rate" | "nap",
  status: number,
  field?: string,
  retryAfter?: number,
) {
  const message =
    code === "unconfigured" ? visaOffer.errors.unconfigured : code === "visa_rate" ? visaOffer.errors.rate : code === "nap" ? visaOffer.errors.nap : altar.errors[code];
  const headers: Record<string, string> = retryAfter ? { "Retry-After": String(retryAfter) } : {};
  if (wantsJson) return Response.json({ error: message, code, ...(field ? { field } : {}) }, { status, headers });
  return localRedirect(request, `/wish?notice=${code}#wish`);
}

async function readFields(request: Request, wantsJson: boolean): Promise<Fields | null> {
  if (wantsJson) {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  }
  const form = await request.formData();
  return {
    wish: form.get("wish"),
    category: form.get("category"),
    country: form.get("country"),
    firstName: form.get("firstName"),
    intent: form.get("intent"),
  };
}

type WishFlags = { userId: string; priority: boolean; urgent: boolean } | null;

async function rememberWish(
  petitionId: string,
  parsed: WishSuccess,
  verdict: { algo_status: string; algo_sacrifices: readonly string[]; algo_counsel: string; algo_probability: string; pandit_reply: string },
  flags: WishFlags,
): Promise<void> {
  if (!flags) return;
  await linkWish({
    userId: flags.userId,
    petitionId,
    wish: parsed.wish,
    category: parsed.categoryId,
    algoStatus: verdict.algo_status,
    algoSacrifices: [...verdict.algo_sacrifices],
    algoCounsel: verdict.algo_counsel,
    algoProbability: verdict.algo_probability,
    panditReply: verdict.pandit_reply,
    priority: flags.priority,
    urgent: flags.urgent,
  });
}

async function saveWishPetition(parsed: WishSuccess, flags: WishFlags = null): Promise<string | null> {
  let safe;
  try {
    safe = await generateVerdict(parsed.wish, {
      category: parsed.categoryLabel,
      country: parsed.country,
      visa: parsed.kind === "visa",
    });
  } catch (error) {
    captureError(error);
    safe = occupiedFallback();
  }
  let petitionId = generatePetitionId();
  const row = {
    wish: parsed.wish,
    category: parsed.categoryId,
    algo_status: safe.algo_status,
    algo_sacrifices: safe.algo_sacrifices,
    algo_counsel: safe.algo_counsel,
    algo_probability: safe.algo_probability,
    pandit_reply: safe.pandit_reply,
  };

  if (!isSupabaseConfigured()) {
    saveLocalPetition({
      petitionId,
      wish: parsed.wish,
      category: parsed.categoryId,
      status: safe.algo_status,
      sacrifices: [...safe.algo_sacrifices],
      counsel: safe.algo_counsel,
      probability: safe.algo_probability,
      panditReply: safe.pandit_reply,
      createdAt: new Date().toISOString(),
    });
    await rememberWish(petitionId, parsed, safe, flags);
    return petitionId;
  }

  const service = getServiceClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await service.from("petitions").insert({ ...row, petition_id: petitionId });
    if (!error) {
      await rememberWish(petitionId, parsed, safe, flags);
      return petitionId;
    }
    if (error.code === "23505") {
      petitionId = generatePetitionId();
      continue;
    }
    captureError(new Error(`petition insert failed: ${error.code}`), { petition_id: petitionId, soul_id: petitionId });
    return null;
  }
  return null;
}

async function blessingCheckout(request: Request, parsed: WishSuccess, wantsJson: boolean, flags: WishFlags = null): Promise<Response> {
  if (!petitionCheckoutConfigured()) return fail(request, wantsJson, "unconfigured", 503);
  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return fail(request, wantsJson, "visa_rate", 429, undefined, limit.retryAfter);
  const petitionId = await saveWishPetition(parsed, flags);
  if (!petitionId) return fail(request, wantsJson, "upstream", 503);
  try {
    const url = await createPetitionCheckout({
      petitionId,
      name: parsed.firstName ?? "Friend",
      amountCents: BLESSING_CENTS,
      origin: safeRedirectOrigin(request),
    });
    logger.info("blessing checkout created", { petitionId });
    if (wantsJson) return Response.json({ checkoutUrl: url });
    return Response.redirect(url, 303);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError && error.reason === "not configured") return fail(request, wantsJson, "unconfigured", 503);
    captureError(error, { petition_id: petitionId, soul_id: petitionId });
    return fail(request, wantsJson, "nap", 503);
  }
}

async function visaCheckout(request: Request, parsed: WishSuccess, wantsJson: boolean, flags: WishFlags = null): Promise<Response> {
  if (!visaCheckoutConfigured() || !visaStoreAvailable()) return blessingCheckout(request, parsed, wantsJson, flags);
  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return fail(request, wantsJson, "visa_rate", 429, undefined, limit.retryAfter);
  let pending: { referenceId: string; certificateNo: string };
  try {
    pending = await createPendingVisaWish({ categoryId: parsed.categoryId, country: parsed.country ?? "", wish: parsed.wish, firstName: parsed.firstName });
  } catch (error) {
    if (error instanceof VisaStoreUnavailable) return blessingCheckout(request, parsed, wantsJson, flags);
    logger.error("visa pending insert failed");
    captureError(error);
    return fail(request, wantsJson, "upstream", 503);
  }
  try {
    const url = await createVisaCheckout({ ...pending, origin: safeRedirectOrigin(request) });
    logger.info("visa checkout created", { certificateNo: pending.certificateNo });
    if (wantsJson) return Response.json({ checkoutUrl: url });
    return Response.redirect(url, 303);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError && error.reason === "not configured") return blessingCheckout(request, parsed, wantsJson, flags);
    captureError(error, { reference_id: pending.referenceId });
    return fail(request, wantsJson, "nap", 503);
  }
}

async function freeReading(request: Request, parsed: WishSuccess, wantsJson: boolean, flags: WishFlags = null): Promise<Response> {
  const petitionId = await saveWishPetition(parsed, flags);
  if (!petitionId) return fail(request, wantsJson, "upstream", 503);
  return wantsJson ? Response.json({ petitionId }) : localRedirect(request, `/verdict/${petitionId}`);
}

export async function POST(request: Request) {
  const wantsJson = (request.headers.get("content-type") ?? "").includes("application/json");
  let fields: Fields | null;
  try {
    fields = await readFields(request, wantsJson);
  } catch {
    return fail(request, wantsJson, "upstream", 400);
  }
  if (!fields) return fail(request, wantsJson, "upstream", 400);

  const parsed = parseWishInput({ wish: fields.wish, category: fields.category, country: fields.country, firstName: fields.firstName });
  if (!parsed.ok) return fail(request, wantsJson, parsed.code, 400, parsed.field);

  const burst = await rateLimit(request, "wish-burst", 1, 30_000);
  if (!burst.ok) return fail(request, wantsJson, "rate", 429, undefined, burst.retryAfter);

  let flags: WishFlags = null;
  try {
    const soul = await currentSoul();
    if (soul) {
      const gate = await wishGate(soul);
      if (!gate.ok) return fail(request, wantsJson, "weekly", 429);
      flags = { userId: soul.userId, priority: gate.priority, urgent: gate.urgent };
    }
  } catch {
    flags = null;
  }

  if (!flags?.priority) {
    const hour = await rateLimit(request, "wish", 3, 60 * 60 * 1000);
    if (!hour.ok) return fail(request, wantsJson, "rate", 429, undefined, hour.retryAfter);
  }

  if (parsed.kind !== "visa") return freeReading(request, parsed, wantsJson, flags);
  const intent = resolveVisaSubmitIntent(fields.intent, visaCheckoutConfigured() && visaStoreAvailable());
  return intent === "visa" ? visaCheckout(request, parsed, wantsJson, flags) : blessingCheckout(request, parsed, wantsJson, flags);
}
