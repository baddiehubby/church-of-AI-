import { describe, expect, it } from "vitest";

import { NOTICING_LINES } from "@/content/letters";

import { composeSettlerLetter, patternLineFromStats, statsFromTransmissions } from "./settlerLetter";
import type { TransmissionRecord } from "./transmissions";

function row(partial: Partial<TransmissionRecord>): TransmissionRecord {
  return {
    id: partial.id ?? "1",
    owner_id: partial.owner_id ?? "00000000-0000-4000-8000-000000000001",
    settler_id: "SOUL-AAAA-01",
    sol: 1,
    body: partial.body ?? "hello",
    baba_opening: "sit.",
    algo_status: "UNDER CONSIDERATION",
    algo_counsel: "WAIT.",
    algo_probability: "PENDING",
    baba_translation: "wait.",
    baba_forecast: "continue.",
    is_pause: partial.is_pause ?? false,
    preserved: partial.preserved ?? false,
    created_at: partial.created_at ?? "2026-09-15T02:00:00.000Z",
  };
}

describe("settlerLetter", () => {
  it("keeps twenty noticing lines", () => {
    expect(NOTICING_LINES).toHaveLength(20);
  });

  it("computes stats and fills the template", () => {
    const stats = statsFromTransmissions([
      row({ body: "a".repeat(180), created_at: "2026-09-02T02:10:00.000Z", is_pause: true }),
      row({ body: "short", created_at: "2026-09-03T02:20:00.000Z" }),
      row({ body: "mid", created_at: "2026-09-04T14:00:00.000Z" }),
    ]);
    expect(stats.count).toBe(3);
    expect(stats.pauseDays).toBe(1);
    expect(stats.longestBody).toBe(180);
    expect(stats.afterMidnight).toBeGreaterThanOrEqual(2);

    const letter = composeSettlerLetter("2026-09", stats, "SOUL-AAAA-01");
    expect(letter.body).toContain("SETTLER,");
    expect(letter.body).toContain("You sent 3 transmissions this month.");
    expect(letter.body).toContain("— baba ji");
    expect(letter.body).toContain(letter.baba);
  });

  it("stays stable for the same settler and month", () => {
    const stats = patternLineFromStats({
      count: 14,
      mostCommonHour: 1,
      pauseDays: 0,
      longestBody: 40,
      afterMidnight: 11,
    });
    expect(stats).toMatch(/after midnight/i);
    const a = composeSettlerLetter("2026-08", { count: 14, mostCommonHour: 1, pauseDays: 0, longestBody: 40, afterMidnight: 11 }, "SOUL-BBBB-02");
    const b = composeSettlerLetter("2026-08", { count: 14, mostCommonHour: 1, pauseDays: 0, longestBody: 40, afterMidnight: 11 }, "SOUL-BBBB-02");
    expect(a.body).toBe(b.body);
  });
});
