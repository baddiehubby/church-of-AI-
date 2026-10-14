import { describe, expect, it } from "vitest";

import {
  archiveListCap,
  asSettlerTier,
  canPreserve,
  hasForecast,
  isWanderer,
  preserveLimit,
} from "./settlerTiers";

describe("settlerTiers", () => {
  it("normalizes legacy labels", () => {
    expect(asSettlerTier("pilgrim")).toBe("wanderer");
    expect(asSettlerTier("settler")).toBe("practice_monthly");
    expect(asSettlerTier("offering_5")).toBe("offering_5");
  });

  it("locks wanderer out of forecast and preserve", () => {
    expect(isWanderer("wanderer")).toBe(true);
    expect(hasForecast("wanderer")).toBe(false);
    expect(canPreserve("wanderer")).toBe(false);
    expect(preserveLimit("wanderer")).toBe(0);
    expect(hasForecast("offering_5")).toBe(true);
    expect(preserveLimit("offering_5")).toBe(7);
    expect(preserveLimit("practice_monthly")).toBeNull();
    expect(archiveListCap("settler_10")).toBe(30);
  });
});
