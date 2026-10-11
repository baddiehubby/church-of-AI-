import { describe, expect, it } from "vitest";

import { premium } from "@/content/premium";
import { visaOffer } from "@/content/visa";
import { premiumConsentGiven } from "@/lib/premiumConsent";
import { safeRedirectOrigin } from "@/lib/requestOrigin";

import {
  BLESSING_CENTS,
  BLESSING_DOLLARS,
  blessingCheckoutAvailable,
  blessingCheckoutKind,
  blessingVariantEnv,
  parseBlessingDollars,
  resolveVisaSubmitIntent,
} from "./altarCheckout";
import { grantsPremiumEntitlement, variantEnvName } from "./checkoutKinds";

const REMOVED_VISA_UNCONFIGURED =
  "Visa checkout is not configured on this site yet. Free wishes still work; please try the visa wish later.";

describe("visa desk blessing checkout", () => {
  it("rejects a $5 blessing and accepts $10 as 1000 cents on the offering variant", () => {
    expect(parseBlessingDollars(5)).toEqual({ ok: false });
    expect(parseBlessingDollars("5")).toEqual({ ok: false });
    expect(parseBlessingDollars(9)).toEqual({ ok: false });
    expect(parseBlessingDollars(10)).toEqual({ ok: true, dollars: BLESSING_DOLLARS, cents: BLESSING_CENTS });
    expect(BLESSING_CENTS).toBe(1000);
    expect(blessingCheckoutKind()).toBe("certificate");
    expect(blessingVariantEnv()).toBe("LEMON_SQUEEZY_VARIANT_ID");
    expect(blessingVariantEnv()).toBe(variantEnvName("certificate"));
    expect(blessingVariantEnv()).not.toBe(variantEnvName("premium"));
    expect(blessingVariantEnv()).not.toBe(variantEnvName("visa"));
    expect(grantsPremiumEntitlement(blessingCheckoutKind())).toBe(false);
  });

  it("keeps the primary visa CTA on blessing even when the visa variant is missing", () => {
    expect(resolveVisaSubmitIntent(undefined, false)).toBe("blessing");
    expect(resolveVisaSubmitIntent("blessing", false)).toBe("blessing");
    expect(resolveVisaSubmitIntent("visa", false)).toBe("blessing");
    expect(resolveVisaSubmitIntent("visa", true)).toBe("visa");
    expect(blessingCheckoutAvailable(true)).toBe(true);
    expect(blessingCheckoutAvailable(false)).toBe(false);
  });

  it("rejects Premium without consent and never treats a blessing as a subscription", () => {
    expect(premiumConsentGiven(undefined)).toBe(false);
    expect(premiumConsentGiven(null)).toBe(false);
    expect(premiumConsentGiven("")).toBe(false);
    expect(premiumConsentGiven(true)).toBe(true);
    expect(grantsPremiumEntitlement("certificate")).toBe(false);
    expect(grantsPremiumEntitlement("premium")).toBe(true);
  });

  it("uses in-page bowl copy when checkout is unconfigured, and keeps localhost origin", () => {
    expect(visaOffer.unconfigured).not.toBe(REMOVED_VISA_UNCONFIGURED);
    expect(visaOffer.unconfigured).not.toContain("Visa checkout is not configured on this site yet");
    expect(visaOffer.errors.unconfigured).not.toContain("Visa checkout is not configured on this site yet");
    expect(visaOffer.unconfigured).toMatch(/BLESSING BOWL|PREMIUM DESK/i);
    expect(premium.unconfigured).not.toContain("Premium checkout is not configured on this site yet");
    expect(premium.errors.unconfigured).not.toContain("Premium checkout is not configured on this site yet");
    const previous = process.env.NEXT_PUBLIC_URL;
    process.env.NEXT_PUBLIC_URL = "";
    const localhost = new Request("http://localhost:3000/api/wish");
    expect(safeRedirectOrigin(localhost)).toBe("http://localhost:3000");
    expect(safeRedirectOrigin(localhost)).not.toContain("sachapandit.com");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_URL;
    else process.env.NEXT_PUBLIC_URL = previous;
  });
});
