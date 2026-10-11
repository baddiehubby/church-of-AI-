// The streak lives in the browser until a register exists. Dates are the local calendar day.
// A second sitting on the same day does not raise the count. A missed day breaks it.

import { ALTAR_STATUSES, type AltarReading, type AltarStatus } from "@/content/altarScene";
import type { AltarSceneFrame } from "@/lib/sceneFrame";

const KEY = "sp-altar-streak";

export type KeptScene = { date: string; frame: AltarSceneFrame };

export type StreakRecord = {
  lastDate: string | null;
  streak: number;
  today: KeptScene | null;
  yesterday: KeptScene | null;
};

export type StreakView = { kind: "intact"; day: number } | { kind: "risk"; day: number } | { kind: "broken" };

export function emptyStreak(): StreakRecord {
  return { lastDate: null, streak: 0, today: null, yesterday: null };
}

export function localISODate(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function shiftDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + days);
  return localISODate(date);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isStatus(value: string): value is AltarStatus {
  return (ALTAR_STATUSES as readonly string[]).includes(value);
}

function isFrame(value: unknown): value is AltarSceneFrame {
  if (!value || typeof value !== "object") return false;
  const frame = value as Partial<AltarSceneFrame>;
  const reading = frame.reading as Partial<AltarReading> | undefined;
  return (
    typeof frame.soulId === "string" &&
    typeof frame.day === "number" &&
    !!reading &&
    typeof reading.algo_status === "string" &&
    isStatus(reading.algo_status) &&
    typeof reading.algo_counsel === "string" &&
    typeof reading.pandit_reply === "string" &&
    typeof reading.verdict_card === "string"
  );
}

function isKept(value: unknown): value is KeptScene {
  if (!value || typeof value !== "object") return false;
  const kept = value as Partial<KeptScene>;
  return isDate(kept.date) && isFrame(kept.frame);
}

export function streakView(record: StreakRecord, today: string): StreakView {
  if (!record.lastDate || record.streak < 1) return { kind: "risk", day: 0 };
  if (record.lastDate === today) return { kind: "intact", day: record.streak };
  if (record.lastDate === shiftDate(today, -1)) return { kind: "risk", day: record.streak };
  return { kind: "broken" };
}

export function welcomeDay(record: StreakRecord, today: string): number | null {
  if (streakView(record, today).kind !== "risk" || record.streak < 1) return null;
  return record.streak + 1;
}

export function yesterdayFrame(record: StreakRecord, today: string): AltarSceneFrame | null {
  const yesterday = shiftDate(today, -1);
  if (record.yesterday?.date === yesterday) return record.yesterday.frame;
  if (record.today?.date === yesterday) return record.today.frame;
  return null;
}

export function completePooja(
  record: StreakRecord,
  today: string,
  frame: AltarSceneFrame,
): { record: StreakRecord; rolled: boolean } {
  if (record.lastDate === today) {
    return { record: { ...record, today: { date: today, frame } }, rolled: false };
  }
  const continued = record.lastDate === shiftDate(today, -1) && record.streak > 0;
  const carried = continued && record.today?.date === record.lastDate ? record.today : null;
  return {
    record: {
      lastDate: today,
      streak: continued ? record.streak + 1 : 1,
      today: { date: today, frame },
      yesterday: carried,
    },
    rolled: true,
  };
}

export function loadStreak(): StreakRecord {
  if (typeof window === "undefined") return emptyStreak();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStreak();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyStreak();
    const record = parsed as Partial<StreakRecord>;
    const streak = typeof record.streak === "number" && record.streak > 0 ? Math.floor(record.streak) : 0;
    const lastDate = isDate(record.lastDate) ? record.lastDate : null;
    return {
      lastDate: streak > 0 ? lastDate : null,
      streak: streak > 0 && lastDate ? streak : 0,
      today: isKept(record.today) ? record.today : null,
      yesterday: isKept(record.yesterday) ? record.yesterday : null,
    };
  } catch {
    return emptyStreak();
  }
}

export function saveStreak(record: StreakRecord): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    return;
  }
}
