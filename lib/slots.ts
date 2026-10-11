import { addDays, localYmd, safeZone, weekdayOfYmd, zonedToUtc } from "@/lib/time";

export const SCREENING_CAP = 10;

export function screeningSlots(now: Date, timeZone: string, count = 4): { iso: string; label: string }[] {
  const zone = safeZone(timeZone);
  const slots: { iso: string; label: string }[] = [];
  const start = localYmd(now, zone);
  for (let offset = 0; offset < 70 && slots.length < count; offset += 1) {
    const day = addDays(start, offset);
    if (weekdayOfYmd(day) !== 6) continue;
    const when = zonedToUtc(day, 19, 0, zone);
    if (when.getTime() <= now.getTime() + 60_000) continue;
    const label = new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "2-digit", month: "short" }).format(when);
    slots.push({ iso: when.toISOString(), label: `SATURDAY 19:00 · ${label.toUpperCase()}` });
  }
  return slots;
}
