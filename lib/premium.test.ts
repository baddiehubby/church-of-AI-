import { afterEach, describe, expect, it } from "vitest";

import { applySubscriptionEvent, entitlementIsLive, getWishEntry, hasPremium, mapLemonStatus } from "./premium";

function reset(): void {
  (globalThis as typeof globalThis & { __premiumStore?: unknown }).__premiumStore = undefined;
}

afterEach(reset);

describe("premium entitlements", () => {
  it("maps Lemon subscription statuses and treats cancelled-with-future-end as still live", () => {
    expect(mapLemonStatus("active")).toBe("active");
    expect(mapLemonStatus("expired")).toBe("expired");
    expect(mapLemonStatus("cancelled")).toBe("cancelled");
    expect(mapLemonStatus("past_due")).toBe("past_due");
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(entitlementIsLive({ profileId: "x", subscriptionId: "s", status: "cancelled", currentPeriodEnd: future })).toBe(true);
    expect(entitlementIsLive({ profileId: "x", subscriptionId: "s", status: "expired", currentPeriodEnd: future })).toBe(false);
  });

  it("grants on an active subscription webhook and revokes when expired", async () => {
    const profileId = "aa".repeat(16);
    const granted = await applySubscriptionEvent({
      profileId,
      subscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: null,
    });
    expect(granted.result).toBe("granted");
    expect(granted.live).toBe(true);
    expect(await hasPremium(profileId)).toBe(true);
    const again = await applySubscriptionEvent({
      profileId,
      subscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: null,
    });
    expect(again.result).toBe("updated");
    const revoked = await applySubscriptionEvent({
      profileId,
      subscriptionId: "sub_1",
      status: "expired",
      currentPeriodEnd: null,
    });
    expect(revoked.result).toBe("revoked");
    expect(await hasPremium(profileId)).toBe(false);
  });

  it("returns nothing for a private journal id without a session", async () => {
    expect(await getWishEntry("missing-entry", null)).toBeNull();
    expect(await getWishEntry("missing-entry", "bb".repeat(16))).toBeNull();
  });

  it("does not grant Premium when only a tip would have been recorded", async () => {
    const profileId = "cc".repeat(16);
    expect(await hasPremium(profileId)).toBe(false);
  });
});
