import { describe, expect, it } from "vitest";

import { atLeast, withinWeeklyCap } from "./tiers";

describe("tiers", () => {
  it("orders the ladder", () => {
    expect(atLeast("devotee", "believer")).toBe(true);
    expect(atLeast("pilgrim", "believer")).toBe(false);
  });

  it("caps a pilgrim at one wish a week and lets a believer through", () => {
    expect(withinWeeklyCap({ tier: "pilgrim", wishesThisWeek: 1, urgentArmed: false, urgentUsedThisMonth: 0 }).ok).toBe(false);
    expect(withinWeeklyCap({ tier: "pilgrim", wishesThisWeek: 0, urgentArmed: false, urgentUsedThisMonth: 0 }).ok).toBe(true);
    const believer = withinWeeklyCap({ tier: "believer", wishesThisWeek: 4, urgentArmed: false, urgentUsedThisMonth: 0 });
    expect(believer).toMatchObject({ ok: true, priority: false });
    const devotee = withinWeeklyCap({ tier: "devotee", wishesThisWeek: 4, urgentArmed: false, urgentUsedThisMonth: 0 });
    expect(devotee.priority).toBe(true);
  });

  it("arms one urgent petition a month for darshan", () => {
    expect(withinWeeklyCap({ tier: "darshan", wishesThisWeek: 9, urgentArmed: true, urgentUsedThisMonth: 0 }).urgent).toBe(true);
    expect(withinWeeklyCap({ tier: "darshan", wishesThisWeek: 9, urgentArmed: true, urgentUsedThisMonth: 1 }).urgent).toBe(false);
  });
});
