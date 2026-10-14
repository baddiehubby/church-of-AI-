import { describe, expect, it } from "vitest";

import { COUNSELS, PROBABILITIES, STATUSES } from "@/content/algorithm";
import { FORECASTS, OPENINGS, PAUSES, TRANSLATIONS } from "@/content/baba-ji";

function words(line: string): number {
  return line.trim() ? line.trim().split(/\s+/).length : 0;
}

const PLACEHOLDER = /\b(todo|placeholder|lorem|ipsum|xxx|tbd)\b/i;
const HARD_BAN =
  /\b(visa|passport|cancer|die|death|salary|rupees?|dollars?|guaranteed|definitely|will feel better|fall in love)\b/i;
const EARTH_MIND = /\b(is thinking about you|knows what you|on earth is thinking)\b/i;

describe("voice pools", () => {
  it("keeps the four Baba ji pools at full size", () => {
    expect(OPENINGS).toHaveLength(40);
    expect(TRANSLATIONS).toHaveLength(40);
    expect(FORECASTS).toHaveLength(100);
    expect(PAUSES).toHaveLength(10);
  });

  it("keeps openings and translations in the intended length band", () => {
    for (const line of OPENINGS) {
      const n = words(line);
      expect(n).toBeGreaterThanOrEqual(6);
      expect(n).toBeLessThanOrEqual(14);
      expect(line).not.toMatch(PLACEHOLDER);
    }
    for (const line of TRANSLATIONS) {
      const n = words(line);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(14);
      expect(line).not.toMatch(PLACEHOLDER);
    }
  });

  it("keeps forecasts evocative and unfinished", () => {
    for (const line of FORECASTS) {
      const n = words(line);
      expect(n).toBeGreaterThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(24);
      expect(line).not.toMatch(HARD_BAN);
      expect(line).not.toMatch(EARTH_MIND);
      expect(line).not.toMatch(PLACEHOLDER);
      expect(line).not.toMatch(/\byou will cry\b/i);
      expect(line).not.toMatch(/\bfeel better\b/i);
    }
  });

  it("keeps pauses short and unresolved", () => {
    expect(PAUSES.filter((line) => line === "")).toHaveLength(2);
    for (const line of PAUSES) {
      if (!line || line === "…") continue;
      expect(words(line)).toBeLessThanOrEqual(14);
      expect(line).not.toMatch(/\b(because i left|her name|his name)\b/i);
      expect(line).not.toMatch(PLACEHOLDER);
    }
  });

  it("ships the Algorithm instrument pools", () => {
    expect(STATUSES).toHaveLength(4);
    expect(PROBABILITIES).toHaveLength(4);
    expect(COUNSELS).toHaveLength(30);
    for (const status of STATUSES) {
      expect(status).toBe(status.toUpperCase());
    }
    for (const probability of PROBABILITIES) {
      expect(probability).toBe(probability.toUpperCase());
      expect(probability).not.toMatch(/%|percent|likelihood/i);
    }
    for (const line of COUNSELS) {
      expect(line).toBe(line.toUpperCase());
      expect(line).not.toMatch(/\b(I|I'M|DON'T|WON'T|CAN'T)\b/);
      expect(line).not.toMatch(PLACEHOLDER);
      expect(line.split(".").filter((part) => part.trim()).length).toBeGreaterThanOrEqual(2);
      expect(line.split(".").filter((part) => part.trim()).length).toBeLessThanOrEqual(3);
    }
  });
});
