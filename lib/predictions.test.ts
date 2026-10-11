import { describe, expect, it } from "vitest";

import {
  hashSeed,
  nextPredictionIndex,
  pickPrediction,
  pickPredictionIndex,
  PREDICTION_COUNT,
  PREDICTIONS,
} from "@/content/predictions";

const FORBIDDEN = new RegExp(`${["donat", "ion"].join("")}|visa approved`, "i");

describe("predictions", () => {
  it("has exactly 50 short entertainment asides", () => {
    expect(PREDICTIONS).toHaveLength(50);
    expect(PREDICTION_COUNT).toBe(50);
    expect(PREDICTIONS).toHaveLength(PREDICTION_COUNT);
  });

  it("picks a deterministic index for a given seed", () => {
    expect(pickPredictionIndex("SOUL-ABC123")).toBe(pickPredictionIndex("SOUL-ABC123"));
    expect(pickPredictionIndex("petition-1")).toBe(hashSeed("petition-1") % 50);
    expect(pickPrediction("seed-a")).toBe(PREDICTIONS[pickPredictionIndex("seed-a")]);
    expect(nextPredictionIndex(49)).toBe(0);
    expect(nextPredictionIndex(0)).toBe(1);
  });

  it("contains no forbidden payment or approval wording", () => {
    const blob = PREDICTIONS.map((item) => `${item.algorithm}\n${item.pandit}`).join("\n");
    expect(blob).not.toMatch(FORBIDDEN);
    for (const item of PREDICTIONS) {
      expect(item.algorithm).toBe(item.algorithm.toUpperCase());
      expect(item.algorithm).not.toMatch(/!/);
      expect(item.pandit).toBe(item.pandit.toLowerCase());
    }
  });
});
