import { describe, expect, it } from "vitest";

import { sanitizeWish } from "./sanitizeWish";

describe("sanitizeWish", () => {
  it("keeps unicode, apostrophes, hyphens, and an ellipsis", () => {
    const result = sanitizeWish("  café it's fine-enough...  ");
    expect(result).toEqual({ ok: true, value: "café it's fine-enough..." });
  });

  it("strips html tags", () => {
    expect(sanitizeWish("I want to <b>build</b> a life.")).toEqual({ ok: true, value: "I want to build a life." });
  });

  it("caps at 280 characters", () => {
    expect(sanitizeWish("ab".repeat(140)).ok).toBe(true);
    expect(sanitizeWish(`${"ab".repeat(140)}c`)).toEqual({ ok: false, code: "long" });
  });

  it("rejects blank, urls, mentions, letter runs, digit runs, and a fourth emoji", () => {
    expect(sanitizeWish("   ").ok).toBe(false);
    expect(sanitizeWish("see https://example.com").ok).toBe(false);
    expect(sanitizeWish("visit example.com").ok).toBe(false);
    expect(sanitizeWish("hi @ada").ok).toBe(false);
    expect(sanitizeWish("aaa").ok).toBe(false);
    expect(sanitizeWish("heyyy").ok).toBe(false);
    expect(sanitizeWish("111").ok).toBe(false);
    expect(sanitizeWish("wait...").ok).toBe(true);
    expect(sanitizeWish("love 💕💰🎓").ok).toBe(true);
    expect(sanitizeWish("love 💕💰🎓✨").ok).toBe(false);
  });
});
