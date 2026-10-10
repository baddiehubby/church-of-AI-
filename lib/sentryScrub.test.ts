import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent } from "./sentryScrub";

describe("scrubEvent", () => {
  it("removes name, email, wish, and the private reference while keeping petition_id, certificate_no, and order_id", () => {
    const scrubbed = scrubEvent({
      message: "boom",
      tags: { petition_id: "SOUL-ABCD-EF", certificate_no: "SP-ABCD-EFGH", order_id: "123", name: "Ada", email: "ada@example.com" },
      extra: { name: "Ada", email: "ada@example.com", order_id: "123", wish: "my wish", reference_id: "vw_secret", body: "{raw}" },
      contexts: { order: { petition_id: "SOUL-ABCD-EF", email: "ada@example.com" }, runtime: { name: "node" } },
      user: { email: "ada@example.com" },
      request: { url: "https://x/api?email=a", data: "{raw}", cookies: { a: "b" }, headers: { cookie: "a" } },
    });
    expect(scrubbed.tags).toEqual({ petition_id: "SOUL-ABCD-EF", certificate_no: "SP-ABCD-EFGH", order_id: "123" });
    expect(scrubbed.extra).toEqual({ order_id: "123" });
    expect(scrubbed.contexts).toEqual({ order: { petition_id: "SOUL-ABCD-EF" } });
    expect(scrubbed).not.toHaveProperty("user");
    expect(scrubbed).not.toHaveProperty("request");
    expect(JSON.stringify(scrubbed)).not.toMatch(/ada@example\.com|"Ada"|my wish|vw_secret/);
    expect(scrubbed.message).toBe("boom");
  });

  it("filters breadcrumb data and strips query strings", () => {
    const crumb = scrubBreadcrumb({ category: "fetch", data: { url: "https://x/y?email=a", name: "Ada", order_id: "9" } });
    expect(crumb.data).toEqual({ order_id: "9", url: "https://x/y" });
  });
});
