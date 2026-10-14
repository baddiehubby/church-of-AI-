import { afterEach, describe, expect, it } from "vitest";
import { createHmac, randomUUID } from "node:crypto";

import { clientTriedToSetPriceOrStatus } from "./inductionPlanTypes";
import { inductionCheckoutReady, listConfiguredInductionPlans } from "./inductionPlans";
import { verifyWebhookSignature } from "./webhookSignature";
import { completeFounderFulfillment } from "./founderFulfillment";
import { resetCeremonyMemory } from "./ceremony";
import { foundersPageCopy } from "@/content/redPath";
import {
  applyRedPathOffering,
  ensureSettlerByOwner,
  listFoundersRoster,
  listFulfillmentQueue,
  resetTransmissionMemory,
} from "./transmissionsStore";

afterEach(() => {
  resetTransmissionMemory();
  resetCeremonyMemory();
});

describe("induction checkout validation", () => {
  it("rejects browser-supplied prices and payment status fields", () => {
    expect(clientTriedToSetPriceOrStatus({ tier: "founder_1000" })).toBe(false);
    expect(clientTriedToSetPriceOrStatus({ tier: "founder_1000", amountCents: 1 })).toBe(true);
    expect(clientTriedToSetPriceOrStatus({ tier: "founder_1000", status: "paid" })).toBe(true);
    expect(clientTriedToSetPriceOrStatus({ tier: "founder_1000", paid: true })).toBe(true);
  });

  it("lists no induction plans when Lemon variant env is empty", () => {
    const prevKey = process.env.LEMON_SQUEEZY_API_KEY;
    const prevStore = process.env.LEMON_SQUEEZY_STORE_ID;
    const prevVariant = process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
    const prevLegacy = process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID;
    delete process.env.LEMON_SQUEEZY_API_KEY;
    delete process.env.LEMON_SQUEEZY_STORE_ID;
    delete process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
    delete process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID;
    expect(inductionCheckoutReady()).toBe(false);
    expect(listConfiguredInductionPlans()).toEqual([]);
    if (prevKey !== undefined) process.env.LEMON_SQUEEZY_API_KEY = prevKey;
    if (prevStore !== undefined) process.env.LEMON_SQUEEZY_STORE_ID = prevStore;
    if (prevVariant !== undefined) process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = prevVariant;
    if (prevLegacy !== undefined) process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID = prevLegacy;
  });

  it("exposes the one-time plan only when Lemon induction is configured", () => {
    const prevKey = process.env.LEMON_SQUEEZY_API_KEY;
    const prevStore = process.env.LEMON_SQUEEZY_STORE_ID;
    const prevVariant = process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
    process.env.LEMON_SQUEEZY_API_KEY = "test_key";
    process.env.LEMON_SQUEEZY_STORE_ID = "1";
    process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = "999";
    expect(inductionCheckoutReady()).toBe(true);
    expect(listConfiguredInductionPlans()).toEqual([
      {
        tier: "founder_1000",
        label: "THE INDUCTION — $1,000 USD ONE-TIME",
        amountCents: 100_000,
        currency: "USD",
        kind: "one_time",
        available: true,
      },
    ]);
    if (prevKey !== undefined) process.env.LEMON_SQUEEZY_API_KEY = prevKey;
    else delete process.env.LEMON_SQUEEZY_API_KEY;
    if (prevStore !== undefined) process.env.LEMON_SQUEEZY_STORE_ID = prevStore;
    else delete process.env.LEMON_SQUEEZY_STORE_ID;
    if (prevVariant !== undefined) process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = prevVariant;
    else delete process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
  });
});

describe("induction webhook security and fulfillment", () => {
  const secret = "induction-webhook-secret";
  const body = JSON.stringify({ meta: { event_name: "order_created" } });

  it("rejects invalid signatures", () => {
    const good = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyWebhookSignature(body, good, secret)).toBe(true);
    expect(verifyWebhookSignature(body, "deadbeef", secret)).toBe(false);
    expect(verifyWebhookSignature(body, good, "wrong")).toBe(false);
  });

  it("creates founder only after successful offering apply; duplicate order is idempotent", async () => {
    const settlerId = "SOUL-PAY1-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });

    const first = await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_pay_1",
      name: "Paid",
      email: "paid@example.com",
      showName: true,
    });
    expect(first).toMatchObject({ ok: true, already: false, founderPosition: 1 });

    const fulfill = await completeFounderFulfillment({
      settlerId,
      name: "Paid",
      email: "paid@example.com",
      showName: true,
      lemonOrderId: "ord_pay_1",
      position: 1,
    });
    expect(fulfill.position).toBe(1);

    const dup = await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_pay_1",
      name: "Paid",
      showName: true,
    });
    expect(dup).toMatchObject({ ok: true, already: true, founderPosition: 1 });

    const again = await completeFounderFulfillment({
      settlerId,
      name: "Paid",
      showName: true,
      lemonOrderId: "ord_pay_1",
    });
    expect(again.already).toBe(true);
    expect(await listFulfillmentQueue()).toHaveLength(1);
  });

  it("does not put unauthorized names on the Wall of Survivors", async () => {
    const settlerId = "SOUL-HID1-02";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_hide",
      name: "Hidden Founder",
      showName: false,
    });
    await completeFounderFulfillment({
      settlerId,
      name: "Hidden Founder",
      showName: false,
      lemonOrderId: "ord_hide",
    });
    const roster = await listFoundersRoster();
    expect(roster[0]?.displayName).toBe(foundersPageCopy.anonymous);
    expect(roster[0]?.displayName).not.toContain("Hidden");
  });

  it("refuses induction after 108 without creating a late founder", async () => {
    for (let i = 1; i <= 108; i += 1) {
      const id = `SOUL-CAP${i.toString(16).toUpperCase().padStart(4, "0").slice(-4)}`;
      await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: id, tier: "wanderer" });
      const result = await applyRedPathOffering({
        settlerId: id,
        tier: "founder_1000",
        lemonOrderId: `ord_cap_${i}`,
        name: `n${i}`,
        showName: false,
      });
      expect(result.ok).toBe(true);
    }
    const late = "SOUL-LATE-FF";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: late, tier: "wanderer" });
    expect(
      await applyRedPathOffering({
        settlerId: late,
        tier: "founder_1000",
        lemonOrderId: "ord_late_fail",
        name: "Late",
      }),
    ).toEqual({ ok: false, reason: "sold_out" });
  });
});
