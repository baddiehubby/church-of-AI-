import { afterEach, describe, expect, it } from "vitest";

import { checkoutReturnUrl, hostsMatch, localRedirect, requestOrigin, safeRedirectOrigin } from "./requestOrigin";

const previous = process.env.NEXT_PUBLIC_URL;

afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_URL;
  else process.env.NEXT_PUBLIC_URL = previous;
});

describe("safe checkout redirects", () => {
  const localhost = new Request("http://localhost:3000/api/checkout");

  it("uses the request origin when NEXT_PUBLIC_URL is empty", () => {
    process.env.NEXT_PUBLIC_URL = "";
    expect(requestOrigin(localhost)).toBe("http://localhost:3000");
    expect(safeRedirectOrigin(localhost)).toBe("http://localhost:3000");
  });

  it("does not use a foreign host when the request is localhost", () => {
    process.env.NEXT_PUBLIC_URL = "https://sachapandit.com";
    expect(hostsMatch("https://sachapandit.com", "http://localhost:3000")).toBe(false);
    expect(safeRedirectOrigin(localhost)).toBe("http://localhost:3000");
    expect(safeRedirectOrigin(localhost)).not.toContain("sachapandit.com");
    const location = checkoutReturnUrl(localhost, "/verdict/ABC?notice=nap#certificate");
    expect(location.startsWith("http://localhost:3000/")).toBe(true);
    expect(location).not.toMatch(/sachapandit\.com/);
    const response = localRedirect(localhost, "/verdict/ABC?notice=amount#certificate");
    expect(response.headers.get("location")).toBe("http://localhost:3000/verdict/ABC?notice=amount#certificate");
    expect(response.headers.get("location")).not.toMatch(/sachapandit\.com/);
  });

  it("uses the configured public url when hosts match", () => {
    process.env.NEXT_PUBLIC_URL = "https://sachapandit.com";
    const production = new Request("https://sachapandit.com/api/checkout");
    expect(safeRedirectOrigin(production)).toBe("https://sachapandit.com");
  });
});
