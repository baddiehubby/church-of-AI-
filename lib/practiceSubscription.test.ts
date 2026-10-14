import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  applyPracticeSubscription,
  ensureSettlerByOwner,
  expirePracticeSubscription,
  flagPracticePaymentFailed,
  getSettlerLemonSubscriptionId,
  getSettlerTier,
  markPracticeCancelled,
  resetTransmissionMemory,
  setSettlerTier,
} from "./transmissionsStore";

afterEach(() => {
  resetTransmissionMemory();
});

describe("Daily Practice subscription", () => {
  it("activates practice_monthly and reverts on expire", async () => {
    const settlerId = "SOUL-PRAC-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "offering_5" });
    expect(await getSettlerTier(settlerId)).toBe("offering_5");

    const first = await applyPracticeSubscription({
      settlerId,
      lemonSubscriptionId: "sub_1",
      eventId: "evt_1",
    });
    expect(first.already).toBe(false);
    expect(await getSettlerTier(settlerId)).toBe("practice_monthly");
    expect(await getSettlerLemonSubscriptionId(settlerId)).toBe("sub_1");

    const again = await applyPracticeSubscription({
      settlerId,
      lemonSubscriptionId: "sub_1",
      eventId: "evt_1",
    });
    expect(again.already).toBe(true);

    await markPracticeCancelled({ lemonSubscriptionId: "sub_1", endsAt: "2030-01-01T00:00:00.000Z" });
    expect(await getSettlerTier(settlerId)).toBe("practice_monthly");

    const reverted = await expirePracticeSubscription({ lemonSubscriptionId: "sub_1" });
    expect(reverted).toBe("offering_5");
    expect(await getSettlerTier(settlerId)).toBe("offering_5");
    expect(await getSettlerLemonSubscriptionId(settlerId)).toBeNull();
  });

  it("flags payment failed without dropping the seat", async () => {
    const settlerId = "SOUL-FAIL-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    await applyPracticeSubscription({ settlerId, lemonSubscriptionId: "sub_fail" });
    const flagged = await flagPracticePaymentFailed({ lemonSubscriptionId: "sub_fail" });
    expect(flagged?.settler_id).toBe(settlerId);
    expect(flagged?.payment_failed_at).toBeTruthy();
    expect(await getSettlerTier(settlerId)).toBe("practice_monthly");
  });

  it("reverts wanderer when no prior one-time seat", async () => {
    const settlerId = "SOUL-WAND-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    await setSettlerTier(settlerId, "wanderer");
    await applyPracticeSubscription({ settlerId, lemonSubscriptionId: "sub_w" });
    expect(await expirePracticeSubscription({ lemonSubscriptionId: "sub_w" })).toBe("wanderer");
  });
});
