import { describe, expect, it } from "vitest";

import { signStripePayload, verifyStripeSignature } from "./stripeSign";

describe("stripe signatures", () => {
  it("accepts a fresh signature and rejects a tampered body", () => {
    const secret = "whsec_test";
    const payload = '{"id":"evt_1"}';
    const timestamp = "1700000000";
    const signature = signStripePayload(secret, timestamp, payload);
    const header = `t=${timestamp},v1=${signature}`;
    const now = 1700000000 * 1000;
    expect(verifyStripeSignature(secret, payload, header, now)).toBe(true);
    expect(verifyStripeSignature(secret, payload + " ", header, now)).toBe(false);
    expect(verifyStripeSignature(secret, payload, header, now + 400_000 * 1000)).toBe(false);
  });
});
