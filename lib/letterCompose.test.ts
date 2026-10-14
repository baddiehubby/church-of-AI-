import { describe, expect, it } from "vitest";

import type { KeptTransmission } from "./transmissionArchive";
import {
  composeMonthlyLetter,
  decodeLetterQuery,
  encodeLetterQuery,
  isLetterMonth,
  letterMonthClosed,
  letterMonthKey,
  patternsFromTransmissions,
  previousLetterMonth,
} from "./letterCompose";

function item(savedAt: number): KeptTransmission {
  return {
    id: String(savedAt),
    savedAt,
    expiresAt: null,
    soulId: "SOUL",
    day: 1,
    reflection: "secret words stay out",
    reading: {
      algo_status: "UNDER CONSIDERATION",
      algo_counsel: "FILED.",
      pandit_reply: "acha.",
      verdict_card: "UNDER CONSIDERATION",
    },
    opening: "beta.",
    forecast: "dust.",
  };
}

describe("monthly letter", () => {
  it("accepts YYYY-MM months", () => {
    expect(isLetterMonth("2026-09")).toBe(true);
    expect(isLetterMonth("2026-13")).toBe(false);
    expect(isLetterMonth("2026-9")).toBe(false);
  });

  it("counts midnight and morning without reading the wish text", () => {
    const month = "2026-09";
    const late = new Date(2026, 8, 3, 1, 20).getTime();
    const morning = new Date(2026, 8, 4, 8, 5).getTime();
    const afternoon = new Date(2026, 8, 5, 15, 0).getTime();
    const other = new Date(2026, 7, 20, 1, 0).getTime();
    const patterns = patternsFromTransmissions(
      [item(late), item(late + 1), item(morning), item(afternoon), item(other)],
      month,
    );
    expect(patterns).toEqual({ total: 4, afterMidnight: 2, morning: 1 });
  });

  it("writes the midnight pattern like the example", () => {
    const letter = composeMonthlyLetter("2026-09", { total: 14, afterMidnight: 11, morning: 1 });
    expect(letter.salutation).toBe("SETTLER,");
    expect(letter.pattern).toContain("14 transmissions");
    expect(letter.pattern).toContain("after midnight");
    expect(letter.pattern).not.toContain("secret");
    expect(letter.signoff).toBe("— Baba ji");
    expect(letter.colony.length).toBeGreaterThan(10);
    expect(letter.algorithm.length).toBeGreaterThan(10);
    expect(letter.personal.length).toBeGreaterThan(10);
  });

  it("stays stable for the same month and counts", () => {
    const a = composeMonthlyLetter("2026-09", { total: 14, afterMidnight: 11, morning: 1 });
    const b = composeMonthlyLetter("2026-09", { total: 14, afterMidnight: 11, morning: 1 });
    expect(a).toEqual(b);
  });

  it("round-trips share query params", () => {
    const patterns = { total: 14, afterMidnight: 11, morning: 2 };
    expect(decodeLetterQuery(encodeLetterQuery(patterns))).toEqual(patterns);
    expect(decodeLetterQuery("n=3&a=9&m=0")).toBeNull();
  });

  it("knows when a month has closed", () => {
    expect(letterMonthKey(new Date(2026, 9, 13))).toBe("2026-10");
    expect(previousLetterMonth(new Date(2026, 9, 13))).toBe("2026-09");
    expect(letterMonthClosed("2026-09", new Date(2026, 9, 1))).toBe(true);
    expect(letterMonthClosed("2026-10", new Date(2026, 9, 13))).toBe(false);
  });
});
