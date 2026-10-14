// A preserved transmission lives in this browser. Free keeps it for seven days.
// A paid settler seat keeps it. Nothing here is promised.

import type { AltarReading } from "@/content/altarScene";
import { archiveKeepsForever, loadMarsEntitlement } from "@/lib/marsEntitlement";
import { atLeast, type Tier } from "@/lib/tiers";

const KEY = "sp-transmission-archive";
export const ARCHIVE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX = 200;

export type KeptTransmission = {
  id: string;
  savedAt: number;
  expiresAt: number | null;
  soulId: string;
  day: number;
  reflection: string;
  reading: AltarReading;
  opening: string;
  /** Warm line under the verdict. Older rows may omit this. */
  translation?: string;
  forecast: string;
};

export function archiveTranslation(item: KeptTransmission): string {
  return item.translation?.trim() || item.reading.pandit_reply;
}

/** Oldest first gets #1. Newest first for display. */
export function numberedArchive(items: KeptTransmission[]): Array<KeptTransmission & { number: number }> {
  const oldestFirst = [...items].sort((a, b) => a.savedAt - b.savedAt || a.id.localeCompare(b.id));
  return oldestFirst
    .map((item, index) => ({ ...item, number: index + 1 }))
    .sort((a, b) => b.savedAt - a.savedAt || b.number - a.number);
}

export function marsLocalClock(ms: number): string {
  const date = new Date(ms);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function archiveExpiry(tier: Tier, now: number): number | null {
  if (atLeast(tier, "believer")) return null;
  if (archiveKeepsForever(loadMarsEntitlement(now), now)) return null;
  return now + ARCHIVE_WEEK_MS;
}

export function retainArchive(items: KeptTransmission[], now: number): KeptTransmission[] {
  return items.filter((item) => item.expiresAt === null || item.expiresAt > now).slice(-MAX);
}

function read(): KeptTransmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is KeptTransmission => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<KeptTransmission>;
      return typeof row.id === "string" && typeof row.savedAt === "number" && typeof row.soulId === "string";
    });
  } catch {
    return [];
  }
}

function write(items: KeptTransmission[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function loadArchive(now = Date.now()): KeptTransmission[] {
  const live = retainArchive(read(), now);
  write(live);
  return live;
}

export function preserveTransmission(
  entry: Omit<KeptTransmission, "savedAt" | "expiresAt">,
  tier: Tier,
  now = Date.now(),
): KeptTransmission {
  const next: KeptTransmission = { ...entry, savedAt: now, expiresAt: archiveExpiry(tier, now) };
  const items = retainArchive(read(), now).filter((item) => item.id !== next.id);
  items.push(next);
  write(items.slice(-MAX));
  return next;
}
