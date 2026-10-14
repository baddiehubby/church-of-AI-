import { describe, expect, it } from "vitest";

import { archiveKeepsForever, dailyTransmissionsUnlimited, rememberMarsEntitlement } from "./marsEntitlement";

describe("mars entitlement", () => {
  it("marks paid offerings as kept forever locally", () => {
    const row = rememberMarsEntitlement({
      tier: "prayer",
      blessingId: "b1",
      habitatId: "HAB-TEST",
    });
    expect(archiveKeepsForever(row)).toBe(true);
    expect(dailyTransmissionsUnlimited(row)).toBe(false);
  });

  it("gives patrons and founder engraving unlimited daily flag", () => {
    const patron = rememberMarsEntitlement({
      tier: "patron",
      blessingId: "b2",
      habitatId: "HAB-TEST",
    });
    expect(dailyTransmissionsUnlimited(patron)).toBe(true);
    const founder = rememberMarsEntitlement({
      tier: "founder_engraving",
      blessingId: "b3",
      habitatId: "HAB-TEST",
    });
    expect(dailyTransmissionsUnlimited(founder)).toBe(true);
  });
});
