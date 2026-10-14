import { describe, expect, it } from "vitest";

import { COUNSELS, PROBABILITIES, STATUSES } from "@/content/algorithm";
import { FORECASTS, OPENINGS, PAUSES, TRANSLATIONS } from "@/content/baba-ji";

import {
  isPauseDay,
  pickCounsel,
  pickForecast,
  pickIndex,
  pickOpening,
  pickPause,
  pickProbability,
  pickRitualOpening,
  pickStatus,
  pickTranslation,
} from "./pick";

describe("pick", () => {
  it("stays stable for one settler on one sol", () => {
    const settlerId = "SOUL-ABCD-12";
    const sol = 286;
    expect(pickOpening(settlerId, sol)).toBe(pickOpening(settlerId, sol));
    expect(pickTranslation(settlerId, sol)).toBe(pickTranslation(settlerId, sol));
    expect(pickForecast(settlerId, sol)).toBe(pickForecast(settlerId, sol));
    expect(pickStatus(settlerId, sol)).toBe(pickStatus(settlerId, sol));
    expect(pickCounsel(settlerId, sol)).toBe(pickCounsel(settlerId, sol));
    expect(pickProbability(settlerId, sol)).toBe(pickProbability(settlerId, sol));
    expect(isPauseDay(settlerId, sol)).toBe(isPauseDay(settlerId, sol));
  });

  it("changes lines when the sol changes", () => {
    const settlerId = "SOUL-ABCD-12";
    expect(pickOpening(settlerId, 100)).not.toBe(pickOpening(settlerId, 101));
    expect(pickForecast(settlerId, 100)).not.toBe(pickForecast(settlerId, 101));
    expect(pickCounsel(settlerId, 100)).not.toBe(pickCounsel(settlerId, 101));
  });

  it("seeds each category independently", () => {
    const settlerId = "SOUL-SEED-77";
    const sol = 333;
    const openingIndex = pickIndex(settlerId, sol, "opening", OPENINGS.length);
    const translationIndex = pickIndex(settlerId, sol, "translation", TRANSLATIONS.length);
    const forecastIndex = pickIndex(settlerId, sol, "forecast", FORECASTS.length);
    const statusIndex = pickIndex(settlerId, sol, "status", STATUSES.length);
    const counselIndex = pickIndex(settlerId, sol, "counsel", COUNSELS.length);
    const probabilityIndex = pickIndex(settlerId, sol, "probability", PROBABILITIES.length);

    const indexes = [
      openingIndex,
      translationIndex,
      forecastIndex,
      statusIndex,
      counselIndex,
      probabilityIndex,
    ];
    // Same absolute index across every category would mean a shared seed bug.
    expect(new Set(indexes).size).toBeGreaterThan(1);
  });

  it("returns pool members only", () => {
    const settlerId = "SOUL-POOL-99";
    const sol = 42;
    expect(OPENINGS).toContain(pickOpening(settlerId, sol));
    expect(TRANSLATIONS).toContain(pickTranslation(settlerId, sol));
    expect(FORECASTS).toContain(pickForecast(settlerId, sol));
    expect(STATUSES).toContain(pickStatus(settlerId, sol));
    expect(COUNSELS).toContain(pickCounsel(settlerId, sol));
    expect(PROBABILITIES).toContain(pickProbability(settlerId, sol));
    expect(PAUSES).toContain(pickPause(settlerId, sol));
  });

  it("opens a wound about one sol in twenty across many settlers", () => {
    let hits = 0;
    const sample = 2000;
    for (let index = 0; index < sample; index += 1) {
      const hex = (0xa000 + index * 97).toString(16).toUpperCase().padStart(6, "0");
      const settlerId = `SOUL-${hex.slice(0, 4)}-${hex.slice(4, 6)}`;
      if (isPauseDay(settlerId, 200 + index)) hits += 1;
    }
    const rate = hits / sample;
    expect(rate).toBeGreaterThan(0.03);
    expect(rate).toBeLessThan(0.08);
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
    expect(PAUSES).toContain(pickRitualOpening(settlerId, woundSol));
  });

  it("allows empty pause strings", () => {
    expect(PAUSES).toContain("");
    const settlerId = "SOUL-EMPTY-01";
    let foundEmpty = false;
    for (let sol = 1; sol <= 500; sol += 1) {
      if (!isPauseDay(settlerId, sol)) continue;
      if (pickPause(settlerId, sol) === "") {
        foundEmpty = true;
        break;
      }
    }
    expect(foundEmpty).toBe(true);
  });
});
