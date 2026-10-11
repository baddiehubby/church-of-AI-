import { describe, expect, it } from "vitest";

import { dayOfYear, parseSceneFrame, sceneShareUrl, sceneSoulId, type AltarSceneFrame } from "./sceneFrame";

const frame: AltarSceneFrame = {
  soulId: "SOUL-ABCD-EF",
  day: 285,
  reading: {
    algo_status: "UNDER CONSIDERATION",
    algo_counsel: "THE DAY IS LOUD. THE DESK WITHHOLDS AN OUTCOME.",
    pandit_reply: "beta, the lamp heard you.",
    verdict_card: "THE DAY STAYS OPEN",
  },
};

describe("scene frame", () => {
  it("counts 12 October as day 285", () => {
    expect(dayOfYear(new Date(2026, 9, 12))).toBe(285);
  });

  it("mints a petition-shaped soul id", () => {
    for (let i = 0; i < 20; i += 1) expect(sceneSoulId()).toMatch(/^SOUL-[A-Z2-9]{4}-[A-Z2-9]{2}$/);
  });

  it("round-trips a share url", () => {
    const url = new URL(sceneShareUrl(frame, "http://localhost:3000"));
    expect(url.pathname).toBe("/scene");
    expect(parseSceneFrame(url.searchParams)?.reading.pandit_reply).toBe("beta, the lamp heard you.");
    expect(parseSceneFrame(url.searchParams)?.reading.algo_status).toBe("UNDER CONSIDERATION");
  });

  it("refuses a broken frame", () => {
    expect(parseSceneFrame({ soul: "nope", day: "285", status: "UNDER CONSIDERATION", pandit: "beta.", counsel: "THE DAY." })).toBeNull();
    expect(parseSceneFrame({ soul: "SOUL-ABCD-EF", day: "0", status: "UNDER CONSIDERATION", pandit: "beta.", counsel: "THE DAY." })).toBeNull();
    expect(parseSceneFrame({ soul: "SOUL-ABCD-EF", day: "285", status: "GRANTED", pandit: "beta.", counsel: "THE DAY." })).toBeNull();
  });
});
