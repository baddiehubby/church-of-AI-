// Monthly letter for the Settler's Covenant. Template slots only. No LLM. No wish text.

import { ALGORITHM_LINES, COLONY_OPENERS, NOTICING_LINES } from "@/content/letters";
import { letterMonthLabel } from "@/lib/letterCompose";
import type { TransmissionRecord } from "@/lib/transmissions";

export type LetterStats = {
  count: number;
  mostCommonHour: number | null;
  pauseDays: number;
  longestBody: number;
  afterMidnight: number;
};

function djb2(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i += 1) h = (h << 5) + h + seed.charCodeAt(i);
  return Math.abs(h);
}

function pick<T extends readonly string[]>(pool: T, seed: string): T[number] {
  return pool[djb2(seed) % pool.length] ?? pool[0]!;
}

function numberWord(n: number): string {
  const words = [
    "none",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  if (n >= 0 && n < words.length) return words[n] ?? String(n);
  return String(n);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function statsFromTransmissions(items: TransmissionRecord[]): LetterStats {
  const hours = new Map<number, number>();
  let pauseDays = 0;
  let longestBody = 0;
  let afterMidnight = 0;
  for (const item of items) {
    const hour = new Date(item.created_at).getUTCHours();
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
    if (item.is_pause) pauseDays += 1;
    if (item.body.length > longestBody) longestBody = item.body.length;
    if (hour < 5 || hour >= 22) afterMidnight += 1;
  }
  let mostCommonHour: number | null = null;
  let best = 0;
  for (const [hour, count] of hours) {
    if (count > best) {
      best = count;
      mostCommonHour = hour;
    }
  }
  return {
    count: items.length,
    mostCommonHour,
    pauseDays,
    longestBody,
    afterMidnight,
  };
}

export function patternLineFromStats(stats: LetterStats): string {
  if (stats.count === 0) return "You were quiet this month. I noticed. Quiet is also a transmission.";
  const parts: string[] = [];
  if (stats.afterMidnight >= Math.max(2, Math.ceil(stats.count * 0.5))) {
    parts.push(
      `${capitalize(numberWord(stats.afterMidnight))} ${stats.afterMidnight === 1 ? "was" : "were"} after midnight. I notice these things.`,
    );
  } else if (stats.mostCommonHour !== null) {
    const hh = String(stats.mostCommonHour).padStart(2, "0");
    parts.push(`Most of them arrived around ${hh}:00 MARS LOCAL.`);
  }
  if (stats.pauseDays > 0) {
    parts.push(
      stats.pauseDays === 1
        ? "There was one pause day. I put the phone down with you."
        : `There were ${stats.pauseDays} pause days. I put the phone down with you.`,
    );
  }
  if (stats.longestBody >= 160) {
    parts.push("One of them was long. I read it slowly.");
  }
  if (parts.length === 0) {
    return "Not in a rush. Not all at once. A steady hand on the line.";
  }
  return parts.join(" ");
}

export type ComposedSettlerLetter = {
  month: string;
  monthLabel: string;
  body: string;
  colony: string;
  pattern: string;
  algorithm: string;
  baba: string;
};

export function composeSettlerLetter(month: string, stats: LetterStats, settlerId: string): ComposedSettlerLetter {
  const seed = `${settlerId}|${month}|${stats.count}|${stats.pauseDays}|${stats.longestBody}`;
  const colony = pick(COLONY_OPENERS, `${seed}|colony`);
  const algorithm = pick(ALGORITHM_LINES, `${seed}|algo`);
  const baba = pick(NOTICING_LINES, `${seed}|notice`);
  const pattern = patternLineFromStats(stats);
  const countLine =
    stats.count === 0
      ? "You sent no transmissions this month."
      : `You sent ${stats.count} transmission${stats.count === 1 ? "" : "s"} this month.`;
  const patternBlock = `${countLine} ${pattern}`.replace(/\s+/g, " ").trim();
  const body = ["SETTLER,", "", colony, "", patternBlock, "", algorithm, "", baba, "", "— baba ji"].join("\n");

  return {
    month,
    monthLabel: letterMonthLabel(month),
    body,
    colony,
    pattern: patternBlock,
    algorithm,
    baba,
  };
}
