import { describe, expect, it } from "vitest";

import {
  ARCHIVE_WEEK_MS,
  archiveExpiry,
  archiveTranslation,
  numberedArchive,
  retainArchive,
  type KeptTransmission,
} from "./transmissionArchive";

function row(expiresAt: number | null, extras: Partial<KeptTransmission> = {}): KeptTransmission {
  return {
    id: "soul",
    savedAt: 0,
    expiresAt,
    soulId: "SOUL-TEST-01",
    day: 1,
    reflection: "the kettle",
    reading: {
      algo_status: "UNDER CONSIDERATION",
      algo_counsel: "THE DISTANCE IS ON THE RECORD.",
      pandit_reply: "acha, the kettle remains.",
      verdict_card: "UNDER CONSIDERATION",
    },
    opening: "beta, sit with this one.",
    forecast: "the week stays ordinary.",
    ...extras,
  };
}

describe("transmission archive", () => {
  const now = Date.parse("2026-10-13T08:00:00.000Z");

  it("keeps a settler forever and a pilgrim for seven days", () => {
    expect(archiveExpiry("pilgrim", now)).toBe(now + ARCHIVE_WEEK_MS);
    expect(archiveExpiry("believer", now)).toBeNull();
    expect(archiveExpiry("devotee", now)).toBeNull();
  });

  it("drops a free transmission once the week has passed", () => {
    const free = row(now + ARCHIVE_WEEK_MS);
    expect(retainArchive([free], now + 1000)).toEqual([free]);
    expect(retainArchive([free], now + ARCHIVE_WEEK_MS)).toEqual([]);
    expect(retainArchive([row(null)], now + ARCHIVE_WEEK_MS * 8)).toHaveLength(1);
  });

  it("lists newest first and numbers from the oldest transmission", () => {
    const listed = numberedArchive([
      row(null, { id: "a", savedAt: now, reflection: "first" }),
      row(null, { id: "b", savedAt: now + 1000, reflection: "second" }),
      row(null, { id: "c", savedAt: now + 2000, reflection: "third" }),
    ]);
    expect(listed.map((item) => item.reflection)).toEqual(["third", "second", "first"]);
    expect(listed.map((item) => item.number)).toEqual([3, 2, 1]);
  });

  it("falls back to the reading reply when translation was never stored", () => {
    expect(archiveTranslation(row(null))).toBe("acha, the kettle remains.");
    expect(archiveTranslation(row(null, { translation: "beta, that one stays." }))).toBe("beta, that one stays.");
  });
});
