// Deterministic picks per settler per sol. Same lines all day. New ones tomorrow.
// Seed form: `${settlerId}|${sol}|${category}` — categories never share an index by accident.

import {
  COUNSELS,
  PROBABILITIES,
  STATUSES,
  type AlgorithmCounsel,
  type AlgorithmProbability,
  type AlgorithmStatus,
} from "@/content/algorithm";
import {
  FORECASTS,
  OPENINGS,
  PAUSES,
  TRANSLATIONS,
  type BabaForecast,
  type BabaOpening,
  type BabaPause,
  type BabaTranslation,
} from "@/content/baba-ji";

/** Extra hold on pause days during Beat 2. Does not change other beats. */
export const PAUSE_EXTRA_MS = 400;

export type PickCategory =
  | "opening"
  | "translation"
  | "forecast"
  | "status"
  | "counsel"
  | "probability"
  | "pause"
  | "pause-line";

/** Stable djb2. Same string → same index forever. */
export function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) + h + s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** @deprecated Prefer hash — kept for older imports. */
export const hashString = hash;

function categorySeed(userId: string, sol: number, category: PickCategory): number {
  return hash(`${userId}|${sol}|${category}`);
}

function pickFrom<T>(pool: readonly T[], userId: string, sol: number, category: PickCategory): T {
  const seed = categorySeed(userId, sol, category);
  return pool[seed % pool.length]!;
}

export function pickOpening(userId: string, sol: number): BabaOpening {
  return pickFrom(OPENINGS, userId, sol, "opening");
}

export function pickTranslation(userId: string, sol: number): BabaTranslation {
  return pickFrom(TRANSLATIONS, userId, sol, "translation");
}

export function pickForecast(userId: string, sol: number): BabaForecast {
  return pickFrom(FORECASTS, userId, sol, "forecast");
}

export function pickStatus(userId: string, sol: number): AlgorithmStatus {
  return pickFrom(STATUSES, userId, sol, "status");
}

export function pickCounsel(userId: string, sol: number): AlgorithmCounsel {
  return pickFrom(COUNSELS, userId, sol, "counsel");
}

export function pickProbability(userId: string, sol: number): AlgorithmProbability {
  return pickFrom(PROBABILITIES, userId, sol, "probability");
}

/** About one sol in twenty. Stable for the same settler + sol. */
export function isPauseDay(userId: string, sol: number): boolean {
  return categorySeed(userId, sol, "pause") % 20 === 0;
}

/** Wound line for pause days. May be silence (""). */
export function pickPause(userId: string, sol: number): BabaPause {
  return pickFrom(PAUSES, userId, sol, "pause-line");
}

/** Beat 2 line: pause pool on wound sols, openings otherwise. */
export function pickRitualOpening(userId: string, sol: number): BabaOpening | BabaPause {
  if (isPauseDay(userId, sol)) return pickPause(userId, sol);
  return pickOpening(userId, sol);
}

/** Pool index for tests — proves categories use independent seeds. */
export function pickIndex(userId: string, sol: number, category: PickCategory, poolSize: number): number {
  return categorySeed(userId, sol, category) % poolSize;
}
