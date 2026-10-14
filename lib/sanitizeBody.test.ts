import { describe, expect, it } from "vitest";

import { sanitizeBody } from "./sanitizeBody";

describe("sanitizeBody", () => {
  it("trims, strips tags, and caps length", () => {
    expect(sanitizeBody("  hello <b>mars</b>  ")).toBe("hello mars");
    expect(sanitizeBody("a".repeat(300))?.length).toBe(280);
  });

  it("rejects empty noise", () => {
    expect(sanitizeBody("   ")).toBeNull();
    expect(sanitizeBody("<p></p>")).toBeNull();
    expect(sanitizeBody(12)).toBeNull();
  });
});
