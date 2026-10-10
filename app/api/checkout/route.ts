// Assumptions: the existing petition offering checkout (PWYW, whole dollars 10-500, one-time), posted by the
// form on /verdict/<id>. Parse first so every error can return to that verdict with a notice; then rate limit
// 5 per 10 minutes per hashed IP. The amount is validated server-side and sent as customPrice (>= 1000 cents);
// the visa wish has its own checkout inside /api/wish and never uses this route. Never a subscription.

import { appUrl } from "@/lib/env";
import { CheckoutUnavailableError, createPetitionCheckout } from "@/lib/lemon";
import { offeringAmountFromForm, offeringCents } from "@/lib/offering";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/monitor";
import { getPetition } from "@/lib/petitions";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeName } from "@/lib/sanitizeName";
import { isPetitionId } from "@/lib/soul-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Notice = "nap" | "rate" | "invalid" | "name" | "amount";

function back(petitionId: string | null, notice: Notice): Response {
  const target = petitionId ? `/verdict/${encodeURIComponent(petitionId)}?notice=${notice}#certificate` : `/?notice=upstream#wish`;
  return Response.redirect(`${appUrl()}${target}`, 303);
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(null, "invalid");
  }
  const rawId = form.get("petition_id");
  const petitionId = typeof rawId === "string" ? rawId.trim().toUpperCase() : "";
  if (!isPetitionId(petitionId)) return back(null, "invalid");

  const name = sanitizeName(form.get("name"));
  if (!name.ok) return back(petitionId, "name");

  const parsedAmount = offeringAmountFromForm(form.get("amount"), form.get("custom_amount"));
  if (!parsedAmount.ok) return back(petitionId, "amount");
  const dollars = parsedAmount.dollars;

  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return back(petitionId, "rate");

  const petition = await getPetition(petitionId);
  if (!petition) return back(petitionId, "invalid");

  try {
    const url = await createPetitionCheckout({ petitionId, name: name.value, amountCents: offeringCents(dollars) });
    logger.info("certificate checkout created", { petitionId });
    return Response.redirect(url, 303);
  } catch (error) {
    if (!(error instanceof CheckoutUnavailableError && error.reason === "not configured")) captureError(error, { petition_id: petitionId });
    return back(petitionId, "nap");
  }
}
