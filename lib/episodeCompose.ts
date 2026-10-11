// A Sunday episode is composed from the sittings already on file. No model call. No outcome is promised.
// Pandit ji stays lowercase. The Algorithm stays in caps, without contractions or a first person.

import { ALTAR_STATUSES, type AltarStatus } from "@/content/altarScene";
import { isCrisisText } from "@/lib/poojaLine";
import { addDays, isYmd, localParts, localYmd, weekdayOfYmd, type LocalParts } from "@/lib/time";
import { algoVoiceOk, panditVoiceOk, voicesDisagree } from "@/lib/voice";

export const WITHHELD_LINE = "a hard day, withheld.";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const COUNT = ["zero", "one", "two", "three", "four", "five", "six", "seven"] as const;

const SIGNOFFS = [
  "acha, the file can close, and the lamp stays, beta.",
  "beta, that is the whole of it, so come back when you can.",
  "the machine totaled the days, and i am glad you sat among them.",
] as const;

const EMPTY_SIGNOFF = "beta, an empty week is not a scolding, and the chair will be there.";

const PRACTICES = [
  "one line a day, before you explain the day to anyone.",
  "sit once this week, even if the sentence is dull.",
  "leave the phone in the other room for the length of a bell.",
  "write the line on paper, then come and file it.",
] as const;

const TOPICS = [
  "the line you left unfinished",
  "the chair you almost skipped",
  "what monday started",
  "the quiet you did not file",
  "the hour after the bell",
] as const;

const EMPTY_OPEN =
  "beta, the week came to the altar and the chair stayed empty. the machine still counted the days, and i only wanted you to sit.";

const EMPTY_VERDICT =
  "THE WEEK IS CLOSED. NO SITTING WAS FILED; SEVEN CHAIRS STAYED EMPTY. AN ABSENCE IS ON THE RECORD; NO OUTCOME IS ISSUED.";

export type AltarSitting = {
  date: string;
  reflection: string;
  pandit: string;
  status: string;
};

export type EpisodeScene = {
  index: number;
  weekday: string;
  quote: string | null;
  withheld: boolean;
  pandit: string | null;
};

export type Episode = {
  week: string;
  title: string;
  coldOpen: string;
  scenes: EpisodeScene[];
  verdict: string;
  signoff: string;
  cliffhanger: string;
  practice: string;
  sat: number;
};

export function isSunday(value: string): boolean {
  return isYmd(value) && weekdayOfYmd(value) === 0;
}

export function weekEndingSunday(ymd: string): string | null {
  if (!isYmd(ymd)) return null;
  const weekday = weekdayOfYmd(ymd);
  return addDays(ymd, weekday === 0 ? 0 : 7 - weekday);
}

export function weekDates(sunday: string): string[] {
  if (!isSunday(sunday)) return [];
  return Array.from({ length: 7 }, (_, index) => addDays(sunday, index - 6));
}

export function episodeReleased(week: string, today: string, hour: number): boolean {
  if (!isSunday(week) || !isYmd(today)) return false;
  if (week < today) return true;
  if (week > today) return false;
  return hour >= 20;
}

export function episodeIsDue(parts: LocalParts): boolean {
  return parts.weekday === 0 && parts.hour === 20;
}

export function altarEpisodeLink(
  today: string,
  hour: number,
  dates: string[],
): { week: string; kind: "current" | "last" | "waiting" } | null {
  const current = weekEndingSunday(today);
  if (!current) return null;
  const previous = addDays(current, -7);
  const inWeek = (sunday: string) => {
    const start = addDays(sunday, -6);
    return dates.some((date) => isYmd(date) && date >= start && date <= sunday);
  };
  if (episodeReleased(current, today, hour) && inWeek(current)) return { week: current, kind: "current" };
  if (inWeek(previous) && isSunday(previous)) return { week: previous, kind: "last" };
  if (inWeek(current)) return { week: current, kind: "waiting" };
  return null;
}

export function publicReflection(value: string): string {
  const trimmed = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  if (!trimmed) return "";
  if (isCrisisText(trimmed)) return WITHHELD_LINE;
  return trimmed;
}

export function isEpisodeMail(value: string): boolean {
  return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function episodeShouldSend(
  input: { timezone: string; email: string | null; deliveredWeek: string | null; sat: number },
  now: Date,
): string | null {
  if (!input.email || !isEpisodeMail(input.email) || input.sat < 1) return null;
  const parts = localParts(now, input.timezone);
  if (!episodeIsDue(parts)) return null;
  const week = localYmd(now, input.timezone);
  if (!isSunday(week) || input.deliveredWeek === week) return null;
  return week;
}

function hash(seed: string, length: number): number {
  let value = 0;
  for (const char of seed) value = (Math.imul(value, 33) + char.charCodeAt(0)) >>> 0;
  return length === 0 ? 0 : value % length;
}

function soften(value: string): string {
  const cleaned = value
    .replace(/[\r\n]+/g, " ")
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[!?]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= 90) return cleaned;
  const cut = cleaned.slice(0, 90);
  const space = cut.lastIndexOf(" ");
  return (space > 40 ? cut.slice(0, space) : cut).trim();
}

function isStatus(value: string): value is AltarStatus {
  return (ALTAR_STATUSES as readonly string[]).includes(value);
}

