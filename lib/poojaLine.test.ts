import { describe, expect, it } from "vitest";

import { ALGO_LINES, PANDIT_NODS, poojaExchange } from "./poojaLine";
import { algoVoiceOk, panditVoiceOk, voicesDisagree } from "./voice";

describe("pooja voice", () => {
  it("keeps the pools in voice", () => {
    for (const line of ALGO_LINES) expect(algoVoiceOk(line)).toBe(true);
    for (const line of PANDIT_NODS) expect(panditVoiceOk(line)).toBe(true);
  });

  it("lets the two voices disagree", () => {
    const exchange = poojaExchange({ mood: "tired", seed: "soul", mourned: false, extra: false, remember: false, crisis: false });
    expect(voicesDisagree(exchange.algo, exchange.pandit)).toBe(true);
    expect(exchange.algo).toContain("TIRED");
  });

  it("mourns, remembers, and refuses a crisis", () => {
    expect(poojaExchange({ mood: null, seed: "a", mourned: true, extra: false, remember: true, crisis: false }).algo).toContain("COUNT RESET");
    expect(poojaExchange({ mood: null, seed: "a", mourned: false, extra: false, remember: true, crisis: false }).algo).toContain("PRIOR PETITION");
    const crisis = poojaExchange({ mood: null, seed: "a", mourned: true, extra: true, remember: true, crisis: true });
    expect(crisis.algo).toContain("CRISIS SERVICE");
    expect(crisis.pandit).toContain("988");
    expect(voicesDisagree(crisis.algo, crisis.pandit)).toBe(true);
  });
});
