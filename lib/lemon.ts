// Assumptions: one Lemon Squeezy integration, three variants. LEMON_SQUEEZY_VARIANT_ID is the existing
// pay-what-you-want petition offering (customPrice in cents, $10-$500, one-time). LEMON_SQUEEZY_VISA_VARIANT_ID is the $10
// visa wish. LEMON_SQUEEZY_PREMIUM_VARIANT_ID is the $10/month subscription. Visa and Premium never send customPrice.
// Visa custom data carries only { kind: "visa", reference_id }; the wish text never leaves the server.
// The SDK has no abort option, so a 5s timeout races the request. Every failure is CheckoutUnavailableError
// (reason "not configured" when env is missing) so routes can show the right in-page message.

import "server-only";

import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import { checkoutProduct } from "@/content/checkout";
import { CHECKOUT_VARIANT_ENV } from "@/lib/checkoutKinds";
import { appUrl, lemonConfig, premiumLemonConfig, visaLemonConfig } from "@/lib/env";
import { OFFERING_MIN_CENTS } from "@/lib/offering";
import { logger } from "@/lib/logger";

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

export function visaCheckoutConfigured(): boolean {
  return visaLemonConfig() !== null;
}

export function premiumCheckoutConfigured(): boolean {
  return premiumLemonConfig() !== null;
}

export function tipCheckoutVariantEnv(): typeof CHECKOUT_VARIANT_ENV.certificate {
  return CHECKOUT_VARIANT_ENV.certificate;
}

export async function createPetitionCheckout(input: { petitionId: string; name: string; amountCents: number }): Promise<string> {
  const config = lemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  if (!Number.isInteger(input.amountCents) || input.amountCents < OFFERING_MIN_CENTS) {
    throw new CheckoutUnavailableError("request failed");
  }
  const origin = appUrl();
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

export async function createVisaCheckout(input: { referenceId: string; certificateNo: string }): Promise<string> {
  const config = visaLemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  const link = `${appUrl()}/visa/${encodeURIComponent(input.referenceId)}`;
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

export async function createPremiumCheckout(input: { profileId: string; email: string }): Promise<string> {
  const config = premiumLemonConfig();
  if (!config) throw new CheckoutUnavailableError("not configured");
  const origin = appUrl();
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
