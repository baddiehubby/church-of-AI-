// The last three weeks of altar sittings live in the browser until a register exists.
// One line per calendar day. A crisis line is withheld before it is stored.

import { ALTAR_STATUSES } from "@/content/altarScene";
import { publicReflection, type AltarSitting } from "@/lib/episodeCompose";
import { isYmd } from "@/lib/time";
import { panditVoiceOk } from "@/lib/voice";

const SITTINGS = "sp-altar-sittings";
const DESK = "sp-altar-desk";
const MAIL = "sp-altar-mail";
const COUNT = "sp-altar-count";
const MAX = 21;

function isStatus(value: string): boolean {
  return (ALTAR_STATUSES as readonly string[]).includes(value);
}

export function parseSitting(value: unknown): AltarSitting | null {
  if (!value || typeof value !== "object") return null;
  const sitting = value as Partial<AltarSitting>;
  if (!isYmd(sitting.date ?? "")) return null;
  const reflection = typeof sitting.reflection === "string" ? publicReflection(sitting.reflection) : "";
  const pandit = typeof sitting.pandit === "string" && panditVoiceOk(sitting.pandit) ? sitting.pandit : "";
  const status = typeof sitting.status === "string" && isStatus(sitting.status) ? sitting.status : "";
  if (!reflection && !pandit) return null;
  return { date: sitting.date ?? "", reflection, pandit, status };
}

export function mergeSittings(list: AltarSitting[], next: AltarSitting): AltarSitting[] {
  const kept = list.filter((item) => item.date !== next.date);
  kept.push(next);
  kept.sort((a, b) => a.date.localeCompare(b.date));
  return kept.slice(-MAX);
}

export function loadSittings(): AltarSitting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SITTINGS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const sitting = parseSitting(item);
      return sitting ? [sitting] : [];
    });
  } catch {
    return [];
  }
}

export function keepSitting(sitting: AltarSitting): AltarSitting[] {
  const next = mergeSittings(loadSittings(), sitting);
  try {
    window.localStorage.setItem(SITTINGS, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export function deskId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(DESK);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const id = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(DESK, id);
    return id;
  } catch {
    return "";
  }
}

export function loadPoojaCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const value = Number(window.localStorage.getItem(COUNT));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function notePooja(): number {
  const next = loadPoojaCount() + 1;
  try {
    window.localStorage.setItem(COUNT, String(next));
  } catch {
    return next;
  }
  return next;
}

export function loadMail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(MAIL)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function saveMail(value: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = value.trim();
    if (!trimmed) window.localStorage.removeItem(MAIL);
    else window.localStorage.setItem(MAIL, trimmed);
  } catch {
    return;
  }
}
