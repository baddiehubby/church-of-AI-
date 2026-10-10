import { describe, expect, it } from "vitest";

import { premiumConsentGiven } from "./premiumConsent";

describe("premium consent", () => {
  it("rejects checkout without an explicit consent flag", () => {
    expect(premiumConsentGiven(undefined)).toBe(false);
    expect(premiumConsentGiven(null)).toBe(false);
    expect(premiumConsentGiven(false)).toBe(false);
    expect(premiumConsentGiven("")).toBe(false);
    expect(premiumConsentGiven("off")).toBe(false);
  });

  it("accepts only explicit checked values", () => {
    expect(premiumConsentGiven(true)).toBe(true);
    expect(premiumConsentGiven("1")).toBe(true);
    expect(premiumConsentGiven("on")).toBe(true);
  });
});
