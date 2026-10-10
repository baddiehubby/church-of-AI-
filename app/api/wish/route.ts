// Assumptions: the wish desk endpoint (JSON from the enhanced form, urlencoded without JS).
// Free categories: existing flow, AI reading generated now, rate limited 1 per 30s and 3 per hour per hashed IP,
// stored as a public petition, then /verdict/<id>.
// Visa categories: nothing is generated before payment. The validated wish is stored as a pending visa_wishes
// row keyed by an unguessable reference, then a Lemon checkout is created for the $10 variant with only that
// reference in custom data, rate limited like checkout (5 per 10 minutes). Missing config is a clear 503 message.
// Logs and Sentry never carry the wish text.

import { altar, type AltarErrorCode } from "@/content/landing";
import { visaOffer } from "@/content/visa";
import { generateVerdict } from "@/lib/algorithm";
import { appUrl } from "@/lib/env";
import { isRecord } from "@/lib/guards";
import { CheckoutUnavailableError, createVisaCheckout, visaCheckoutConfigured } from "@/lib/lemon";
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

function fail(wantsJson: boolean, code: AltarErrorCode | "unconfigured" | "visa_rate" | "nap", status: number, field?: string, retryAfter?: number) {
  const message =
    code === "unconfigured" ? visaOffer.errors.unconfigured : code === "visa_rate" ? visaOffer.errors.rate : code === "nap" ? visaOffer.errors.nap : altar.errors[code];
  const headers: Record<string, string> = retryAfter ? { "Retry-After": String(retryAfter) } : {};
  if (wantsJson) return Response.json({ error: message, code, ...(field ? { field } : {}) }, { status, headers });
  return Response.redirect(`${appUrl()}/?notice=${code}#wish`, 303);
}

async function readFields(request: Request, wantsJson: boolean): Promise<Fields | null> {
  if (wantsJson) {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  }
  const form = await request.formData();
  return { wish: form.get("wish"), category: form.get("category"), country: form.get("country"), firstName: form.get("firstName") };
}

async function visaCheckout(request: Request, parsed: WishSuccess, wantsJson: boolean): Promise<Response> {
  if (!visaCheckoutConfigured() || !visaStoreAvailable()) return fail(wantsJson, "unconfigured", 503);
  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return fail(wantsJson, "visa_rate", 429, undefined, limit.retryAfter);
  let pending: { referenceId: string; certificateNo: string };
  try {
    pending = await createPendingVisaWish({ categoryId: parsed.categoryId, country: parsed.country ?? "", wish: parsed.wish, firstName: parsed.firstName });
  } catch (error) {
    if (error instanceof VisaStoreUnavailable) return fail(wantsJson, "unconfigured", 503);
    logger.error("visa pending insert failed");
    captureError(error);
    return fail(wantsJson, "upstream", 503);
  }
  try {
    const url = await createVisaCheckout(pending);
    logger.info("visa checkout created", { certificateNo: pending.certificateNo });
    if (wantsJson) return Response.json({ checkoutUrl: url });
    return Response.redirect(url, 303);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError && error.reason === "not configured") return fail(wantsJson, "unconfigured", 503);
    captureError(error, { certificate_no: pending.certificateNo });
    return fail(wantsJson, "nap", 503);
  }
}

async function freeReading(request: Request, parsed: WishSuccess, wantsJson: boolean): Promise<Response> {
  const burst = await rateLimit(request, "wish-burst", 1, 30_000);
  if (!burst.ok) return fail(wantsJson, "rate", 429, undefined, burst.retryAfter);
  const limit = await rateLimit(request, "wish", 3, 60 * 60 * 1000);
  if (!limit.ok) return fail(wantsJson, "rate", 429, undefined, limit.retryAfter);

  const safe = await generateVerdict(parsed.wish, { category: parsed.categoryLabel });
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
  const done = () => (wantsJson ? Response.json({ petitionId }) : Response.redirect(`${appUrl()}/verdict/${petitionId}`, 303));

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
    return done();
  }

  const service = getServiceClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await service.from("petitions").insert({ ...row, petition_id: petitionId });
    if (!error) return done();
    if (error.code === "23505") {
      petitionId = generatePetitionId();
      continue;
    }
    captureError(new Error(`petition insert failed: ${error.code}`), { petition_id: petitionId });
    return fail(wantsJson, "upstream", 503);
  }
  return fail(wantsJson, "upstream", 503);
}

export async function POST(request: Request) {
  const wantsJson = (request.headers.get("content-type") ?? "").includes("application/json");
  let fields: Fields | null;
  try {
    fields = await readFields(request, wantsJson);
  } catch {
    return fail(wantsJson, "upstream", 400);
  }
  if (!fields) return fail(wantsJson, "upstream", 400);

  const parsed = parseWishInput({ wish: fields.wish, category: fields.category, country: fields.country, firstName: fields.firstName });
  if (!parsed.ok) return fail(wantsJson, parsed.code, 400, parsed.field);

  return parsed.kind === "visa" ? visaCheckout(request, parsed, wantsJson) : freeReading(request, parsed, wantsJson);
}
