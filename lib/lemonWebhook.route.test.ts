import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHmac, randomUUID } from "node:crypto";

import { POST } from "@/app/api/webhook/lemon/route";
import { resetCeremonyMemory } from "./ceremony";
import {
  ensureSettlerByOwner,
  findFounderBySettler,
  listFulfillmentQueue,
  resetTransmissionMemory,
} from "./transmissionsStore";

const SECRET = "lemon-test-webhook-secret";

function sign(raw: string): string {
  return createHmac("sha256", SECRET).update(raw, "utf8").digest("hex");
}

function orderPayload(input: {
  settlerId: string;
  orderId: string;
  status?: string;
  showName?: boolean;
  name?: string;
}) {
  return {
    meta: {
      event_name: "order_created",
      custom_data: {
        kind: "red_path",
        settler_id: input.settlerId,
        tier: "founder_1000",
        show_name: input.showName === false ? "0" : "1",
        name: input.name ?? "Webhook Founder",
        shipping_line1: "1 Dust Rd",
        shipping_city: "Austin",
        shipping_country: "US",
      },
    },
    data: {
      id: input.orderId,
      attributes: {
        status: input.status ?? "paid",
        identifier: input.orderId,
        user_email: "founder@example.com",
        user_name: input.name ?? "Webhook Founder",
        total: 100_000,
        customer_id: "cust_1",
        first_order_item: { variant_id: "ind_variant" },
      },
    },
  };
}

describe("POST /api/webhook/lemon induction", () => {
  beforeEach(() => {
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = "ind_variant";
    resetTransmissionMemory();
    resetCeremonyMemory();
  });

  afterEach(() => {
    resetTransmissionMemory();
    resetCeremonyMemory();
  });

  it("rejects invalid signatures with 401", async () => {
    const raw = JSON.stringify(orderPayload({ settlerId: "SOUL-WH01-01", orderId: "o1" }));
    const response = await POST(
      new Request("http://localhost/api/webhook/lemon", {
        method: "POST",
        headers: { "x-signature": "00".repeat(32), "content-type": "application/json" },
        body: raw,
      }),
    );
    expect(response.status).toBe(401);
  });

  it("ignores unpaid orders without creating a founder", async () => {
    const settlerId = "SOUL-WH02-02";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    const raw = JSON.stringify(
      orderPayload({ settlerId, orderId: "o_unpaid", status: "pending" }),
    );
    const response = await POST(
      new Request("http://localhost/api/webhook/lemon", {
        method: "POST",
        headers: { "x-signature": sign(raw), "content-type": "application/json" },
        body: raw,
      }),
    );
    expect(response.status).toBe(200);
    expect(await findFounderBySettler(settlerId)).toBeNull();
  });

  it("creates founder on paid order and is idempotent on retry", async () => {
    const settlerId = "SOUL-WH03-03";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    const raw = JSON.stringify(orderPayload({ settlerId, orderId: "o_paid_1", name: "Wall Name" }));
    const request = () =>
      POST(
        new Request("http://localhost/api/webhook/lemon", {
          method: "POST",
          headers: { "x-signature": sign(raw), "content-type": "application/json" },
          body: raw,
        }),
      );

    const first = await request();
    expect(first.status).toBe(200);
    const firstJson = (await first.json()) as { founderPosition?: number };
    expect(firstJson.founderPosition).toBe(1);
    expect(await findFounderBySettler(settlerId)).toMatchObject({
      position: 1,
      name: "Wall Name",
      show_name: true,
    });
    expect(await listFulfillmentQueue()).toHaveLength(1);

    const second = await request();
    expect(second.status).toBe(200);
    const secondJson = (await second.json()) as { already?: boolean };
    expect(secondJson.already).toBe(true);
    expect(await listFulfillmentQueue()).toHaveLength(1);
  });
});
