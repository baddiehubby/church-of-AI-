import { describe, expect, it } from "vitest";

import { alreadySatToday, canSit, episodeAllowed } from "./seat";
import { believerLineItems, stripeSubscriptionEffect } from "./stripeBilling";

describe("seats", () => {
  const zone = "Asia/Karachi";
  const morning = new Date("2026-10-12T06:00:00.000Z");

  it("lets a pilgrim sit once on a local day", () => {
    expect(canSit({ tier: "pilgrim", lastPoojaAt: null, now: morning, timeZone: zone })).toBe(true);
    expect(canSit({ tier: "pilgrim", lastPoojaAt: "2026-10-12T02:00:00.000Z", now: morning, timeZone: zone })).toBe(false);
    expect(alreadySatToday("2026-10-11T18:00:00.000Z", morning, zone)).toBe(false);
    expect(canSit({ tier: "believer", lastPoojaAt: "2026-10-12T02:00:00.000Z", now: morning, timeZone: zone })).toBe(true);
  });

  it("keeps the episode behind believer", () => {
    expect(episodeAllowed("pilgrim")).toBe(false);
    expect(episodeAllowed("believer")).toBe(true);
  });

  it("prices settler at 10 when no dashboard price is set", () => {
    const open = believerLineItems(null);
    expect(open.get("line_items[0][price_data][unit_amount]")).toBe("1000");
    expect(open.get("line_items[0][price_data][product_data][name]")).toBe("SETTLER");
    expect(open.get("line_items[0][price_data][currency]")).toBe("usd");
    expect(open.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(open.get("line_items[0][price]")).toBeNull();
    const priced = believerLineItems("price_believer");
    expect(priced.get("line_items[0][price]")).toBe("price_believer");
    expect(priced.get("line_items[0][price_data][unit_amount]")).toBeNull();
  });

  it("maps subscription created, updated, and deleted", () => {
    expect(stripeSubscriptionEffect("customer.subscription.created", "active")).toBe("grant");
    expect(stripeSubscriptionEffect("customer.subscription.created", "incomplete")).toBeNull();
    expect(stripeSubscriptionEffect("customer.subscription.updated", "past_due")).toBe("past_due");
    expect(stripeSubscriptionEffect("customer.subscription.updated", "active")).toBe("grant");
    expect(stripeSubscriptionEffect("customer.subscription.deleted", "canceled")).toBe("end");
    expect(stripeSubscriptionEffect("invoice.payment_failed", "open")).toBeNull();
  });
});
