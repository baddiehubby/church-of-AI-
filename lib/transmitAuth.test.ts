import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { sanitizeBody } from "./sanitizeBody";
import {
  ensureSettlerByOwner,
  insertTransmission,
  listArchiveForOwner,
  preserveTransmissionForOwner,
  resetTransmissionMemory,
} from "./transmissionsStore";
import { resetRateLimitMemory, rateLimitByKey } from "./rateLimit";

afterEach(() => {
  resetTransmissionMemory();
  resetRateLimitMemory();
});

describe("transmission ownership and limits", () => {
  it("sanitizes invalid and oversized bodies", () => {
    expect(sanitizeBody("")).toBeNull();
    expect(sanitizeBody("   ")).toBeNull();
    expect(sanitizeBody("<script></script>")).toBeNull();
    expect(sanitizeBody("<script>x</script>")).toBe("x");
    expect(sanitizeBody("ok <b>mars</b>")).toBe("ok mars");
    expect(sanitizeBody("a".repeat(400))?.length).toBe(280);
  });

  it("blocks reading another owner's archive by label alone", async () => {
    const a = await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: "SOUL-AAA1-01" });
    const b = await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: "SOUL-BBB2-02" });
    await insertTransmission({
      owner_id: a.ownerId,
      settler_id: a.settlerId,
      sol: 1,
      body: "private line",
      baba_opening: "sit.",
      algo_status: "UNDER CONSIDERATION",
      algo_counsel: "WAIT.",
      algo_probability: "PENDING",
      baba_translation: "wait.",
      baba_forecast: "continue.",
      is_pause: false,
    });

    const foreign = await listArchiveForOwner(b.ownerId);
    expect(foreign.total).toBe(0);
    expect(foreign.transmissions).toHaveLength(0);

    const own = await listArchiveForOwner(a.ownerId);
    expect(own.total).toBe(1);
    expect(own.transmissions[0]?.body).toBe("private line");
  });

  it("enforces burst and hourly rate keys", async () => {
    const key = `owner:${randomUUID()}`;
    expect((await rateLimitByKey(key, "test-burst", 1, 30_000)).ok).toBe(true);
    expect((await rateLimitByKey(key, "test-burst", 1, 30_000)).ok).toBe(false);

    const hourKey = `owner:${randomUUID()}`;
    expect((await rateLimitByKey(hourKey, "test-hour", 3, 60 * 60 * 1000)).ok).toBe(true);
    expect((await rateLimitByKey(hourKey, "test-hour", 3, 60 * 60 * 1000)).ok).toBe(true);
    expect((await rateLimitByKey(hourKey, "test-hour", 3, 60 * 60 * 1000)).ok).toBe(true);
    expect((await rateLimitByKey(hourKey, "test-hour", 3, 60 * 60 * 1000)).ok).toBe(false);
  });

  it("preserve is idempotent for the owner", async () => {
    const owner = await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId: "SOUL-KEEP-01" });
    const row = await insertTransmission({
      owner_id: owner.ownerId,
      settler_id: owner.settlerId,
      sol: 2,
      body: "keep this",
      baba_opening: "sit.",
      algo_status: "UNDER CONSIDERATION",
      algo_counsel: "WAIT.",
      algo_probability: "PENDING",
      baba_translation: "wait.",
      baba_forecast: "continue.",
      is_pause: false,
    });
    expect(await preserveTransmissionForOwner(row.id, owner.ownerId)).toEqual({ ok: true, already: false });
    expect(await preserveTransmissionForOwner(row.id, owner.ownerId)).toEqual({ ok: true, already: true });
  });
});
