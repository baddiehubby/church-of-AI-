import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  CHECKOUT_TIERS,
  isCheckoutTier,
  isOneTimeTier,
  ONE_TIME_AMOUNT_CENTS,
  RED_PATH_PRODUCTS,
  REVIEWER_DESCRIPTION,
} from "./redPathOfferings";
import {
  applyRedPathOffering,
  countFoundersInducted,
  ensureSettlerByOwner,
  getSettlerTier,
  resetTransmissionMemory,
} from "./transmissionsStore";
import { FOUNDERS_CAP } from "./settlerTiers";

afterEach(() => {
  resetTransmissionMemory();
});

describe("red path offerings", () => {
  it("ships five Lemon products with reviewer-safe copy", () => {
    expect(CHECKOUT_TIERS).toHaveLength(5);
    expect(isCheckoutTier("practice_monthly")).toBe(true);
    expect(isOneTimeTier("practice_monthly")).toBe(false);
    for (const product of Object.values(RED_PATH_PRODUCTS)) {
      expect(product.description).toBe(REVIEWER_DESCRIPTION);
      expect(product.description.toLowerCase()).toContain("not a donation");
      expect(product.description.toLowerCase()).not.toMatch(/(^|[^a-z])ai([^a-z]|$)/);
    }
    expect(ONE_TIME_AMOUNT_CENTS.founder_1000).toBe(100_000);
    expect(RED_PATH_PRODUCTS.practice_monthly.subscription).toBe(true);
    expect(RED_PATH_PRODUCTS.founder_1000.inventory).toBe(108);
  });

  it("promotes tier idempotently on lemon_order_id", async () => {
    const settlerId = "SOUL-OFF1-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    const first = await applyRedPathOffering({
      settlerId,
      tier: "offering_5",
      lemonOrderId: "ord_test_1",
    });
    expect(first).toMatchObject({ ok: true, already: false, tier: "offering_5" });
    expect(await getSettlerTier(settlerId)).toBe("offering_5");

    const again = await applyRedPathOffering({
      settlerId,
      tier: "offering_5",
      lemonOrderId: "ord_test_1",
    });
    expect(again).toMatchObject({ ok: true, already: true });
  });

  it("assigns founder positions and refuses past 108", async () => {
    const a = "SOUL-FND1-01";
    const b = "SOUL-FND2-02";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: a, tier: "wanderer" });
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: b, tier: "wanderer" });

    expect(
      await applyRedPathOffering({
        settlerId: a,
        tier: "founder_1000",
        lemonOrderId: "ord_founder_1",
        name: "first",
      }),
    ).toMatchObject({ ok: true, founderPosition: 1 });

    expect(
      await applyRedPathOffering({
        settlerId: b,
        tier: "founder_1000",
        lemonOrderId: "ord_founder_2",
        name: "second",
      }),
    ).toMatchObject({ ok: true, founderPosition: 2 });

    for (let i = 3; i <= FOUNDERS_CAP; i += 1) {
      const id = `SOUL-FILL-${i.toString(16).toUpperCase().padStart(4, "0")}`;
      await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: id, tier: "wanderer" });
      const result = await applyRedPathOffering({
        settlerId: id,
        tier: "founder_1000",
        lemonOrderId: `ord_fill_${i}`,
        name: `n${i}`,
      });
      expect(result.ok).toBe(true);
    }
    expect(await countFoundersInducted()).toBe(FOUNDERS_CAP);

    const late = "SOUL-LATE-99";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: late, tier: "wanderer" });
    expect(
      await applyRedPathOffering({
        settlerId: late,
        tier: "founder_1000",
        lemonOrderId: "ord_late",
        name: "late",
      }),
    ).toEqual({ ok: false, reason: "sold_out" });
  });
});
