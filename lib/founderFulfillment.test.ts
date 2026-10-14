import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { resetCeremonyMemory, getCeremonyByToken } from "./ceremony";
import { completeFounderFulfillment } from "./founderFulfillment";
import { founderEmailCopy, foundersPageCopy } from "@/content/redPath";
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

describe("founder fulfillment", () => {
  it("assigns position, queues physical pack, and mints a private ceremony", async () => {
    const settlerId = "SOUL-FNDR-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer", solOfArrival: 12 });

    const offering = await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_found_1",
      name: "Ravi",
      email: "ravi@example.com",
      showName: true,
    });
    expect(offering).toMatchObject({ ok: true, founderPosition: 1 });

    const fulfillment = await completeFounderFulfillment({
      settlerId,
      name: "Ravi",
      email: "ravi@example.com",
      showName: true,
      lemonOrderId: "ord_found_1",
      position: 1,
      shipping: {
        name: "Ravi",
        line1: "1 Red Dust Lane",
        city: "Austin",
        region: "TX",
        postal: "78701",
        country: "US",
      },
    });

    expect(fulfillment.position).toBe(1);
    expect(fulfillment.ceremonyUrl).toContain("/ceremony/");
    expect(fulfillment.shippingText).toContain("1 Red Dust Lane");

    const ceremony = await getCeremonyByToken(fulfillment.ceremonyToken);
    expect(ceremony?.script).toContain("Ravi.");
    expect(ceremony?.script).toContain("founder 1 of 108");

    const queue = await listFulfillmentQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      position: 1,
      name: "Ravi",
      email: "ravi@example.com",
      shipping_line1: "1 Red Dust Lane",
      status: "queued",
      lemon_order_id: "ord_found_1",
    });

    const roster = await listFoundersRoster();
    expect(roster[0]).toMatchObject({
      position: 1,
      vacant: false,
      displayName: "Ravi",
    });
    expect(roster[1]?.vacant).toBe(true);
    expect(roster).toHaveLength(108);
  });

  it("hides names without permission and keeps email subject exact", async () => {
    const settlerId = "SOUL-ANON-02";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_anon",
      name: "Secret",
      showName: false,
    });
    await completeFounderFulfillment({
      settlerId,
      name: "Secret",
      showName: false,
      lemonOrderId: "ord_anon",
    });

    const roster = await listFoundersRoster();
    expect(roster[0]?.displayName).toBe(foundersPageCopy.anonymous);
    expect(founderEmailCopy.subject).toBe("you are a founder of the red path.");
  });

  it("is idempotent on ceremony + fulfillment for the same order", async () => {
    const settlerId = "SOUL-IDEM-03";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    await applyRedPathOffering({
      settlerId,
      tier: "founder_1000",
      lemonOrderId: "ord_idem",
      name: "Twice",
      showName: true,
    });

    const first = await completeFounderFulfillment({
      settlerId,
      name: "Twice",
      showName: true,
      lemonOrderId: "ord_idem",
    });
    const second = await completeFounderFulfillment({
      settlerId,
      name: "Twice",
      showName: true,
      lemonOrderId: "ord_idem",
    });

    expect(second.already).toBe(true);
    expect(second.ceremonyToken).toBe(first.ceremonyToken);
    expect(await listFulfillmentQueue()).toHaveLength(1);
  });
});
