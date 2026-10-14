import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { composeSettlerLetter, statsFromTransmissions } from "./settlerLetter";
import {
  ensureSettlerByOwner,
  insertTransmission,
  listArchiveForOwner,
  resetTransmissionMemory,
  setSettlerTier,
  getSettlerTier,
} from "./transmissionsStore";
import { resetLetterMemory, upsertLetter, getLetter } from "./lettersStore";
import { BELIEVER_MONTHLY_CENTS, believerLineItems, settlerPriceId } from "./stripeBilling";

afterEach(() => {
  resetTransmissionMemory();
  resetLetterMemory();
});

describe("settler's covenant + monthly letter", () => {
  it("builds a $10/month Settler's Covenant line item when no price id is set", () => {
    const params = believerLineItems(null);
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe(String(BELIEVER_MONTHLY_CENTS));
    expect(params.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(params.get("line_items[0][price_data][product_data][name]")).toBe("Settler's Covenant");
    // Prefer dashboard price when configured.
    if (settlerPriceId()) {
      expect(believerLineItems(settlerPriceId()).get("line_items[0][price]")).toBe(settlerPriceId());
    }
  });

  it("promotes and demotes tier idempotently", async () => {
    const settlerId = "SOUL-COV1-01";
    await ensureSettlerByOwner({ ownerId: randomUUID(), settlerId, tier: "wanderer" });
    expect(await getSettlerTier(settlerId)).toBe("wanderer");
    expect(await setSettlerTier(settlerId, "practice_monthly")).toEqual({ changed: true });
    expect(await setSettlerTier(settlerId, "practice_monthly")).toEqual({ changed: false });
    expect(await getSettlerTier(settlerId)).toBe("practice_monthly");
    expect(await setSettlerTier(settlerId, "wanderer")).toEqual({ changed: true });
    expect(await setSettlerTier(settlerId, "wanderer")).toEqual({ changed: false });
  });

  it("stores a monthly letter and keeps archive open for settlers past seven days", async () => {
    const ownerId = randomUUID();
    const settlerId = "SOUL-LET1-01";
    await ensureSettlerByOwner({ ownerId, settlerId, tier: "practice_monthly" });
    const rows = [];
    for (let i = 0; i < 3; i += 1) {
      rows.push(
        await insertTransmission({
          owner_id: ownerId,
          settler_id: settlerId,
          sol: 100 + i,
          body: `line ${i} about the corridor`,
          baba_opening: "sit.",
          algo_status: "UNDER CONSIDERATION",
          algo_counsel: "WAIT.",
          algo_probability: "PENDING",
          baba_translation: "wait.",
          baba_forecast: "continue.",
          is_pause: i === 1,
          created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
        }),
      );
    }
    const stats = statsFromTransmissions(rows);
    const composed = composeSettlerLetter("2026-09", stats, settlerId);
    const stored = await upsertLetter({ settler_id: settlerId, month: "2026-09", body: composed.body });
    expect(stored.body).toContain("SETTLER,");
    expect(stored.body).toContain("— baba ji");
    expect((await getLetter(settlerId, "2026-09"))?.body).toBe(composed.body);

    const archive = await listArchiveForOwner(ownerId);
    expect(archive.tier).toBe("practice_monthly");
    expect(archive.total).toBe(3);
  });
});
