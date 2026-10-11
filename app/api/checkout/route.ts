// Assumptions: the existing petition offering checkout (PWYW, whole dollars 10-500, one-time), posted by the
// form on /verdict/<id> and used by the visa-desk blessing ($10, kind certificate). Parse first so every error
// can return to that verdict with a notice; then rate limit 5 per 10 minutes per hashed IP. The amount is
// validated server-side and sent as customPrice (>= 1000 cents). The optional Visa Wish Certificate stays on
// /api/wish with its own variant. Never a subscription.
// Notice redirects use the request origin when NEXT_PUBLIC_URL is empty or a foreign host.

import { rateLimitCopy } from "@/content/safety";
import { certificateOffer, verdictPage } from "@/content/verdict";
import { CheckoutUnavailableError, createPetitionCheckout } from "@/lib/lemon";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/monitor";
import { offeringAmountFromForm, offeringCents } from "@/lib/offering";
import { getPetition } from "@/lib/petitions";
import { rateLimit } from "@/lib/rateLimit";
import { localRedirect, safeRedirectOrigin } from "@/lib/requestOrigin";
import { sanitizeName } from "@/lib/sanitizeName";
import { isPetitionId } from "@/lib/soul-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Notice = "nap" | "rate" | "invalid" | "name" | "amount";

const noticeCopy: Record<Notice, string> = {
  nap: verdictPage.notices.nap,
  rate: verdictPage.notices.rate,
  invalid: verdictPage.notices.invalid,
  name: certificateOffer.nameError,
  amount: certificateOffer.amountError,
};

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

function back(request: Request, petitionId: string | null, notice: Notice, status = 303, retryAfter?: number): Response {
  if (wantsJson(request)) {
    const code = notice === "nap" ? 503 : notice === "rate" ? 429 : 400;
    const error = notice === "rate" ? rateLimitCopy.checkout : notice === "nap" ? noticeCopy.nap : noticeCopy[notice];
    const headers: Record<string, string> = retryAfter ? { "Retry-After": String(retryAfter) } : {};
    return Response.json({ error, code: notice }, { status: code, headers });
  }
  const target = petitionId ? `/verdict/${encodeURIComponent(petitionId)}?notice=${notice}#certificate` : `/wish?notice=upstream#wish`;
  return localRedirect(request, target, status);
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, null, "invalid");
  }
  const rawId = form.get("petition_id");
  const petitionId = typeof rawId === "string" ? rawId.trim().toUpperCase() : "";
  if (!isPetitionId(petitionId)) return back(request, null, "invalid");

  const name = sanitizeName(form.get("name"));
  if (!name.ok) return back(request, petitionId, "name");

  const parsedAmount = offeringAmountFromForm(form.get("amount"), form.get("custom_amount"));
  if (!parsedAmount.ok) return back(request, petitionId, "amount");
  const dollars = parsedAmount.dollars;

  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return back(request, petitionId, "rate", 303, limit.retryAfter);

  const petition = await getPetition(petitionId);
  if (!petition) return back(request, petitionId, "invalid");

  try {
    const url = await createPetitionCheckout({
      petitionId,
      name: name.value,
      amountCents: offeringCents(dollars),
      origin: safeRedirectOrigin(request),
    });
    logger.info("certificate checkout created", { petitionId });
    if (wantsJson(request)) return Response.json({ checkoutUrl: url });
    return Response.redirect(url, 303);
  } catch (error) {
    if (!(error instanceof CheckoutUnavailableError && error.reason === "not configured")) {
      captureError(error, { petition_id: petitionId, soul_id: petitionId, event_name: "checkout" });
    }
    return back(request, petitionId, "nap");
  }
}
