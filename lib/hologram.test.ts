import { describe, expect, it } from "vitest";

import { hologramFallbackClass, hologramMotionEnabled } from "./hologram";

describe("hologram motion", () => {
  it("uses the static still when reduced-motion is requested", () => {
    expect(hologramMotionEnabled(true)).toBe(false);
    expect(hologramFallbackClass(true)).toBe("hologram-static");
    expect(hologramMotionEnabled(false)).toBe(true);
    expect(hologramFallbackClass(false)).toBe("hologram-live");
  });
});
