import { describe, expect, it } from "vitest";

import { isMonday, localParts, localYmd, mondayOf, zonedToUtc } from "./time";

describe("local time", () => {
  it("reads a kolkata morning as the local date", () => {
    const date = new Date("2026-10-12T01:30:00.000Z");
    expect(localYmd(date, "Asia/Kolkata")).toBe("2026-10-12");
    expect(localParts(date, "Asia/Kolkata").hour).toBe(7);
  });

  it("converts 7am kolkata to utc", () => {
    expect(zonedToUtc("2026-10-12", 7, 0, "Asia/Kolkata").toISOString()).toBe("2026-10-12T01:30:00.000Z");
  });

  it("converts 7am new york in october to utc", () => {
    expect(zonedToUtc("2026-10-12", 7, 0, "America/New_York").toISOString()).toBe("2026-10-12T11:00:00.000Z");
  });

  it("finds the monday of a sunday", () => {
    expect(mondayOf(new Date("2026-10-11T18:00:00.000Z"), "Asia/Kolkata")).toBe("2026-10-05");
    expect(isMonday("2026-10-12")).toBe(true);
    expect(isMonday("2026-10-11")).toBe(false);
  });
});
