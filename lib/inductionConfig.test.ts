import { describe, expect, it } from "vitest";

import { getInductionConfigStatus } from "./inductionConfig";
import { ONE_TIME_AMOUNT_CENTS } from "./redPathOfferings";

describe("induction config status", () => {
  it("reports missing Lemon env by name only and keeps $1000 cents", () => {
    expect(ONE_TIME_AMOUNT_CENTS.founder_1000).toBe(100_000);

    const prev = {
      key: process.env.LEMON_SQUEEZY_API_KEY,
      store: process.env.LEMON_SQUEEZY_STORE_ID,
      variant: process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION,
      legacy: process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID,
    };
    delete process.env.LEMON_SQUEEZY_API_KEY;
    delete process.env.LEMON_SQUEEZY_STORE_ID;
    delete process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
    delete process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID;

    const status = getInductionConfigStatus();
    expect(status.ready).toBe(false);
    expect(status.missing).toEqual([
      "LEMON_SQUEEZY_API_KEY",
      "LEMON_SQUEEZY_STORE_ID",
      "LEMON_SQUEEZY_VARIANT_ID_INDUCTION",
    ]);
    // Never leak values into the diagnostic payload.
    expect(JSON.stringify(status)).not.toMatch(/sk_|eyJ|lemonsqueezy_/i);

    if (prev.key !== undefined) process.env.LEMON_SQUEEZY_API_KEY = prev.key;
    if (prev.store !== undefined) process.env.LEMON_SQUEEZY_STORE_ID = prev.store;
    if (prev.variant !== undefined) process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = prev.variant;
    if (prev.legacy !== undefined) process.env.LEMON_SQUEEZY_FOUNDER_1000_VARIANT_ID = prev.legacy;
  });

  it("is ready only when api key, store, and induction variant are set", () => {
    const prev = {
      key: process.env.LEMON_SQUEEZY_API_KEY,
      store: process.env.LEMON_SQUEEZY_STORE_ID,
      variant: process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION,
    };
    process.env.LEMON_SQUEEZY_API_KEY = "test_key";
    process.env.LEMON_SQUEEZY_STORE_ID = "1";
    process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = "999";
    expect(getInductionConfigStatus()).toEqual({ ready: true, missing: [] });
    if (prev.key !== undefined) process.env.LEMON_SQUEEZY_API_KEY = prev.key;
    else delete process.env.LEMON_SQUEEZY_API_KEY;
    if (prev.store !== undefined) process.env.LEMON_SQUEEZY_STORE_ID = prev.store;
    else delete process.env.LEMON_SQUEEZY_STORE_ID;
    if (prev.variant !== undefined) process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION = prev.variant;
    else delete process.env.LEMON_SQUEEZY_VARIANT_ID_INDUCTION;
  });
});
