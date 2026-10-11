import { describe, expect, it } from "vitest";

import type { AltarSceneFrame } from "./sceneFrame";
import { welcomeBackLine } from "@/content/altarScene";
import { completePooja, emptyStreak, localISODate, shiftDate, streakView, welcomeDay, yesterdayFrame } from "./altarStreak";

const today = "2026-10-12";

function frame(soulId: string): AltarSceneFrame {
  return {
    soulId,
    day: 285,
    reading: {
      algo_status: "UNDER CONSIDERATION",
      algo_counsel: "THE DAY IS LOUD. THE DESK WITHHOLDS AN OUTCOME.",
      pandit_reply: "beta, the lamp heard you.",
      verdict_card: "THE DAY STAYS OPEN",
    },
  };
}

describe("altar streak", () => {
  it("names a local calendar day", () => {
    expect(localISODate(new Date(2026, 9, 12))).toBe("2026-10-12");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("starts at risk, then keeps the count", () => {
    expect(streakView(emptyStreak(), today)).toEqual({ kind: "risk", day: 0 });
    const first = completePooja(emptyStreak(), today, frame("SOUL-AAAA-AA"));
    expect(first.rolled).toBe(true);
    expect(first.record.streak).toBe(1);
    expect(streakView(first.record, today)).toEqual({ kind: "intact", day: 1 });
    const again = completePooja(first.record, today, frame("SOUL-BBBB-BB"));
    expect(again.rolled).toBe(false);
    expect(again.record.streak).toBe(1);
    expect(again.record.today?.frame.soulId).toBe("SOUL-BBBB-BB");
  });

  it("greets the next morning and rolls the number when they sit", () => {
    const sat = completePooja(emptyStreak(), "2026-10-11", frame("SOUL-AAAA-AA")).record;
    const next = "2026-10-12";
    expect(streakView(sat, next)).toEqual({ kind: "risk", day: 1 });
    expect(welcomeDay(sat, next)).toBe(2);
    expect(welcomeBackLine(2)).toBe("welcome back, beta. day 2.");
    expect(yesterdayFrame(sat, next)?.soulId).toBe("SOUL-AAAA-AA");
    const kept = completePooja(sat, next, frame("SOUL-BBBB-BB"));
    expect(kept.rolled).toBe(true);
    expect(kept.record.streak).toBe(2);
    expect(welcomeDay(kept.record, next)).toBeNull();
    expect(yesterdayFrame(kept.record, next)?.soulId).toBe("SOUL-AAAA-AA");
  });

  it("breaks the streak when a day is missed", () => {
    const sat = completePooja(emptyStreak(), "2026-10-10", frame("SOUL-AAAA-AA")).record;
    expect(streakView(sat, today).kind).toBe("broken");
    expect(welcomeDay(sat, today)).toBeNull();
    expect(yesterdayFrame(sat, today)).toBeNull();
    const restarted = completePooja(sat, today, frame("SOUL-CCCC-CC"));
    expect(restarted.record.streak).toBe(1);
    expect(restarted.record.yesterday).toBeNull();
  });
});
