import { describe, expect, it } from "vitest";

import { composeDarshan, composeReport, composeSermon, openLetter } from "./sermonCompose";
import { algoVoiceOk, panditVoiceOk, voicesDisagree } from "./voice";

describe("sermons", () => {
  it("names a pattern without agreeing with the machine", () => {
    const sermon = composeSermon({
      soulId: "SOUL-ABCD-EF",
      name: "Meera",
      tier: "devotee",
      weekOf: "2026-10-12",
      poojas: [
        { mood: "tired", reflection: "The week felt long!" },
        { mood: "tired", reflection: "still tired" },
      ],
      wishes: [{ category: "Work", wish: "a quieter desk" }],
    });
    expect(sermon.title).toBe("THE WEEK OF THE DIM LAMP");
    expect(sermon.body.startsWith("beta, meera,")).toBe(true);
    expect(sermon.body).toContain("tired");
    expect(sermon.body).toContain("work");
    expect(sermon.body).not.toContain("!");
    expect(sermon.body).toBe(sermon.body.toLowerCase());
    expect(voicesDisagree(sermon.algoLine, sermon.panditReply)).toBe(true);
    expect(panditVoiceOk(sermon.panditSignoff)).toBe(true);
  });

  it("keeps the open letter and the monthly report in voice", () => {
    const letter = openLetter("October 2026");
    expect(letter.body).toBe(letter.body.toLowerCase());
    expect(panditVoiceOk(letter.signoff)).toBe(true);
    const report = composeReport({ name: "Meera", monthName: "October 2026", poojas: [{ mood: "quiet", reflection: "sat" }], wishes: [] });
    expect(algoVoiceOk(report.algoLine)).toBe(true);
    expect(voicesDisagree(report.algoLine, report.panditReply)).toBe(true);
  });

  it("reads the month back in the screening room", () => {
    const sitting = composeDarshan({ name: null, monthName: "October 2026", poojas: [], wishes: [] });
    const algo = sitting.beats.filter((beat) => beat.speaker === "algo");
    const pandit = sitting.beats.filter((beat) => beat.speaker === "pandit");
    expect(algo.length).toBeGreaterThan(0);
    expect(pandit.length).toBeGreaterThan(0);
    for (const beat of algo) expect(algoVoiceOk(beat.text)).toBe(true);
    for (const beat of pandit) expect(panditVoiceOk(beat.text)).toBe(true);
  });
});
