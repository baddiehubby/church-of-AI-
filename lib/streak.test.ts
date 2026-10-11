import { describe, expect, it } from "vitest";

import { applyPooja, viewStreak } from "./streak";

const zone = "America/New_York";

describe("streaks", () => {
  it("starts at one", () => {
    const next = applyPooja({ current: 0, longest: 0, lastPoojaAt: null }, new Date("2026-10-11T15:00:00.000Z"), zone);
    expect(next).toMatchObject({ current: 1, longest: 1, alreadyToday: false, mourned: false });
  });

  it("does not rise twice on the same local day", () => {
    const last = "2026-10-12T00:00:00.000Z";
    const now = new Date("2026-10-12T03:00:00.000Z");
    expect(applyPooja({ current: 4, longest: 4, lastPoojaAt: last }, now, zone).alreadyToday).toBe(true);
  });

  it("rises on the next local morning", () => {
    const next = applyPooja({ current: 4, longest: 4, lastPoojaAt: "2026-10-12T03:00:00.000Z" }, new Date("2026-10-12T11:00:00.000Z"), zone);
    expect(next).toMatchObject({ current: 5, longest: 5, mourned: false, alreadyToday: false });
  });

  it("mourns a gap", () => {
    const next = applyPooja({ current: 6, longest: 9, lastPoojaAt: "2026-10-09T15:00:00.000Z" }, new Date("2026-10-12T15:00:00.000Z"), zone);
    expect(next).toMatchObject({ current: 1, longest: 9, mourned: true, brokenFrom: 6 });
  });

  it("shows a quiet streak before the next sitting", () => {
    const view = viewStreak({ current: 6, longest: 9, lastPoojaAt: "2026-10-09T15:00:00.000Z" }, new Date("2026-10-12T15:00:00.000Z"), zone);
    expect(view).toMatchObject({ quiet: true, quietFrom: 6, doneToday: false });
  });
});
