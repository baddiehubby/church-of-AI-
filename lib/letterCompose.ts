// Monthly letter for settlers. Patterns only — never the wish text.
// Same month + same counts = same letter. Shareable without a name.

import {
  ALGORITHM_ASIDES,
  COLONY_LINES,
  letterCopy,
  PATTERN_TEMPLATES,
  PERSONAL_LINES,
  QUIET_PATTERN,
} from "@/content/letter";
import type { KeptTransmission } from "@/lib/transmissionArchive";

export type LetterPatterns = {
  total: number;
  afterMidnight: number;
  morning: number;
};

export type MonthlyLetter = {
  month: string;
  monthLabel: string;
  salutation: string;
  colony: string;
  pattern: string;
  algorithm: string;
  personal: string;
  /** Redacted on the share page — patrons only, never a real name here. */
  patronNote: string | null;
  signoff: string;
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isLetterMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

export function letterMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function previousLetterMonth(from: Date = new Date()): string {
  const year = from.getFullYear();
  const month = from.getMonth(); // 0-indexed; previous calendar month
  const prior = new Date(year, month - 1, 1);
  return letterMonthKey(prior);
}

export function letterMonthLabel(month: string): string {
  if (!isLetterMonth(month)) return month;
  const [year, mon] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, mon - 1, 1)),
  );
}

/** Month has closed when we are past its last day. */
export function letterMonthClosed(month: string, now: Date = new Date()): boolean {
  if (!isLetterMonth(month)) return false;
  return letterMonthKey(now) > month;
}

function hash(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T extends readonly string[]>(pool: T, seed: string): T[number] {
  return pool[hash(seed) % pool.length] ?? pool[0]!;
}

export function patternsFromTransmissions(
  items: KeptTransmission[],
  month: string,
): LetterPatterns {
  const inMonth = items.filter((item) => letterMonthKey(new Date(item.savedAt)) === month);
  let afterMidnight = 0;
  let morning = 0;
  for (const item of inMonth) {
    const hour = new Date(item.savedAt).getHours();
    if (hour < 5) afterMidnight += 1;
    else if (hour < 12) morning += 1;
  }
  return { total: inMonth.length, afterMidnight, morning };
}

export function encodeLetterQuery(patterns: LetterPatterns): string {
  const params = new URLSearchParams();
  params.set("n", String(patterns.total));
  params.set("a", String(patterns.afterMidnight));
  params.set("m", String(patterns.morning));
  return params.toString();
}

export function decodeLetterQuery(search: string | URLSearchParams): LetterPatterns | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const total = Number(params.get("n"));
  const afterMidnight = Number(params.get("a"));
  const morning = Number(params.get("m"));
  if (![total, afterMidnight, morning].every((n) => Number.isFinite(n) && n >= 0 && n <= 200)) {
    return null;
  }
  if (afterMidnight + morning > total) return null;
  return {
    total: Math.floor(total),
    afterMidnight: Math.floor(afterMidnight),
    morning: Math.floor(morning),
  };
}

function patternLine(patterns: LetterPatterns): string {
  const { total, afterMidnight, morning } = patterns;
  if (total === 0) return QUIET_PATTERN;
  if (afterMidnight >= Math.max(2, Math.ceil(total * 0.5))) {
    return PATTERN_TEMPLATES.midnightHeavy(total, afterMidnight);
  }
  if (morning >= Math.max(2, Math.ceil(total * 0.5))) {
    return PATTERN_TEMPLATES.morningHeavy(total, morning);
  }
  if (total === 1 || total === 2) return PATTERN_TEMPLATES.sparse(total);
  if (total >= 20) return PATTERN_TEMPLATES.dense(total);
  return PATTERN_TEMPLATES.steady(total);
}

export function composeMonthlyLetter(
  month: string,
  patterns: LetterPatterns,
  options: { patron?: boolean } = {},
): MonthlyLetter {
  const key = isLetterMonth(month) ? month : "0000-00";
  const seed = `${key}:${patterns.total}:${patterns.afterMidnight}:${patterns.morning}`;
  return {
    month: key,
    monthLabel: letterMonthLabel(key),
    salutation: letterCopy.salutation,
    colony: pick(COLONY_LINES, `${seed}:colony`),
    pattern: patternLine(patterns),
    algorithm: pick(ALGORITHM_ASIDES, `${seed}:algo`),
    personal: pick(PERSONAL_LINES, `${seed}:you`),
    patronNote: options.patron
      ? "One of the twelve sat with us this year. I won't name them. You know if it was you."
      : null,
    signoff: letterCopy.signoff,
  };
}

export function letterSharePath(month: string, patterns: LetterPatterns): string {
  const query = encodeLetterQuery(patterns);
  return `/letter/${month}?${query}`;
}