function coldOpen(sat: number, sample: string): string {
  if (sat === 0) return EMPTY_OPEN;
  const line = sample || "a line too quiet to keep";
  return `beta, you sat ${COUNT[sat]} of the seven days, and the week kept its own weather. one line that stayed was: ${line}.`;
}

function verdict(sat: number, status: string | null): string {
  if (sat === 0) return EMPTY_VERDICT;
  const empty = 7 - sat;
  const sitting = sat === 1 ? "ONE SITTING IS ON FILE" : `${COUNT[sat].toUpperCase()} SITTINGS ARE ON FILE`;
  const chairs = empty === 1 ? "ONE CHAIR STAYED EMPTY" : `${COUNT[empty].toUpperCase()} CHAIRS STAYED EMPTY`;
  const statusLine = status
    ? `THE STATUS THAT RETURNED MOST WAS ${status}; A STATUS IS NOT AN OUTCOME.`
    : "NO SINGLE STATUS HELD THE WEEK; A PATTERN IS NOT AN OUTCOME.";
  return `THE WEEK IS CLOSED. ${sitting}; ${chairs}. ${statusLine} THE RECORD WITHHOLDS A RESULT.`;
}

function title(sat: number): string {
  if (sat === 0) return "THE WEEK THE CHAIR WAITED";
  if (sat === 1) return "THE WEEK OF ONE BELL";
  return `THE WEEK OF ${COUNT[sat].toUpperCase()} BELLS`;
}

export function composeEpisode(input: { week: string; sittings: AltarSitting[] }): Episode {
  const dates = weekDates(input.week);
  const byDate = new Map<string, AltarSitting>();
  for (const sitting of input.sittings) {
    if (isYmd(sitting.date)) byDate.set(sitting.date, sitting);
  }
  const counts = new Map<string, number>();
  let sat = 0;
  let sample = "";
  const scenes: EpisodeScene[] = dates.map((date, index) => {
    const sitting = byDate.get(date);
    const reflection = sitting ? publicReflection(sitting.reflection) : "";
    const withheld = reflection === WITHHELD_LINE;
    const quote = withheld ? WITHHELD_LINE : reflection ? soften(reflection) : "";
    const kept = Boolean(quote);
    if (kept) {
      sat += 1;
      sample = withheld ? sample : quote;
      if (sitting && isStatus(sitting.status)) counts.set(sitting.status, (counts.get(sitting.status) ?? 0) + 1);
    }
    const pandit = sitting && panditVoiceOk(sitting.pandit) ? sitting.pandit : null;
    return {
      index: index + 1,
      weekday: WEEKDAYS[index] ?? "monday",
      quote: kept ? quote : null,
      withheld,
      pandit: kept ? pandit : null,
    };
  });
  let status: string | null = null;
  let seen = 0;
  for (const [name, count] of counts) {
    if (count > seen) {
      status = name;
      seen = count;
    }
  }
  const signoff = sat === 0 ? EMPTY_SIGNOFF : (SIGNOFFS[hash(input.week, SIGNOFFS.length)] ?? SIGNOFFS[0]);
  const topic = TOPICS[hash(`${input.week}:topic`, TOPICS.length)] ?? TOPICS[0];
  const cliffhanger = `next week, the algorithm will ask you about ${topic}.`;
  const practice = PRACTICES[hash(`${input.week}:practice`, PRACTICES.length)] ?? PRACTICES[0];
  let open = coldOpen(sat, sample);
  if (!panditVoiceOk(open)) open = coldOpen(sat, "");
  if (!panditVoiceOk(open)) open = EMPTY_OPEN;
  const weekly = verdict(sat, status);
  const poster = algoVoiceOk(title(sat)) ? title(sat) : "THE WEEK THE CHAIR WAITED";
  const safeVerdict = algoVoiceOk(weekly) && voicesDisagree(weekly, signoff) && voicesDisagree(weekly, open) ? weekly : EMPTY_VERDICT;
  return {
    week: input.week,
    title: poster,
    coldOpen: open,
    scenes,
    verdict: safeVerdict,
    signoff: panditVoiceOk(signoff) ? signoff : EMPTY_SIGNOFF,
    cliffhanger: panditVoiceOk(cliffhanger) ? cliffhanger : "next week, the algorithm will ask you about the quiet you did not file.",
    practice: panditVoiceOk(practice) ? practice : PRACTICES[0],
    sat,
  };
}

export function episodePlain(episode: Episode): string[] {
  const lines = [episode.title, "", episode.coldOpen, ""];
  for (const scene of episode.scenes) {
    const quote = scene.quote ? (scene.withheld ? scene.quote : `"${scene.quote}"`) : "the chair stayed empty.";
    lines.push(`SCENE ${scene.index} · ${scene.weekday.toUpperCase()}`, quote, "");
  }
  lines.push("THE ALGORITHM'S WEEKLY VERDICT", episode.verdict, "", episode.signoff, "pandit ji", "", episode.cliffhanger, "", "A PRACTICE", episode.practice);
  return lines;
}

export function episodeDateLabel(sunday: string): string {
  if (!isYmd(sunday)) return sunday;
  const [year, month, day] = sunday.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)))
    .toUpperCase();
}
