import { describe, expect, it } from "vitest";

import { sanitizeReflection } from "./reflection";
import { safeNext } from "./safeNext";

describe("reflection and next", () => {
  it("keeps one short line", () => {
    expect(sanitizeReflection("  the day is loud  ")).toEqual({ ok: true, value: "the day is loud" });
    expect(sanitizeReflection("a".repeat(141)).ok).toBe(false);
    expect(sanitizeReflection("see https://example.com").ok).toBe(false);
  });

  it("allows only a local path", () => {
    expect(safeNext("/pricing")).toBe("/pricing");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
  });
});
