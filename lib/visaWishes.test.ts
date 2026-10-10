import { afterEach, describe, expect, it } from "vitest";

import {
  applyPaidOrder,
  applyRefund,
  createPendingVisaWish,
  generateReferenceId,
  getSharedVisa,
  getVisaView,
  isVisaReference,
} from "./visaWishes";

function resetMemory(): void {
  (globalThis as typeof globalThis & { __visaMemory?: Map<string, unknown> }).__visaMemory = new Map();
}

afterEach(resetMemory);

describe("visa wishes store", () => {
  it("treats a well-formed unpaid reference as missing, with no paid fields", () => {
    const referenceId = generateReferenceId();
    expect(isVisaReference(referenceId)).toBe(true);
    return expect(getVisaView(referenceId)).resolves.toEqual({ state: "missing" });
  });

  it("does not expose wish or reading while the row is still pending", async () => {
    const pending = await createPendingVisaWish({
      categoryId: "visa-canada",
      country: "Canada",
      wish: "I wish to build a quieter life.",
      firstName: "Ada",
    });
    const view = await getVisaView(pending.referenceId);
    expect(view).toEqual({ state: "pending" });
    expect(JSON.stringify(view)).not.toMatch(/quieter|Ada|Canada/);
  });

  it("unlocks once for a paid order and treats a repeat as a duplicate", async () => {
    const pending = await createPendingVisaWish({
      categoryId: "visa-usa",
      country: "United States",
      wish: "I wish to study there.",
      firstName: null,
    });
    const first = await applyPaidOrder({ referenceId: pending.referenceId, orderId: "ord_1" });
    expect(first).toEqual({ result: "issued", certificateNo: pending.certificateNo, detail: "marked_paid" });
    const second = await applyPaidOrder({ referenceId: pending.referenceId, orderId: "ord_1" });
    expect(second.result).toBe("duplicate");
    const third = await applyPaidOrder({ referenceId: pending.referenceId, orderId: "ord_2" });
    expect(third.result).toBe("duplicate");

    const view = await getVisaView(pending.referenceId);
    expect(view.state).toBe("paid");
    if (view.state === "paid") {
      expect(view.certificate.wish).toBe("I wish to study there.");
      expect(view.certificate.country).toBe("United States");
      expect(view.reading).toBeNull();
    }
    const shared = await getSharedVisa(pending.certificateNo);
    expect(shared).not.toBeNull();
    expect(shared).not.toHaveProperty("wish");
  });

  it("revokes a paid row on refund and ignores a second refund", async () => {
    const pending = await createPendingVisaWish({
      categoryId: "visa-uk",
      country: "United Kingdom",
      wish: "I wish to study there.",
      firstName: null,
    });
    await applyPaidOrder({ referenceId: pending.referenceId, orderId: "ord_refund" });
    const first = await applyRefund("ord_refund");
    expect(first.result).toBe("revoked");
    expect(await getVisaView(pending.referenceId)).toEqual({ state: "refunded" });
    expect(await getSharedVisa(pending.certificateNo)).toBeNull();
    const second = await applyRefund("ord_refund");
    expect(second.result).toBe("already");
  });
});
