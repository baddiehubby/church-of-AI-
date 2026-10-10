import { describe, expect, it } from "vitest";

import { CHECKOUT_VARIANT_ENV, grantsPremiumEntitlement, variantEnvName } from "./checkoutKinds";

describe("checkout variants", () => {
  it("keeps the offering/tip on the original PWYW variant, not visa or premium", () => {
    expect(variantEnvName("certificate")).toBe("LEMON_SQUEEZY_VARIANT_ID");
    expect(CHECKOUT_VARIANT_ENV.certificate).toBe("LEMON_SQUEEZY_VARIANT_ID");
    expect(variantEnvName("certificate")).not.toBe(variantEnvName("visa"));
    expect(variantEnvName("certificate")).not.toBe(variantEnvName("premium"));
    expect(variantEnvName("visa")).toBe("LEMON_SQUEEZY_VISA_VARIANT_ID");
    expect(variantEnvName("premium")).toBe("LEMON_SQUEEZY_PREMIUM_VARIANT_ID");
  });

  it("never grants Premium entitlement from a tip or visa checkout", () => {
    expect(grantsPremiumEntitlement("certificate")).toBe(false);
    expect(grantsPremiumEntitlement("visa")).toBe(false);
    expect(grantsPremiumEntitlement("premium")).toBe(true);
  });
});
