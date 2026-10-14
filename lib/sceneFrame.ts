// A scene frame is the movie's identity. No database: the share URL carries the reading.
// Soul ids use the petition alphabet. Day is the day of the year, not a streak.

import { ALTAR_STATUSES, type AltarReading, type AltarStatus } from "@/content/altarScene";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SOUL_PATTERN = /^SOUL-[A-Z2-9]{4}-[A-Z2-9]{2}$/;

export type AltarSceneFrame = {
  soulId: string;
  day: number;
  reading: AltarReading;
};

export function sceneSoulId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "SOUL-";
  bytes.forEach((byte, index) => {
    if (index === 4) out += "-";
    out += ALPHABET[byte % ALPHABET.length] ?? "A";
  });
  return out;
}

const SOUL_KEY = "sp-altar-soul";

/** One soul for this browser. Habitat ids and offerings hang off it. */
export function persistentSoulId(): string {
  if (typeof window === "undefined") return sceneSoulId();
  try {
    const existing = window.localStorage.getItem(SOUL_KEY)?.trim().toUpperCase() ?? "";
    if (SOUL_PATTERN.test(existing)) return existing;
    const next = sceneSoulId();
    window.localStorage.setItem(SOUL_KEY, next);
    return next;
  } catch {
    return sceneSoulId();
  }
}

export function dayOfYear(now = new Date()): number {
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / 86_400_000);
}

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.replace(/[\r\n]+/g, " ").trim() : "";
}

function isStatus(value: string): value is AltarStatus {
  return (ALTAR_STATUSES as readonly string[]).includes(value);
}

export function sceneSearch(frame: AltarSceneFrame): string {
  const params = new URLSearchParams({
    soul: frame.soulId,
    day: String(frame.day),
    status: frame.reading.algo_status,
    pandit: frame.reading.pandit_reply,
    counsel: frame.reading.algo_counsel,
  });
  return params.toString();
}

export function sceneShareUrl(frame: AltarSceneFrame, origin: string): string {
  const root = origin.replace(/\/$/, "");
  return `${root}/scene?${sceneSearch(frame)}`;
}

export function parseSceneFrame(input: Record<string, string | string[] | undefined> | URLSearchParams): AltarSceneFrame | null {
  const params = input instanceof URLSearchParams ? Object.fromEntries(input.entries()) : input;
  const soulId = one(params.soul).toUpperCase();
  const day = Number(one(params.day));
  const status = one(params.status);
  const pandit = one(params.pandit);
  const counsel = one(params.counsel);
  if (!SOUL_PATTERN.test(soulId)) return null;
  if (!Number.isInteger(day) || day < 1 || day > 366) return null;
  if (!isStatus(status)) return null;
  if (!pandit || pandit.length > 180 || !counsel || counsel.length > 480) return null;
  return {
    soulId,
    day,
    reading: { algo_status: status, algo_counsel: counsel, pandit_reply: pandit, verdict_card: status },
  };
}
