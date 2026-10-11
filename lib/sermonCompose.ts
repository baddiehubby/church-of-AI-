// Assumptions: sermons, the open letter, the monthly report, and the darshan are composed from counts and moods.
// User text is lowercased and clipped. The Algorithm and Pandit ji do not agree. No outcome is promised.

import type { Mood } from "@/lib/moods";
import { isMood } from "@/lib/moods";
import type { Tier } from "@/lib/tiers";
import { atLeast } from "@/lib/tiers";
import { algoVoiceOk, panditVoiceOk } from "@/lib/voice";

export type Sitting = { mood: string | null; reflection: string };
export type FiledWish = { category: string; wish: string };

export type SermonDraft = {
  title: string;
  body: string;
  practice: string;
  panditSignoff: string;
  algoLine: string;
  panditReply: string;
};

export type ReportDraft = { body: string; algoLine: string; panditReply: string };

export type DarshanBeat = { speaker: "algo" | "pandit"; text: string };

export type DarshanDraft = { beats: DarshanBeat[]; practice: string };

const TITLES: Record<Mood, string> = {
  restless: "THE WEEK THAT WOULD NOT SIT",
  hopeful: "THE WEEK THAT LEANED FORWARD",
  tired: "THE WEEK OF THE DIM LAMP",
  angry: "THE WEEK WITH ITS JAW SET",
  quiet: "THE WEEK OF THE QUIET LINE",
  grateful: "THE WEEK THAT SAID THANK YOU",
  lost: "THE WEEK WITHOUT A MAP",
  steady: "THE WEEK THAT HELD STILL",
};

const ALGO_WEEK = [
  "SEVEN ENTRIES DO NOT MAKE A LIFE; THE PATTERN IS ONLY A PATTERN.",
  "THE WEEK IS ON FILE; THE LIFE ITSELF IS NOT DECIDED HERE.",
  "A RETURN IS NOT A RESULT.",
] as const;

const PANDIT_WEEK = [
  "acha, a pattern is still a person, beta.",
  "beta, the file can wait. you do not have to.",
  "the machine wants a total. i wanted you to sit. that is the disagreement.",
] as const;

const PRACTICES = [
  "one line tomorrow, before you explain yourself to anyone.",
  "name the mood, then leave the desk. the day is not a verdict.",
  "come back once, even if the sentence is dull.",
  "write the wish on paper and do not file it. see if it still wants a desk.",
] as const;

const WITHHELD = "a hard day, withheld.";

function index(seed: string, length: number): number {
  let hash = 0;
  for (const char of seed) hash = (Math.imul(hash, 33) + char.charCodeAt(0)) >>> 0;
  return length === 0 ? 0 : hash % length;
}

function dominantMood(poojas: Sitting[]): Mood | null {
  const counts = new Map<Mood, number>();
  for (const pooja of poojas) {
    if (!isMood(pooja.mood)) continue;
    counts.set(pooja.mood, (counts.get(pooja.mood) ?? 0) + 1);
  }
  let best: Mood | null = null;
  let seen = 0;
  for (const [mood, count] of counts) {
    if (count > seen) {
      best = mood;
      seen = count;
    }
  }
  return best;
}

