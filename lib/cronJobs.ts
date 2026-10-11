import { sendPoojaReminder, sendSermonEmail } from "@/lib/email";
import { listPoojas, listSouls, listWishes, markSermonDelivered, saveSermon, updateSoul, getSermon } from "@/lib/congregation";
import { logger } from "@/lib/logger";
import { composeSermon } from "@/lib/sermonCompose";
import { atLeast } from "@/lib/tiers";
import { addDays, localParts, localYmd, mondayOf, safeZone, zonedToUtc } from "@/lib/time";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function remindPoojas(now = new Date()): Promise<number> {
  const souls = await listSouls();
  let sent = 0;
  for (const soul of souls) {
    if (!soul.email) continue;
    const zone = safeZone(soul.timezone);
    const parts = localParts(now, zone);
    if (parts.hour !== 7 || parts.weekday === 1) continue;
    const today = localYmd(now, zone);
    if (soul.lastReminderOn === today) continue;
    if (soul.lastPoojaAt && localYmd(new Date(soul.lastPoojaAt), zone) === today) continue;
    try {
      const ok = await sendPoojaReminder({ to: soul.email });
      await updateSoul(soul.userId, { lastReminderOn: today });
      if (ok) sent += 1;
    } catch {
      logger.error("pooja reminder failed", { soul_id: soul.userId });
    }
  }
  return sent;
}

export async function deliverSermons(now = new Date()): Promise<number> {
  const souls = await listSouls();
  let sent = 0;
  for (const soul of souls) {
    if (!soul.email || !atLeast(soul.tier, "believer")) continue;
    const zone = safeZone(soul.timezone);
    const parts = localParts(now, zone);
    if (parts.weekday !== 1 || parts.hour < 7 || parts.hour > 11) continue;
    const week = mondayOf(now, zone);
    let sermon;
    try {
      sermon = await getSermon(soul.userId, week);
    } catch {
      logger.error("sermon load failed", { soul_id: soul.userId });
      continue;
    }
    if (!sermon) {
      const since = zonedToUtc(addDays(week, -7), 0, 0, zone).toISOString();
      const until = zonedToUtc(week, 0, 0, zone).toISOString();
      const poojas = await listPoojas(soul.userId, since, until);
      const wishes = await listWishes(soul.userId, since);
      const draft = composeSermon({
        soulId: soul.userId,
        name: soul.name,
        tier: soul.tier,
        weekOf: week,
        poojas: poojas.map((row) => ({ mood: row.mood, reflection: row.reflection })),
        wishes: wishes.filter((row) => row.createdAt < until).map((row) => ({ category: row.category, wish: row.wish })),
      });
      sermon = await saveSermon({ userId: soul.userId, weekOf: week, ...draft });
    }
    if (sermon.deliveredAt) continue;
    const ok = await sendSermonEmail({ to: soul.email, week, title: sermon.title });
    await markSermonDelivered(soul.userId, week, now.toISOString());
    if (ok) sent += 1;
    else logger.info("sermon email skipped", { soul_id: soul.userId });
  }
  return sent;
}

export function cronAuthorized(request: Request): boolean {
  return authorized(request);
}
