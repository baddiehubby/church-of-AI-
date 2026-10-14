// Assumptions: one Lemon Squeezy integration, three variants. LEMON_SQUEEZY_VARIANT_ID is the existing
// pay-what-you-want petition offering and the visa-desk $10 blessing (customPrice in cents, $10-$500, one-time,
// kind certificate). LEMON_SQUEEZY_VISA_VARIANT_ID is the optional $10 Visa Wish Certificate.
// LEMON_SQUEEZY_PREMIUM_VARIANT_ID is the $10/month subscription. Visa and Premium never send customPrice.
// Visa custom data carries only { kind: "visa", reference_id }; the wish text never leaves the server.
// The SDK has no abort option, so a 5s timeout races the request. Every failure is CheckoutUnavailableError
// (reason "not configured" when env is missing) so routes can show the right in-page message.

import "server-only";

import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import { checkoutProduct } from "@/content/checkout";
import { CHECKOUT_VARIANT_ENV } from "@/lib/checkoutKinds";
import type { OfferingTier } from "@/content/offerings";
import {
  appUrl,
  lemonApiKey,
  lemonConfig,
  marsOfferingConfig,
  premiumLemonConfig,
  redPathOfferingConfig,
  seatLemonConfig,
  visaLemonConfig,
  type SeatTier,
} from "@/lib/env";
import { isRecord } from "@/lib/guards";
import { OFFERING_MIN_CENTS } from "@/lib/offering";
import { logger } from "@/lib/logger";
import { isSubscriptionCheckout, type CheckoutTier } from "@/lib/redPathOfferings";

const TIMEOUT_MS = 5_000;

export class CheckoutUnavailableError extends Error {
  readonly reason: "not configured" | "timeout" | "request failed" | "api error" | "no url";

  constructor(reason: CheckoutUnavailableError["reason"]) {
    super(`checkout unavailable: ${reason}`);
    this.name = "CheckoutUnavailableError";
    this.reason = reason;
  }
}

let configuredKey: string | null = null;

