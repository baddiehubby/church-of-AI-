import { beforeEach, describe, expect, it } from "vitest";

import {
  createBlessingDraft,
  getBlessing,
  issueBlessing,
  publishMonumentName,
  publishWallName,
} from "./blessingsStore";

describe("blessings store", () => {
  beforeEach(() => {
    const g = globalThis as typeof globalThis & { __marsBlessings?: unknown };
    delete g.__marsBlessings;
  });

  it("issues a draft once and treats the same lemon order as duplicate", async () => {
    const draft = await createBlessingDraft({
      userId: "SOUL-TEST-01",
      tier: "prayer",
      name: "settler",
      sol: 12,
      message: "keep the dust soft",
    });
    expect(draft.message).toBe("keep the dust soft");
    expect(await issueBlessing({ blessingId: draft.id, lemonOrderId: "order-1" })).toBe("issued");
    expect(await issueBlessing({ blessingId: draft.id, lemonOrderId: "order-1" })).toBe("duplicate");
    const issued = await getBlessing(draft.id);
    expect(issued?.status).toBe("issued");
    expect(issued?.lemonOrderId).toBe("order-1");
  });

  it("publishes wall names after moderation and holds blocked ones", async () => {
    expect(
      await publishWallName({
        blessingId: "b1",
        lemonOrderId: "wall-1",
        displayName: "Red Settler",
        sol: 3,
      }),
    ).toBe("published");
    expect(
      await publishWallName({
        blessingId: "b2",
        lemonOrderId: "wall-2",
        displayName: "admin",
        sol: 3,
      }),
    ).toBe("held");
    expect(
      await publishWallName({
        blessingId: "b1",
        lemonOrderId: "wall-1",
        displayName: "Red Settler",
        sol: 3,
      }),
    ).toBe("duplicate");
  });

  it("publishes monument names with duplicate protection", async () => {
    expect(
      await publishMonumentName({
        blessingId: "m1",
        lemonOrderId: "mon-1",
        displayName: "Founder Settler",
        sol: 9,
      }),
    ).toBe("published");
    expect(
      await publishMonumentName({
        blessingId: "m1",
        lemonOrderId: "mon-1",
        displayName: "Founder Settler",
        sol: 9,
      }),
    ).toBe("duplicate");
  });
});
