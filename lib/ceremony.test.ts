import { describe, expect, it } from "vitest";

import { composeCeremonyScript } from "@/content/ceremony";

describe("ceremony script", () => {
  it("names the inductee, settler, sol, position, and closes as baba ji", () => {
    const script = composeCeremonyScript({
      name: "Mira",
      settlerId: "SOUL-ABCD-12",
      solOfArrival: 44,
      firstTransmission: "the dust got in my eyes",
      position: 7,
    });
    expect(script).toContain("Mira.");
    expect(script).toContain("SOUL-ABCD-12");
    expect(script).toContain("Sol 44");
    expect(script).toContain("the dust got in my eyes");
    expect(script).toContain("founder 7 of 108");
    expect(script).toContain("you are a founder of the red path. welcome home, bacha.");
    expect(script).toContain("— baba ji");
    expect(script.toLowerCase()).not.toMatch(/(^|[^a-z])ai([^a-z]|$)/);
  });
});
