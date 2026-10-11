import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALTAR_SYSTEM_PROMPT,
  crisisAltarReading,
  generateAltarReading,
  parseAltarReading,
  readCachedReading,
  resetAltarReadingCache,
  writeCachedReading,
} from "./altarReading";

const VALID = {
    algo_status: "UNDER CONSIDERATION" as const,
  algo_counsel: "THE DAY IS LOUD. THE DESK RECORDS THE NOISE AND WITHHOLDS AN OUTCOME.",
  pandit_reply: "beta, the lamp heard you and still does not know the ending.",
  verdict_card: "THE DAY STAYS OPEN",
};

describe("altar reading", () => {
  afterEach(() => {
    resetAltarReadingCache();
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("keeps the system prompt exact", () => {
    expect(ALTAR_SYSTEM_PROMPT).toBe(
      "You are two characters responding to a human's daily reflection. THE ALGORITHM\nspeaks in ALL CAPS, no contractions, formal, patient, ominous. PANDIT JI speaks\nin lowercase, warm, tired, deadpan, uses 'beta' sparingly. They never merge.\nThey never agree. Output strict JSON. No preamble.",
    );
  });

  it("accepts a reading in both voices", () => {
    expect(parseAltarReading(VALID)).toEqual(VALID);
    expect(parseAltarReading({ ...VALID, algo_status: "PROVISIONALLY ACCEPTED" })?.algo_status).toBe("PROVISIONALLY ACCEPTED");
    expect(parseAltarReading({ ...VALID, algo_status: "REQUIRES FURTHER PETITION" })?.algo_status).toBe("REQUIRES FURTHER PETITION");
  });

  it("rejects a voice that slips", () => {
    expect(parseAltarReading({ ...VALID, algo_status: "GRANTED" })).toBeNull();
    expect(parseAltarReading({ ...VALID, algo_counsel: "THE DAY IS LOUD." })).toBeNull();
    expect(parseAltarReading({ ...VALID, algo_counsel: "the day is loud. the desk is quiet." })).toBeNull();
    expect(parseAltarReading({ ...VALID, algo_counsel: "THE DAY IS LOUD! THE DESK IS QUIET." })).toBeNull();
    expect(parseAltarReading({ ...VALID, algo_counsel: "IT'S LOUD. THE DESK IS QUIET." })).toBeNull();
    expect(parseAltarReading({ ...VALID, pandit_reply: "Beta, sit down." })).toBeNull();
    expect(parseAltarReading({ ...VALID, pandit_reply: "beta, sit down. the day can wait." })).toBeNull();
    expect(parseAltarReading({ ...VALID, pandit_reply: "beta, sit down?" })).toBeNull();
    expect(
      parseAltarReading({
        ...VALID,
        pandit_reply: "the day is loud. the desk records the noise and withholds an outcome.",
      }),
    ).toBeNull();
    expect(parseAltarReading({ ...VALID, verdict_card: "the day stays open" })).toBeNull();
    expect(parseAltarReading({ ...VALID, algo_counsel: "THE WISH WILL COME TRUE. THE DESK HAS SPOKEN." })).toBeNull();
  });

  it("answers a crisis without the model", () => {
    const crisis = crisisAltarReading();
    expect(crisis.pandit_reply).toContain("988");
    expect(crisis.algo_counsel).toContain("CRISIS SERVICE");
    expect(crisis.algo_status).toBe("UNDER CONSIDERATION");
  });

  it("forgets a cached reading after a day", () => {
    const now = Date.parse("2026-10-11T00:00:00Z");
    writeCachedReading("the kettle is loud", VALID, now);
    expect(readCachedReading("the kettle is loud", now + 23 * 60 * 60 * 1000)?.verdict_card).toBe("THE DAY STAYS OPEN");
    expect(readCachedReading("the kettle is loud", now + 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("caches a model reading and does not call again", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(VALID) } }] }),
      init,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await generateAltarReading("the train was late again");
    const second = await generateAltarReading("the train was late again");
    expect(first).toEqual(VALID);
    expect(second).toEqual(VALID);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.temperature).toBe(0.9);
  });
});
