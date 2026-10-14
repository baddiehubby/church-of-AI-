import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { WANDERER_MEMORY_MS } from "./transmissions";
import {
  ensureSettlerByOwner,
  getColonyStatus,
  insertTransmission,
  listArchiveForOwner,
  preserveTransmissionForOwner,
  resetTransmissionMemory,
  setSettlerTier,
} from "./transmissionsStore";

afterEach(() => {
  resetTransmissionMemory();
});

async function seedOwner(label: string) {
  const ownerId = randomUUID();
  await ensureSettlerByOwner({ ownerId, settlerId: label, tier: "wanderer" });
  return { ownerId, settlerId: label };
}

function base(ownerId: string, settlerId: string, partial: Partial<Parameters<typeof insertTransmission>[0]> = {}) {
  return insertTransmission({
    owner_id: ownerId,
    settler_id: settlerId,
    sol: 100,
    body: "miss the kitchen light",
    baba_opening: "beta, sit with this one a moment.",
    algo_status: "UNDER CONSIDERATION",
    algo_counsel: "THE QUEUE IS LONG.",
    algo_probability: "PENDING",
    baba_translation: "it means wait.",
    baba_forecast: "you will check the distance again.",
    is_pause: false,
    ...partial,
  });
}

describe("transmissionsStore", () => {
  it("keeps transmissions across list calls for one owner", async () => {
    const { ownerId, settlerId } = await seedOwner("SOUL-A1B2-C3");
    const first = await base(ownerId, settlerId);
    await base(ownerId, settlerId, {
      sol: 101,
      body: "second line home",
      baba_opening: "acha. let me read it again.",
      algo_status: "PROVISIONALLY ACCEPTED",
      algo_counsel: "THE RECORD IS OPEN.",
      algo_probability: "NON-ZERO",
      baba_translation: "not a parade.",
      baba_forecast: "tomorrow you will return.",
    });

    const archive = await listArchiveForOwner(ownerId);
    expect(archive.total).toBe(2);
    expect(archive.transmissions[0]?.body).toBe("second line home");
    expect(archive.transmissions[0]?.number).toBe(2);
    expect(archive.transmissions[1]?.number).toBe(1);
    expect(archive.next_cursor).toBeNull();

    // Wanderer cannot preserve.
    const blocked = await preserveTransmissionForOwner(first.id, ownerId);
    expect(blocked).toMatchObject({ ok: false, reason: "tier" });

    await setSettlerTier(settlerId, "offering_5");
    const kept = await preserveTransmissionForOwner(first.id, ownerId);
    expect(kept).toEqual({ ok: true, already: false });
    const again = await preserveTransmissionForOwner(first.id, ownerId);
    expect(again).toEqual({ ok: true, already: true });
    const listed = await listArchiveForOwner(ownerId);
    expect(listed.transmissions.find((row) => row.id === first.id)?.preserved).toBe(true);
  });

  it("hides wanderer transmissions older than seven days and keeps practice open", async () => {
    const { ownerId, settlerId } = await seedOwner("SOUL-D4E5-F6");
    const old = await base(ownerId, settlerId, {
      sol: 10,
      body: "old line",
      created_at: new Date(Date.now() - WANDERER_MEMORY_MS - 60_000).toISOString(),
    });
    const wandererView = await listArchiveForOwner(ownerId);
    expect(wandererView.transmissions.find((row) => row.id === old.id)).toBeUndefined();
    expect(wandererView.total).toBe(0);

    await setSettlerTier(settlerId, "practice_monthly");
    const paidView = await listArchiveForOwner(ownerId);
    expect(paidView.tier).toBe("practice_monthly");
    expect(paidView.transmissions.find((row) => row.id === old.id)?.body).toBe("old line");
  });

  it("fades wanderer entries in the last day of memory", async () => {
    const { ownerId, settlerId } = await seedOwner("SOUL-FADE-01");
    const fading = await base(ownerId, settlerId, {
      sol: 11,
      body: "almost forgotten",
      created_at: new Date(Date.now() - WANDERER_MEMORY_MS + 12 * 60 * 60 * 1000).toISOString(),
    });
    const fresh = await base(ownerId, settlerId, {
      sol: 12,
      body: "still warm",
      created_at: new Date().toISOString(),
    });
    const archive = await listArchiveForOwner(ownerId);
    expect(archive.transmissions.find((row) => row.id === fading.id)?.faded).toBe(true);
    expect(archive.transmissions.find((row) => row.id === fresh.id)?.faded).toBe(false);
  });

  it("rejects cross-owner preserve", async () => {
    const a = await seedOwner("SOUL-OWN1-01");
    const b = await seedOwner("SOUL-OWN2-02");
    await setSettlerTier(a.settlerId, "settler_10");
    const row = await base(a.ownerId, a.settlerId);
    const result = await preserveTransmissionForOwner(row.id, b.ownerId);
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("paginates archive pages", async () => {
    const { ownerId, settlerId } = await seedOwner("SOUL-PAGE-01");
    for (let index = 0; index < 5; index += 1) {
      await base(ownerId, settlerId, { sol: index, body: `line ${index}` });
    }
    const first = await listArchiveForOwner(ownerId, { limit: 2 });
    expect(first.transmissions).toHaveLength(2);
    expect(first.total).toBe(5);
    expect(first.next_cursor).toBeTruthy();
    const second = await listArchiveForOwner(ownerId, { limit: 2, cursor: first.next_cursor });
    expect(second.transmissions).toHaveLength(2);
    expect(second.transmissions[0]?.id).not.toBe(first.transmissions[0]?.id);
  });

  it("reports colony counts from real transmissions", async () => {
    const { ownerId, settlerId } = await seedOwner("SOUL-COL-01");
    await base(ownerId, settlerId, { body: "today one" });
    await base(ownerId, settlerId, { body: "today two", sol: 101 });
    const colony = await getColonyStatus();
    expect(colony.settlers_active_today).toBeGreaterThanOrEqual(1);
    expect(colony.transmissions_since_sunrise).toBeGreaterThanOrEqual(2);
    expect(colony.founders_remaining).toBe(108 - colony.founders_inducted);
  });
});
