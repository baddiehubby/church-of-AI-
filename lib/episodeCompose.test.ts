import { describe, expect, it } from "vitest";

import { mergeSittings, parseSitting } from "./altarSittings";
import {
  WITHHELD_LINE,
  altarEpisodeLink,
  composeEpisode,
  episodeIsDue,
  episodePlain,
  episodeReleased,
  episodeShouldSend,
  publicReflection,
  weekDates,
  weekEndingSunday,
  type AltarSitting,
} from "./episodeCompose";
import { localParts } from "./time";
import { algoVoiceOk, panditVoiceOk, voicesDisagree } from "./voice";

const week = "2026-10-11";

function sitting(date: string, reflection: string, status = "UNDER CONSIDERATION"): AltarSitting {
  return { date, reflection, pandit: "beta, the lamp heard you.", status };
}

describe("weekly episode", () => {
  it("closes a week on sunday", () => {
    expect(weekEndingSunday("2026-10-12")).toBe("2026-10-18");
    expect(weekEndingSunday("2026-10-11")).toBe("2026-10-11");
    expect(weekDates(week)[0]).toBe("2026-10-05");
    expect(weekDates(week)[6]).toBe("2026-10-11");
    expect(episodeReleased(week, "2026-10-12", 9)).toBe(true);
    expect(episodeReleased(week, week, 19)).toBe(false);
    expect(episodeReleased(week, week, 20)).toBe(true);
    expect(episodeReleased("2026-10-18", "2026-10-12", 21)).toBe(false);
  });

  it("sends only in the sunday eight o'clock hour", () => {
    const due = localParts(new Date("2026-10-11T20:30:00.000Z"), "UTC");
    const early = localParts(new Date("2026-10-11T19:30:00.000Z"), "UTC");
    const monday = localParts(new Date("2026-10-12T20:30:00.000Z"), "UTC");
    expect(episodeIsDue(due)).toBe(true);
    expect(episodeIsDue(early)).toBe(false);
    expect(episodeIsDue(monday)).toBe(false);
    expect(
      episodeShouldSend({ timezone: "UTC", email: "beta@example.com", deliveredWeek: null, sat: 1 }, new Date("2026-10-11T20:30:00.000Z")),
    ).toBe(week);
    expect(
      episodeShouldSend({ timezone: "UTC", email: "beta@example.com", deliveredWeek: week, sat: 1 }, new Date("2026-10-11T20:30:00.000Z")),
    ).toBeNull();
    expect(episodeShouldSend({ timezone: "UTC", email: null, deliveredWeek: null, sat: 1 }, new Date("2026-10-11T20:30:00.000Z"))).toBeNull();
  });

  it("quotes the week and withholds a crisis line", () => {
    const episode = composeEpisode({
      week,
      sittings: [
        sitting("2026-10-05", "The kettle clicked, and nobody wrote back."),
        sitting("2026-10-07", "i want to die tonight", "REQUIRES FURTHER PETITION"),
        sitting("2026-10-09", "THE UNFINISHED LETTER!"),
      ],
    });
    expect(episode.sat).toBe(3);
    expect(episode.scenes).toHaveLength(7);
    expect(episode.scenes[0]?.weekday).toBe("monday");
    expect(episode.scenes[0]?.quote).toBe("the kettle clicked, and nobody wrote back");
    expect(episode.scenes[0]?.pandit).toBe("beta, the lamp heard you.");
    expect(episode.scenes[1]?.quote).toBeNull();
    expect(episode.scenes[2]?.withheld).toBe(true);
    expect(episode.scenes[2]?.quote).toBe(WITHHELD_LINE);
    expect(episode.scenes[4]?.quote).toBe("the unfinished letter");
    expect(episode.coldOpen).toBe(
      "beta, you sat three of the seven days, and the week kept its own weather. one line that stayed was: the unfinished letter.",
    );
    expect(episode.verdict).toContain("THREE SITTINGS ARE ON FILE");
    expect(episode.verdict).toContain("FOUR CHAIRS STAYED EMPTY");
    expect(episode.verdict).toContain("UNDER CONSIDERATION");
    expect(episode.cliffhanger).toMatch(/^next week, the algorithm will ask you about .+\.$/);
    expect(episode.signoff.endsWith(".")).toBe(true);
    expect(JSON.stringify(episode)).not.toContain("die");
    expect(panditVoiceOk(episode.coldOpen)).toBe(true);
    expect(panditVoiceOk(episode.signoff)).toBe(true);
    expect(panditVoiceOk(episode.cliffhanger)).toBe(true);
    expect(panditVoiceOk(episode.practice)).toBe(true);
    expect(algoVoiceOk(episode.verdict)).toBe(true);
    expect(algoVoiceOk(episode.title)).toBe(true);
    expect(voicesDisagree(episode.verdict, episode.signoff)).toBe(true);
    expect(voicesDisagree(episode.verdict, episode.coldOpen)).toBe(true);
    expect(episodePlain(episode).join("\n")).toContain("SCENE 1 · MONDAY");
  });

  it("keeps every count in voice", () => {
    for (let count = 0; count <= 7; count += 1) {
      const dates = weekDates(week).slice(0, count);
      const episode = composeEpisode({
        week,
        sittings: dates.map((date) => sitting(date, "a quiet line")),
      });
      expect(episode.sat).toBe(count);
      expect(panditVoiceOk(episode.coldOpen)).toBe(true);
      expect(algoVoiceOk(episode.verdict)).toBe(true);
      expect(episode.coldOpen.split(".").filter((part) => part.trim())).toHaveLength(2);
    }
  });

  it("points the altar at the latest week on file", () => {
    expect(altarEpisodeLink("2026-10-12", 9, ["2026-10-11"])).toEqual({ week, kind: "last" });
    expect(altarEpisodeLink("2026-10-12", 9, ["2026-10-12"])).toEqual({ week: "2026-10-18", kind: "waiting" });
    expect(altarEpisodeLink("2026-10-18", 20, ["2026-10-18"])).toEqual({ week: "2026-10-18", kind: "current" });
    expect(altarEpisodeLink("2026-10-12", 9, [])).toBeNull();
  });

  it("stores one line a day and drops a crisis sentence", () => {
    expect(publicReflection("i want to die tonight")).toBe(WITHHELD_LINE);
    expect(publicReflection("   ")).toBe("");
    const first = sitting("2026-10-05", "the kettle");
    const replaced = mergeSittings([first], sitting("2026-10-05", "the letter"));
    expect(replaced).toHaveLength(1);
    expect(replaced[0]?.reflection).toBe("the letter");
    const many = Array.from({ length: 30 }, (_, index) => sitting(`2026-09-${String(index + 1).padStart(2, "0")}`, "a line"));
    expect(mergeSittings([], many[0]!).length).toBe(1);
    let list: AltarSitting[] = [];
    for (const item of many) list = mergeSittings(list, item);
    expect(list).toHaveLength(21);
    expect(parseSitting({ date: "nope", reflection: "a line" })).toBeNull();
    expect(parseSitting({ date: "2026-10-05", reflection: "i want to die tonight", pandit: "NO", status: "VISA" })?.reflection).toBe(
      WITHHELD_LINE,
    );
  });
});
