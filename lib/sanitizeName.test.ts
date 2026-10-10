import { describe, expect, it } from "vitest";

import { NAME_ERROR, sanitizeName } from "./sanitizeName";

describe("sanitizeName", () => {
  it("trims and keeps a normal name", () => {
    expect(sanitizeName("  Ada Lovelace  ")).toEqual({ ok: true, value: "Ada Lovelace" });
  });

  it("rejects empty, whitespace-only, and non-strings", () => {
    expect(sanitizeName("").ok).toBe(false);
    expect(sanitizeName("   \n\t ").ok).toBe(false);
    expect(sanitizeName(null).ok).toBe(false);
    expect(sanitizeName(42).ok).toBe(false);
  });

  it("caps at 40 code points", () => {
    expect(sanitizeName("ab".repeat(20)).ok).toBe(true);
    expect(sanitizeName(`${"ab".repeat(20)}c`).ok).toBe(false);
  });

  it("strips html tags", () => {
    expect(sanitizeName("Ada <b>Lovelace</b>")).toEqual({ ok: true, value: "Ada Lovelace" });
    expect(sanitizeName("<script></script>").ok).toBe(false);
  });

  it("keeps apostrophes, emoji, and Devanagari", () => {
    expect(sanitizeName("D'Angelo O'Brien")).toEqual({ ok: true, value: "D'Angelo O'Brien" });
    expect(sanitizeName("bestie 🤖✨")).toEqual({ ok: true, value: "bestie 🤖✨" });
    expect(sanitizeName("सचिन शर्मा")).toEqual({ ok: true, value: "सचिन शर्मा" });
  });

  it("rejects URLs and domain-like tokens", () => {
    for (const name of ["see https://example.com", "http://a.b", "www.bestie", "follow x.com", "spam.xyz"]) {
      expect(sanitizeName(name)).toEqual({ ok: false, error: NAME_ERROR });
    }
  });

  it("rejects @mentions", () => {
    expect(sanitizeName("hi @ada").ok).toBe(false);
    expect(sanitizeName("@bestie").ok).toBe(false);
  });

  it("rejects 4+ repeated letters or digits but allows 3 and punctuation runs", () => {
    expect(sanitizeName("aaaa").ok).toBe(false);
    expect(sanitizeName("Adaaaa").ok).toBe(false);
    expect(sanitizeName("1111").ok).toBe(false);
    expect(sanitizeName("aaa").ok).toBe(true);
    expect(sanitizeName("wait...").ok).toBe(true);
    expect(sanitizeName("...").ok).toBe(true);
  });
});
