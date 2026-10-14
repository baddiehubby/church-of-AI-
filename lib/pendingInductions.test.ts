import { afterEach, describe, expect, it } from "vitest";
import { createHmac, randomUUID } from "node:crypto";

import { POST } from "@/app/api/webhook/lemon/route";
import { resetCeremonyMemory } from "./ceremony";
import { inductionInstallmentsConfigured, isAllowedInductionTier } from "./inductionAllowlist";
import { clientTriedToSetPriceOrStatus } from "./inductionPlanTypes";
import {
  createPendingInduction,
  latestPendingForSettler,
  markPendingInductionFailed,
  markPendingInductionPaid,
  resetPendingInductionMemory,
} from "./pendingInductions";
import { ensureSettlerByOwner, findFounderBySettler, resetTransmissionMemory } from "./transmissionsStore";

afterEach(() => {
  resetTransmissionMemory();
  resetCeremonyMemory();
  resetPendingInductionMemory();
});

describe("induction allowlist and pending reconciliation", () => {
  it("allows only founder_1000 and disables installments", () => {
    expect(isAllowedInductionTier("founder_1000")).toBe(true);
    expect(isAllowedInductionTier("practice_monthly")).toBe(false);
    expect(inductionInstallmentsConfigured()).toBe(false);
    expect(clientTriedToSetPriceOrStatus({ variant_id: "x" })).toBe(false);
  });

  it("records pending checkout and marks paid after fulfillment path", async () => {
    const settlerId = "SOUL-PEND-01";
    await createPendingInduction({
      settlerId,
      name: "Pending",
      showName: true,
      shipping: { line1: "1 Path", city: "Austin", country: "US" },
    });
    expect((await latestPendingForSettler(settlerId))?.status).toBe("pending");

    await markPendingInductionPaid({ settlerId, lemonOrderId: "ord_p1" });
    expect(await latestPendingForSettler(settlerId)).toMatchObject({
      status: "paid",
      lemon_order_id: "ord_p1",
    });
  });

  it("marks pending failed when checkout creation fails", async () => {
    const settlerId = "SOUL-PEND-02";
    await createPendingInduction({ settlerId, name: "Fail", showName: false });
    await markPendingInductionFailed({ settlerId, error: "timeout" });
    expect(await latestPendingForSettler(settlerId)).toMatchObject({
      status: "failed",
      error: "timeout",
    });
  });
});

describe("lemon webhook store filter and unpaid", () => {
  const SECRET = "pending-webhook-secret";

  function sign(raw: string): string {
    return createHmac("sha256", SECRET).update(raw, "utf8").digest("hex");
  }

  afterEach(() => {
    delete process.env.LEMON_SQUEEZY_STORE_ID;
  });

  it("ignores unpaid orders and foreign stores", async () => {
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMON_SQUEEZY_STORE_ID = "store_home";
    process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = "ind_v";

    const settlerId = "SOUL-WHST-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });

    const unpaid = JSON.stringify({
      meta: {
        event_name: "order_created",
        custom_data: { kind: "red_path", settler_id: settlerId, tier: "founder_1000", show_name: "1" },
      },
      data: {
        id: "o_u",
        attributes: {
          status: "pending",
          store_id: "store_home",
          identifier: "o_u",
          user_email: "a@b.com",
          first_order_item: { variant_id: "ind_v" },
        },
      },
    });
    const unpaidRes = await POST(
      new Request("http://localhost/api/webhook/lemon", {
        method: "POST",
        headers: { "x-signature": sign(unpaid) },
        body: unpaid,
      }),
    );
    expect(unpaidRes.status).toBe(200);
    expect(await findFounderBySettler(settlerId)).toBeNull();

    const foreign = JSON.stringify({
      meta: {
        event_name: "order_created",
        custom_data: { kind: "red_path", settler_id: settlerId, tier: "founder_1000", show_name: "1" },
      },
      data: {
        id: "o_f",
        attributes: {
          status: "paid",
          store_id: "other_store",
          identifier: "o_f",
          user_email: "a@b.com",
          total: 100_000,
          first_order_item: { variant_id: "ind_v" },
        },
      },
    });
    const foreignRes = await POST(
      new Request("http://localhost/api/webhook/lemon", {
        method: "POST",
        headers: { "x-signature": sign(foreign) },
        body: foreign,
      }),
    );
    expect(foreignRes.status).toBe(200);
    expect(await findFounderBySettler(settlerId)).toBeNull();
  });
});
