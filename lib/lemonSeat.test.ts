import { describe, expect, it } from "vitest";

import { lemonSeatEffect } from "./lemonSeat";

const now = Date.parse("2026-10-11T12:00:00Z");

describe("lemon seat status", () => {
  it("keeps an active or trialing seat", () => {
    expect(lemonSeatEffect("active", null, now)).toBe("live");
    expect(lemonSeatEffect("on_trial", null, now)).toBe("live");
  });

  it("holds the seat while a payment is retried", () => {
    expect(lemonSeatEffect("past_due", null, now)).toBe("past_due");
    expect(lemonSeatEffect("paused", null, now)).toBe("past_due");
  });

  it("keeps a cancelled seat until the paid period ends", () => {
    expect(lemonSeatEffect("cancelled", "2026-11-01T00:00:00Z", now)).toBe("live");
    expect(lemonSeatEffect("cancelled", "2026-10-01T00:00:00Z", now)).toBe("ended");
    expect(lemonSeatEffect("expired", "2026-11-01T00:00:00Z", now)).toBe("ended");
  });
});
