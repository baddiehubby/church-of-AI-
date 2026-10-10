import { describe, expect, it } from "vitest";

import { sanitizeWish } from "./sanitizeWish";

describe("sanitizeWish", () => {
  it("keeps unicode, apostrophes, hyphens, and an ellipsis", () => {
    const result = sanitizeWish("  cafe it's fine...  ");
    expect(result).toEqual({ ok: true, value: "cafe it's fine..." });
  });

  it("strips html tags", () => {
    expect(sanitizeWish("I want to <b>build</b> a life.")).toEqual({ ok: true, value: "I want to build a life." });
  });

  it("rejects blank, urls, mentions, letter runs, and a fourth emoji", () => {
    expect(sanitizeWish("   ").ok).toBe(false);
    expect(sanitizeWish("see https://example.com").ok).toBe(false);
    expect(sanitizeWish("hi @ada").ok).toBe(false);
    expect(sanitizeWish("heyyy").ok).toBe(false);
    expect(sanitizeWish("wait...").ok).toBe(true);
    expect(sanitizeWish("love 💕💰🎓").ok).toBe(true);
    expect(sanitizeWish("love 💕💰🎓✨").ok).toBe(false);
  });
});
