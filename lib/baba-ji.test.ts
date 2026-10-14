import { describe, expect, it } from "vitest";

import { FORECASTS, OPENINGS, PAUSES, TRANSLATIONS } from "@/content/baba-ji";
import {
  isPauseDay,
  pickForecast,
  pickOpening,
  pickPause,
  pickRitualOpening,
  pickTranslation,
} from "./pick";

describe("baba ji picks", () => {
  it("keeps the four pool sizes", () => {
    expect(OPENINGS).toHaveLength(40);
    expect(TRANSLATIONS).toHaveLength(40);
    expect(FORECASTS).toHaveLength(100);
    expect(PAUSES).toHaveLength(10);
  });

  it("stays stable for one settler on one sol", () => {
    const settlerId = "SOUL-ABCD-12";
    const sol = 286;
    expect(pickOpening(settlerId, sol)).toBe(pickOpening(settlerId, sol));
    expect(pickTranslation(settlerId, sol)).toBe(pickTranslation(settlerId, sol));
    expect(pickForecast(settlerId, sol)).toBe(pickForecast(settlerId, sol));
    expect(isPauseDay(settlerId, sol)).toBe(isPauseDay(settlerId, sol));
    expect(pickOpening(settlerId, sol)).not.toBe(pickOpening(settlerId, sol + 1));
  });

  it("opens a wound about one sol in twenty", () => {
    let hits = 0;
    for (let sol = 1; sol <= 400; sol += 1) {
      if (isPauseDay("SOUL-TEST-01", sol)) hits += 1;
    }
    expect(hits).toBeGreaterThan(10);
    expect(hits).toBeLessThan(40);
  });

  it("replaces the opening with a pause line on wound sols", () => {
    const settlerId = "SOUL-TEST-01";
    let woundSol = 0;
    for (let sol = 1; sol <= 100; sol += 1) {
      if (isPauseDay(settlerId, sol)) {
        woundSol = sol;
        break;
      }
    }
    expect(woundSol).toBeGreaterThan(0);
    expect(pickRitualOpening(settlerId, woundSol)).toBe(pickPause(settlerId, woundSol));
    expect(PAUSES.includes(pickRitualOpening(settlerId, woundSol) as (typeof PAUSES)[number])).toBe(
      true,
    );
  });
});
