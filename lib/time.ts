// Assumptions: wall-clock time for streaks, Monday sermons, and 7am reminders. Invalid zones fall back to UTC.
// One correction pass covers ordinary DST. The altar never promises a result at a given hour.

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

export function safeZone(zone: string | null | undefined): string {
  const value = zone?.trim() || "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return "UTC";
  }
}

export function localParts(date: Date, timeZone: string): LocalParts {
  const zone = safeZone(timeZone);
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(formatted.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    weekday: WEEKDAY[map.weekday ?? ""] ?? 0,
  };
}

export function localYmd(date: Date, timeZone: string): string {
  const parts = localParts(date, timeZone);
  return ymd(parts.year, parts.month, parts.day);
}

export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

export function weekdayOfYmd(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isMonday(value: string): boolean {
  return isYmd(value) && weekdayOfYmd(value) === 1;
}

export function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function mondayOf(date: Date, timeZone: string): string {
  const today = localYmd(date, timeZone);
  const weekday = weekdayOfYmd(today);
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addDays(today, delta);
}

export function monthStart(date: Date, timeZone: string): string {
  const parts = localParts(date, timeZone);
  return ymd(parts.year, parts.month, 1);
}

export function daysBetween(earlierYmd: string, laterYmd: string): number {
  const [ay, am, ad] = earlierYmd.split("-").map(Number);
  const [by, bm, bd] = laterYmd.split("-").map(Number);
  const a = Math.floor(Date.UTC(ay, am - 1, ad) / 86_400_000);
  const b = Math.floor(Date.UTC(by, bm - 1, bd) / 86_400_000);
  return b - a;
}

export function zonedToUtc(value: string, hour: number, minute: number, timeZone: string): Date {
  const zone = safeZone(timeZone);
  const [year, month, day] = value.split("-").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const corrected = shift(guess, zone);
  const seen = localParts(corrected, zone);
  if (seen.year === year && seen.month === month && seen.day === day && seen.hour === hour && seen.minute === minute) return corrected;
  return shift(guess, zone, corrected);
}

function shift(guess: Date, timeZone: string, at: Date = guess): Date {
  const parts = localParts(at, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  return new Date(guess.getTime() - (asUtc - at.getTime()));
}

export function formatWhen(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(timeZone),
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return when.toUpperCase();
}

export function monthLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: safeZone(timeZone), month: "long", year: "numeric" }).format(date);
}
