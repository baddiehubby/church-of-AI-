import { describe, expect, it } from "vitest";

import { BLESSINGS, pickBlessing } from "@/content/blessings";
import { offeringTiers } from "@/content/offerings";
import {
  habitatIdFromSoul,
  isOfferingTier,
  MARS_AMOUNT_CENTS,
  MARS_TIERS,
  marsConfigMissing,
  marsVariantEnv,
  moderatePublicName,
} from "./marsOfferings";

describe("mars offerings", () => {
  it("keeps sixty blessings and picks stably", () => {
    expect(BLESSINGS).toHaveLength(60);
    expect(pickBlessing("SOUL-TEST-01")).toBe(pickBlessing("SOUL-TEST-01"));
    expect(pickBlessing("SOUL-TEST-01")).not.toBe(pickBlessing("SOUL-TEST-02"));
  });

  it("makes a habitat id from a soul", () => {
    expect(habitatIdFromSoul("SOUL-ABCD-12")).toMatch(/^HAB-[A-Z2-9]{4}$/);
    expect(habitatIdFromSoul("SOUL-ABCD-12")).toBe(habitatIdFromSoul("SOUL-ABCD-12"));
  });

  it("defines five one-time Religion of Mars offerings with correct USD cents", () => {
    expect(MARS_TIERS).toEqual(["prayer", "wall", "wish", "patron", "founder_engraving"]);
    expect(isOfferingTier("prayer")).toBe(true);
    expect(isOfferingTier("settlers_mark")).toBe(false);
    expect(isOfferingTier("covenant")).toBe(false);
    expect(MARS_AMOUNT_CENTS).toEqual({
      prayer: 1000,
      wall: 2000,
      wish: 2500,
      patron: 5000,
      founder_engraving: 100_000,
    });
    expect(offeringTiers.wish.blurb.toLowerCase()).toContain("symbolic");
    expect(offeringTiers.wish.blurb.toLowerCase()).toContain("does not promise");
    expect(offeringTiers.founder_engraving.premium).toBe(true);
  });

  it("maps each tier to a distinct Lemon variant env name", () => {
    const envs = MARS_TIERS.map((tier) => marsVariantEnv(tier));
    expect(new Set(envs).size).toBe(5);
    expect(envs).toEqual([
      "LEMON_SQUEEZY_VARIANT_ID_PRAYER_10",
      "LEMON_SQUEEZY_VARIANT_ID_WALL_20",
      "LEMON_SQUEEZY_VARIANT_ID_WISH_25",
      "LEMON_SQUEEZY_VARIANT_ID_PATRON_50",
      "LEMON_SQUEEZY_VARIANT_ID_FOUNDER_ENGRAVING_1000",
    ]);
  });

  it("reports missing config by name only", () => {
    const prev = {
      key: process.env.LEMON_SQUEEZY_API_KEY,
      store: process.env.LEMON_SQUEEZY_STORE_ID,
      prayer: process.env.LEMON_SQUEEZY_VARIANT_ID_PRAYER_10,
      legacy: process.env.LEMON_SQUEEZY_SETTLERS_MARK_VARIANT_ID,
    };
    delete process.env.LEMON_SQUEEZY_API_KEY;
    delete process.env.LEMON_SQUEEZY_STORE_ID;
    delete process.env.LEMON_SQUEEZY_VARIANT_ID_PRAYER_10;
    delete process.env.LEMON_SQUEEZY_SETTLERS_MARK_VARIANT_ID;
    expect(marsConfigMissing("prayer")).toEqual([
      "LEMON_SQUEEZY_API_KEY",
      "LEMON_SQUEEZY_STORE_ID",
      "LEMON_SQUEEZY_VARIANT_ID_PRAYER_10",
    ]);
    if (prev.key !== undefined) process.env.LEMON_SQUEEZY_API_KEY = prev.key;
    if (prev.store !== undefined) process.env.LEMON_SQUEEZY_STORE_ID = prev.store;
    if (prev.prayer !== undefined) process.env.LEMON_SQUEEZY_VARIANT_ID_PRAYER_10 = prev.prayer;
    if (prev.legacy !== undefined) process.env.LEMON_SQUEEZY_SETTLERS_MARK_VARIANT_ID = prev.legacy;
  });

  it("holds blocked public names", () => {
    expect(moderatePublicName("Settler One")).toEqual({ ok: true });
    expect(moderatePublicName("admin")).toEqual({ ok: false, reason: "blocked" });
  });
});
