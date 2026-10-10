import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "./webhookSignature";

const secret = "test-secret";
const body = JSON.stringify({ meta: { event_name: "order_created" }, data: { id: "1" } });
const good = createHmac("sha256", secret).update(body, "utf8").digest("hex");

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature", () => {
    expect(verifyWebhookSignature(body, good, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyWebhookSignature(`${body} `, good, secret)).toBe(false);
    expect(verifyWebhookSignature(body.replace("order_created", "order_refunded"), good, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyWebhookSignature(body, good, "other-secret")).toBe(false);
  });

  it("returns false without throwing on wrong-length or non-hex signatures", () => {
    expect(() => verifyWebhookSignature(body, "abcd", secret)).not.toThrow();
    expect(verifyWebhookSignature(body, "abcd", secret)).toBe(false);
    expect(verifyWebhookSignature(body, `${good}00`, secret)).toBe(false);
    expect(verifyWebhookSignature(body, "z".repeat(64), secret)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});
