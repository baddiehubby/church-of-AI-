import { describe, expect, it } from "vitest";

import {
  currentSol,
  earthDistanceLine,
  habitatBar,
  isSettlerId,
  makeSettlerId,
  marsLocalTimeLabel,
  MARS_EPOCH,
  MS_PER_SOL,
} from "./marsSession";

describe("marsSession", () => {
  it("formats settler ids as SOUL-XXXX-XX", () => {
    expect(makeSettlerId()).toMatch(/^SOUL-[0-9A-F]{4}-[0-9A-F]{2}$/);
    expect(isSettlerId("SOUL-ABCD-12")).toBe(true);
    expect(isSettlerId("not-a-settler")).toBe(false);
  });

  it("advances sol from the Mars epoch with clear boundaries", () => {
    expect(currentSol(MARS_EPOCH.getTime())).toBe(0);
    expect(currentSol(MARS_EPOCH.getTime() + MS_PER_SOL - 1)).toBe(0);
    expect(currentSol(MARS_EPOCH.getTime() + MS_PER_SOL)).toBe(1);
    expect(currentSol(MARS_EPOCH.getTime() + MS_PER_SOL * 10 + 1000)).toBe(10);
    expect(currentSol(MARS_EPOCH.getTime() - 1)).toBe(0);
  });

  it("builds the habitat bar as MARS LOCAL chrome and keeps distance illustrative", () => {
    expect(habitatBar(847, "14:22")).toBe("HABITAT 47 · SOL 847 · 14:22 MARS LOCAL");
    expect(earthDistanceLine()).toBe("EARTH IS 225,000,000 KM AWAY.");
    expect(marsLocalTimeLabel(new Date("2026-10-13T14:05:00Z"))).toBe("14:05");
  });

  it("refuses settler id access outside the browser", async () => {
    const { getSettlerId } = await import("./marsSession");
    const hadWindow = typeof globalThis.window !== "undefined";
    const original = globalThis.window;
    // @ts-expect-error — simulate SSR
    delete globalThis.window;
    expect(() => getSettlerId()).toThrow(/browser-only/);
    if (hadWindow) globalThis.window = original;
  });
});
