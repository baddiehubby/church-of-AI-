import { describe, expect, it } from "vitest";

import { marsOwnerCookieValue, parseMarsOwnerCookie, randomOwnerId } from "./marsAuth";

describe("marsAuth cookie", () => {
  it("round-trips a signed owner cookie", () => {
    const ownerId = randomOwnerId();
    const value = marsOwnerCookieValue(ownerId);
    expect(value).toBeTruthy();
    expect(parseMarsOwnerCookie(value)).toBe(ownerId);
  });

  it("rejects tampered cookies", () => {
    const ownerId = randomOwnerId();
    const value = marsOwnerCookieValue(ownerId);
    expect(value).toBeTruthy();
    const tampered = `${value!.slice(0, -4)}aaaa`;
    expect(parseMarsOwnerCookie(tampered)).toBeNull();
    expect(parseMarsOwnerCookie("not-a-cookie")).toBeNull();
    expect(parseMarsOwnerCookie(`${randomOwnerId()}.9999999999999.fakesig`)).toBeNull();
  });

  it("rejects a client-supplied public settler label as ownership", () => {
    expect(parseMarsOwnerCookie("SOUL-ABCD-12")).toBeNull();
  });
});
