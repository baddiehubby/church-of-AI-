import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent } from "./sentryScrub";

describe("scrubEvent", () => {
  it("keeps only the allowlisted ids and drops names, emails, wish, bodies, cookies, and query", () => {
    const scrubbed = scrubEvent({
      message: "boom",
      tags: {
        petition_id: "SOUL-ABCD-EF",
        soul_id: "SOUL-ABCD-EF",
        reference_id: "vw_ref",
        order_id: "123",
        tier: "basic",
        event_name: "order_created",
        amount_cents: 1000,
        certificate_no: "SP-DROP",
        subscription_id: "sub_drop",
        name: "Ada",
        email: "ada@example.com",
      },
      extra: { name: "Ada", email: "ada@example.com", order_id: "123", wish: "my wish", body: "{raw}", cookies: "a=b" },
      contexts: { order: { petition_id: "SOUL-ABCD-EF", email: "ada@example.com", wish: "my wish" }, runtime: { name: "node" } },
      user: { email: "ada@example.com" },
      request: { url: "https://x/api?email=a", data: "{raw}", cookies: { a: "b" }, headers: { cookie: "a" }, query: { wish: "my wish" } },
    });
    expect(scrubbed.tags).toEqual({
      petition_id: "SOUL-ABCD-EF",
      soul_id: "SOUL-ABCD-EF",
      reference_id: "vw_ref",
      order_id: "123",
      tier: "basic",
      event_name: "order_created",
      amount_cents: 1000,
    });
    expect(scrubbed.extra).toEqual({ order_id: "123" });
    expect(scrubbed.contexts).toEqual({ order: { petition_id: "SOUL-ABCD-EF" } });
    expect(scrubbed).not.toHaveProperty("user");
    expect(scrubbed).not.toHaveProperty("request");
    expect(JSON.stringify(scrubbed)).not.toMatch(/ada@example\.com|"Ada"|my wish|SP-DROP|sub_drop/);
    expect(scrubbed.message).toBe("boom");
  });

  it("filters breadcrumb data and strips query strings", () => {
    const crumb = scrubBreadcrumb({
      category: "fetch",
      data: { url: "https://x/y?email=a", name: "Ada", order_id: "9", wish: "secret" },
    });
    expect(crumb.data).toEqual({ order_id: "9", url: "https://x/y" });
  });
});
