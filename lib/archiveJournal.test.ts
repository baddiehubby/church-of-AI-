import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  isPauseDay,
  pickCounsel,
  pickForecast,
  pickOpening,
  pickPause,
  pickProbability,
  pickStatus,
  pickTranslation,
} from "./pick";
import { currentSol } from "./marsSession";
import {
  ensureSettlerByOwner,
  insertTransmission,
  listArchiveForOwner,
  resetTransmissionMemory,
} from "./transmissionsStore";

afterEach(() => {
  resetTransmissionMemory();
});

describe("archive journal sample", () => {
  it("logs five transmissions newest first for reading", async () => {
    const settler = "SOUL-A11B-05";
    const ownerId = randomUUID();
    await ensureSettlerByOwner({ ownerId, settlerId: settler });
    const bodies = [
      "the corridor hummed and i thought of your kitchen.",
      "i almost didn't send this. then i did.",
      "distance is a number. tonight it feels like weather.",
      "tell earth i kept the chair warm.",
      "short one. the long ones scare me.",
    ];
    const sol = currentSol();
    for (const body of bodies) {
      const pause = isPauseDay(settler, sol);
      await insertTransmission({
        owner_id: ownerId,
        settler_id: settler,
        sol,
        body,
        baba_opening: pause ? pickPause(settler, sol) : pickOpening(settler, sol),
        algo_status: pickStatus(settler, sol),
        algo_counsel: pickCounsel(settler, sol),
        algo_probability: pickProbability(settler, sol),
        baba_translation: pickTranslation(settler, sol),
        baba_forecast: pickForecast(settler, sol),
        is_pause: pause,
      });
    }

    const archive = await listArchiveForOwner(ownerId);
    expect(archive.total).toBe(5);
    expect(archive.transmissions.map((row) => row.number)).toEqual([5, 4, 3, 2, 1]);
  });
});