function setup(apiKey: string): void {
  if (configuredKey === apiKey) return;
  lemonSqueezySetup({ apiKey });
  configuredKey = apiKey;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CheckoutUnavailableError("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

type CheckoutOptions = Parameters<typeof createCheckout>[2];

async function runCheckout(
  config: { apiKey: string; storeId: string; variantId: string },
  options: CheckoutOptions,
  logIds: Record<string, string>,
): Promise<string> {
  setup(config.apiKey);
  let result: Awaited<ReturnType<typeof createCheckout>>;
  try {
    result = await withTimeout(createCheckout(config.storeId, config.variantId, options), TIMEOUT_MS);
  } catch (error) {
    if (error instanceof CheckoutUnavailableError) {
      logger.warn("lemon checkout timeout", logIds);
      throw error;
    }
    logger.error("lemon checkout threw", logIds);
    throw new CheckoutUnavailableError("request failed");
  }
  if (result.error) {
    logger.error("lemon checkout failed", { ...logIds, status: result.statusCode ?? 0 });
    throw new CheckoutUnavailableError("api error");
  }
  const url = result.data.data.attributes.url;
  if (typeof url !== "string" || !url.startsWith("https://")) throw new CheckoutUnavailableError("no url");
  return url;
}

const checkoutLook = { buttonColor: "#6E1E23", buttonTextColor: "#F2EDE4", dark: true } as const;

export function petitionCheckoutConfigured(): boolean {
  return lemonConfig() !== null;
}

export function visaCheckoutConfigured(): boolean {
  return visaLemonConfig() !== null;
}

export function premiumCheckoutConfigured(): boolean {
  return premiumLemonConfig() !== null;
}

export function tipCheckoutVariantEnv(): typeof CHECKOUT_VARIANT_ENV.certificate {
  return CHECKOUT_VARIANT_ENV.certificate;
}

function checkoutOrigin(origin: string | undefined): string {
  const trimmed = origin?.trim().replace(/\/+$/, "") ?? "";
  return trimmed || appUrl();
}

export async function createPetitionCheckout(input: {
  petitionId: string;
  name: string;
  amountCents: number;
  origin?: string;
}): Promise<string> {
  const config = lemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  if (!Number.isInteger(input.amountCents) || input.amountCents < OFFERING_MIN_CENTS) {
    throw new CheckoutUnavailableError("request failed");
  }
  const origin = checkoutOrigin(input.origin);
  const id = encodeURIComponent(input.petitionId);
  return runCheckout(
    config,
    {
      customPrice: input.amountCents,
      productOptions: {
        redirectUrl: `${origin}/certificate/${id}`,
        receiptLinkUrl: `${origin}/certificate/${id}`,
        receiptButtonText: checkoutProduct.receiptButton,
      },
      checkoutOptions: checkoutLook,
      checkoutData: { custom: { kind: "certificate", petition_id: input.petitionId, name: input.name } },
    },
    { petitionId: input.petitionId },
  );
}

export async function createVisaCheckout(input: { referenceId: string; certificateNo: string; origin?: string }): Promise<string> {
  const config = visaLemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  const link = `${checkoutOrigin(input.origin)}/visa/${encodeURIComponent(input.referenceId)}`;
  return runCheckout(
    config,
    {
      productOptions: {
        redirectUrl: link,
        receiptLinkUrl: link,
        receiptButtonText: checkoutProduct.visaReceiptButton,
      },
      checkoutOptions: checkoutLook,
      checkoutData: { custom: { kind: "visa", reference_id: input.referenceId } },
    },
    { certificateNo: input.certificateNo },
  );
}

export async function createPremiumCheckout(input: { profileId: string; email: string; origin?: string }): Promise<string> {
  const config = premiumLemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  const origin = checkoutOrigin(input.origin);
  return runCheckout(
    config,
    {
      productOptions: {
        redirectUrl: `${origin}/journal`,
        receiptLinkUrl: `${origin}/journal`,
        receiptButtonText: checkoutProduct.premiumReceiptButton,
      },
      checkoutOptions: checkoutLook,
      checkoutData: { email: input.email, custom: { kind: "premium", profile_id: input.profileId } },
    },
    { profileId: input.profileId },
  );
}

export function marsOfferingConfigured(tier: OfferingTier): boolean {
  return marsOfferingConfig(tier) !== null;
}

export function redPathCheckoutConfigured(tier: CheckoutTier): boolean {
  return redPathOfferingConfig(tier) !== null;
}

/** Red Path Lemon checkout (one-time or Daily Practice). Metadata: settler_id + tier. */
export async function createRedPathOfferingCheckout(input: {
  tier: CheckoutTier;
  settlerId: string;
  email?: string;
  origin?: string;
  name?: string;
  showName?: boolean;
  shipping?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postal?: string;
    country?: string;
  };
}): Promise<string> {
  const config = redPathOfferingConfig(input.tier);
  if (!config) throw new CheckoutUnavailableError("not configured");
  const origin = checkoutOrigin(input.origin);
  const redirect =
    input.tier === "founder_1000"
      ? `${origin}/induction/confirmed`
      : isSubscriptionCheckout(input.tier)
        ? `${origin}/archive?practice=1`
        : `${origin}/archive?upgraded=${encodeURIComponent(input.tier)}`;
  const shipping = input.shipping ?? {};
  return runCheckout(
    config,
    {
      productOptions: {
        redirectUrl: redirect,
        receiptLinkUrl: redirect,
        receiptButtonText:
          input.tier === "founder_1000" ? "RETURN TO CONFIRMATION" : "RETURN TO THE ARCHIVE",
      },
      checkoutOptions: checkoutLook,
      checkoutData: {
        ...(input.email ? { email: input.email } : {}),
        ...(input.name ? { name: input.name } : {}),
        custom: {
          kind: "red_path",
          settler_id: input.settlerId,
          tier: input.tier,
          ...(input.name ? { name: input.name } : {}),
          ...(input.showName != null ? { show_name: input.showName ? "1" : "0" } : {}),
          ...(shipping.name ? { shipping_name: shipping.name } : {}),
          ...(shipping.line1 ? { shipping_line1: shipping.line1 } : {}),
          ...(shipping.line2 ? { shipping_line2: shipping.line2 } : {}),
          ...(shipping.city ? { shipping_city: shipping.city } : {}),
          ...(shipping.region ? { shipping_region: shipping.region } : {}),
          ...(shipping.postal ? { shipping_postal: shipping.postal } : {}),
          ...(shipping.country ? { shipping_country: shipping.country } : {}),
        },
      },
    },
    { settlerId: input.settlerId, tier: input.tier },
  );
}

export async function createMarsOfferingCheckout(input: {
  tier: OfferingTier;
  blessingId: string;
  userId: string;
  sol: number;
  name: string;
  email?: string;
  origin?: string;
}): Promise<string> {
  const config = marsOfferingConfig(input.tier);
  if (!config) throw new CheckoutUnavailableError("not configured");
  const origin = checkoutOrigin(input.origin);
  // Confirmation page polls issued status. Prayer/wish text stays on the server — never in Lemon custom data.
  const path = `/blessing/${encodeURIComponent(input.blessingId)}`;
  return runCheckout(
    config,
    {
      productOptions: {
        redirectUrl: `${origin}${path}`,
        receiptLinkUrl: `${origin}${path}`,
        receiptButtonText: checkoutProduct.blessingReceiptButton,
      },
      checkoutOptions: checkoutLook,
      checkoutData: {
        ...(input.email ? { email: input.email } : {}),
        custom: {
          kind: "mars",
          tier: input.tier,
          blessing_id: input.blessingId,
          user_id: input.userId,
          sol: String(input.sol),
          name: input.name,
        },
      },
    },
    { blessingId: input.blessingId, userId: input.userId, tier: input.tier },
  );
}

export async function createSeatCheckout(input: {
  tier: SeatTier;
  userId: string;
  email: string;
  origin?: string;
}): Promise<string> {
  const config = seatLemonConfig(input.tier);
  if (!config) throw new CheckoutUnavailableError("not configured");
  const origin = checkoutOrigin(input.origin);
  return runCheckout(
    config,
    {
      productOptions: {
        redirectUrl: `${origin}/account?notice=paid`,
        receiptLinkUrl: `${origin}/account`,
        receiptButtonText: checkoutProduct.seatReceiptButton,
      },
      checkoutOptions: checkoutLook,
      checkoutData: {
        email: input.email,
        custom: { kind: "seat", tier: input.tier, user_id: input.userId },
      },
    },
    { userId: input.userId },
  );
}

async function lemonJson(path: string, method: "GET" | "PATCH", body?: unknown): Promise<Record<string, unknown>> {
  const apiKey = lemonApiKey();
  if (!apiKey) throw new CheckoutUnavailableError("not configured");
  let response: Response;
  try {
    response = await fetch(`https://api.lemonsqueezy.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        ...(body ? { "Content-Type": "application/vnd.api+json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new CheckoutUnavailableError("request failed");
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(json)) throw new CheckoutUnavailableError("api error");
  return json;
}

export async function changeSeatVariant(subscriptionId: string, variantId: string): Promise<void> {
  const variant = Number(variantId);
  if (!Number.isInteger(variant)) throw new CheckoutUnavailableError("request failed");
  await lemonJson(`subscriptions/${encodeURIComponent(subscriptionId)}`, "PATCH", {
    data: {
      type: "subscriptions",
      id: subscriptionId,
      attributes: { variant_id: variant, invoice_immediately: true },
    },
  });
}

export async function lemonCustomerPortal(subscriptionId: string): Promise<string> {
  const json = await lemonJson(`subscriptions/${encodeURIComponent(subscriptionId)}`, "GET");
  const data = isRecord(json.data) ? json.data : null;
  const attributes = data && isRecord(data.attributes) ? data.attributes : null;
  const urls = attributes && isRecord(attributes.urls) ? attributes.urls : null;
  const url = urls && typeof urls.customer_portal === "string" ? urls.customer_portal : "";
  if (!url.startsWith("https://")) throw new CheckoutUnavailableError("no url");
  return url;
}