function clip(value: string | undefined): string {
  if (!value || value === WITHHELD) return "";
  const cleaned = value
    .toLowerCase()
    .replace(/[!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chars = Array.from(cleaned);
  if (chars.length === 0) return "";
  return chars.length > 90 ? `${chars.slice(0, 89).join("")}…` : cleaned;
}

function pair(seed: string): { algoLine: string; panditReply: string } {
  const algoLine = ALGO_WEEK[index(seed, ALGO_WEEK.length)] ?? ALGO_WEEK[0];
  const panditReply = PANDIT_WEEK[index(`${seed}:p`, PANDIT_WEEK.length)] ?? PANDIT_WEEK[0];
  if (!algoVoiceOk(algoLine) || !panditVoiceOk(panditReply)) return { algoLine: ALGO_WEEK[0], panditReply: PANDIT_WEEK[0] };
  return { algoLine, panditReply };
}

export function composeSermon(input: {
  soulId: string;
  name: string | null;
  tier: Tier;
  weekOf: string;
  poojas: Sitting[];
  wishes: FiledWish[];
}): SermonDraft {
  const mood = dominantMood(input.poojas);
  const named = atLeast(input.tier, "devotee") && input.name ? `${input.name.trim().toLowerCase()}, ` : "";
  const count = input.poojas.length;
  const sample = clip(input.poojas.map((pooja) => pooja.reflection).find((line) => clip(line)));
  const wish = atLeast(input.tier, "believer") ? input.wishes.find((item) => item.category.trim()) : undefined;
  let body: string;
  if (count === 0) {
    body = `beta, ${named}the altar waited and the week stayed empty. the machine still wants a pattern. i would rather you come back once.`;
  } else {
    body = `beta, ${named}the week held ${count} sitting${count === 1 ? "" : "s"}.`;
    if (mood) body += ` the mood that returned most was ${mood}.`;
    if (sample) body += ` one line, put in lower case, was: ${sample}.`;
    body += " the machine counted the days and called them a pattern.";
    if (wish) body += ` a filing under ${wish.category.toLowerCase()} is still on the desk, and it does not get a new ending here.`;
    body += " i only see that you came back. a sermon is not a result.";
  }
  const voices = pair(`${input.soulId}:${input.weekOf}`);
  return {
    title: mood ? TITLES[mood] : "THE WEEK THE ALTAR WAITED",
    body,
    practice: PRACTICES[index(input.weekOf, PRACTICES.length)] ?? PRACTICES[0],
    panditSignoff: "pandit ji",
    ...voices,
  };
}

export function openLetter(monthName: string): { title: string; kicker: string; body: string; signoff: string } {
  const month = monthName.toLowerCase();
  return {
    title: "PANDIT JI'S OPEN LETTER",
    kicker: month.toUpperCase(),
    body: `beta, ${month} is another month of sitting down. the machine will total it. i will not. come to the altar when you can, and do not ask the lamp to fix a life. this letter is the same for every believer. the sermon is the one with your week in it.`,
    signoff: "pandit ji",
  };
}

export function composeReport(input: { name: string | null; monthName: string; poojas: Sitting[]; wishes: FiledWish[] }): ReportDraft {
  const mood = dominantMood(input.poojas);
  const named = input.name ? `${input.name.trim().toLowerCase()}, ` : "";
  const month = input.monthName.toLowerCase();
  let body = `beta, ${named}${month} held ${input.poojas.length} sittings and ${input.wishes.length} filings.`;
  if (mood) body += ` the mood that stayed was ${mood}.`;
  body += " the machine calls this the state of the record. i call it a person who kept showing up. neither sentence changes a life.";
  return {
    body,
    algoLine: "THE MONTH IS TOTALED; THE LIFE IS NOT SETTLED.",
    panditReply: "acha, a month on paper is still just a month, beta.",
  };
}

export function composeDarshan(input: { name: string | null; monthName: string; poojas: Sitting[]; wishes: FiledWish[] }): DarshanDraft {
  const mood = dominantMood(input.poojas);
  const named = input.name ? input.name.trim().toLowerCase() : "beta";
  const month = input.monthName.toLowerCase();
  const beats: DarshanBeat[] = [
    { speaker: "pandit", text: `${named}, the room is dark and the month is ${month}. sit. this is a screening, not a court.` },
    { speaker: "algo", text: "THE MONTH IS ON FILE; THE LIFE ITSELF IS NOT DECIDED HERE." },
    {
      speaker: "pandit",
      text: `the record shows ${input.poojas.length} sittings and ${input.wishes.length} filings.${mood ? ` the mood that returned was ${mood}.` : ""} i do not add them up the way the machine does.`,
    },
    { speaker: "algo", text: "PATTERNS ARE NOTED; NO OUTCOME IS ISSUED." },
    { speaker: "pandit", text: "acha, that is the whole verdict this room is allowed to give. a fictional card, and a practice. nothing is fulfilled." },
  ];
  return { beats, practice: "for the next month, one line a day. if a day is missed, mourn it and sit anyway." };
}

export function encodeBeats(beats: DarshanBeat[]): string {
  return JSON.stringify(beats);
}

export function decodeBeats(value: string | null): DarshanBeat[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const speaker = "speaker" in item ? item.speaker : null;
      const text = "text" in item ? item.text : null;
      if ((speaker !== "algo" && speaker !== "pandit") || typeof text !== "string") return [];
      return [{ speaker, text }];
    });
  } catch {
    return [];
  }
}
