import { describe, expect, it } from "vitest";

import { offeringAmountFromForm, offeringCents, OFFERING_MIN_CENTS, OFFERING_MIN_DOLLARS, parseOfferingDollars } from "./offering";

describe("offering minimum", () => {
  it("rejects amounts under $10", () => {
    expect(parseOfferingDollars(9)).toEqual({ ok: false });
    expect(parseOfferingDollars("9")).toEqual({ ok: false });
    expect(parseOfferingDollars("5")).toEqual({ ok: false });
    expect(parseOfferingDollars(1)).toEqual({ ok: false });
    expect(parseOfferingDollars(0)).toEqual({ ok: false });
    expect(offeringAmountFromForm("9", undefined)).toEqual({ ok: false });
    expect(offeringAmountFromForm("custom", "9")).toEqual({ ok: false });
  });

  it("accepts whole dollars from 10 to 500 and converts to cents >= 1000", () => {
    expect(OFFERING_MIN_DOLLARS).toBe(10);
    expect(parseOfferingDollars(10)).toEqual({ ok: true, dollars: 10 });
    expect(parseOfferingDollars("15")).toEqual({ ok: true, dollars: 15 });
    expect(parseOfferingDollars(500)).toEqual({ ok: true, dollars: 500 });
    expect(parseOfferingDollars(501)).toEqual({ ok: false });
    expect(parseOfferingDollars("10.5")).toEqual({ ok: false });
    expect(offeringCents(10)).toBe(OFFERING_MIN_CENTS);
    expect(offeringCents(10)).toBeGreaterThanOrEqual(1000);
    expect(offeringAmountFromForm("custom", "25")).toEqual({ ok: true, dollars: 25 });
  });
});
