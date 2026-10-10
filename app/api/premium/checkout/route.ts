import { premium } from "@/content/premium";
import { isRecord } from "@/lib/guards";
import { CheckoutUnavailableError, createPremiumCheckout, premiumCheckoutConfigured } from "@/lib/lemon";
import { captureError } from "@/lib/monitor";
import { premiumConsentGiven } from "@/lib/premiumConsent";
import { rateLimit } from "@/lib/rateLimit";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function consentFrom(request: Request): Promise<boolean> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    const body: unknown = await request.json().catch(() => null);
    return premiumConsentGiven(isRecord(body) ? body.consent : undefined);
  }
  try {
    const form = await request.formData();
    return premiumConsentGiven(form.get("consent"));
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await readSession();
  const wantsJson = (request.headers.get("content-type") ?? "").includes("json") || (request.headers.get("accept") ?? "").includes("json");
  if (!session) {
    if (wantsJson) return Response.json({ error: premium.errors.auth }, { status: 401 });
    return Response.redirect(new URL("/login", request.url), 303);
  }
  const consented = await consentFrom(request);
  if (!consented) {
    if (wantsJson) return Response.json({ error: premium.errors.consent, code: "consent" }, { status: 400 });
    return Response.redirect(new URL("/premium?notice=consent", request.url), 303);
  }
  if (!premiumCheckoutConfigured()) {
    if (wantsJson) return Response.json({ error: premium.errors.unconfigured, code: "unconfigured" }, { status: 503 });
    return Response.redirect(new URL("/premium", request.url), 303);
  }
  const limit = await rateLimit(request, "checkout", 5, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: premium.errors.rate }, { status: 429 });
  try {
    const url = await createPremiumCheckout({ profileId: session.profileId, email: session.email });
    if (wantsJson) return Response.json({ checkoutUrl: url });
    return Response.redirect(url, 303);
  } catch (error) {
    if (!(error instanceof CheckoutUnavailableError && error.reason === "not configured")) {
      captureError(error, { subscription_id: session.profileId });
    }
    return Response.json({ error: premium.errors.nap }, { status: 503 });
  }
}
