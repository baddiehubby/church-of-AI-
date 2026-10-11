// The episode desk is in memory until Supabase. The cron reads it. Email addresses are never logged.

import "server-only";

import { parseSitting } from "@/lib/altarSittings";
import { sendEpisodeEmail } from "@/lib/email";
import { composeEpisode, episodeIsDue, isEpisodeMail, isSunday, type AltarSitting } from "@/lib/episodeCompose";
import { tierForEmail } from "@/lib/congregation";
import { logger } from "@/lib/logger";
import { atLeast } from "@/lib/tiers";
import { localParts, localYmd, safeZone } from "@/lib/time";

type Desk = {
  id: string;
  email: string | null;
  timezone: string;
  sittings: AltarSitting[];
  deliveredWeek: string | null;
};

const MAX_DESKS = 500;

const globalDesk = globalThis as typeof globalThis & { __altarEpisodeDesks?: Map<string, Desk> };

function desks(): Map<string, Desk> {
  if (!globalDesk.__altarEpisodeDesks) globalDesk.__altarEpisodeDesks = new Map();
  return globalDesk.__altarEpisodeDesks;
}

export function saveEpisodeDesk(input: {
  id: string;
  email: string;
  timezone: string;
  sittings: unknown[];
}): boolean {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(input.id)) return false;
  const sittings = input.sittings.slice(0, 21).flatMap((item) => {
    const sitting = parseSitting(item);
    return sitting ? [sitting] : [];
  });
  const store = desks();
  const prior = store.get(input.id);
  const trimmed = input.email.trim();
  const email = trimmed === "" ? null : isEpisodeMail(trimmed) ? trimmed : (prior?.email ?? null);
  if (!store.has(input.id) && store.size >= MAX_DESKS) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(input.id, {
    id: input.id,
    email,
    timezone: safeZone(input.timezone),
    sittings,
    deliveredWeek: prior?.deliveredWeek ?? null,
  });
  return true;
}

export async function deliverEpisodeDesk(id: string, now = new Date()): Promise<boolean> {
  const desk = desks().get(id);
  if (!desk) return false;
  return deliverDesk(desk, now);
}

export async function deliverDueEpisodes(now = new Date()): Promise<number> {
  let sent = 0;
  for (const desk of desks().values()) {
    if (sent >= 100) break;
    if (await deliverDesk(desk, now)) sent += 1;
  }
  return sent;
}

async function deliverDesk(desk: Desk, now: Date): Promise<boolean> {
  if (!desk.email) return false;
  if (!atLeast(await tierForEmail(desk.email), "believer")) return false;
  const parts = localParts(now, desk.timezone);
  if (!episodeIsDue(parts)) return false;
  const week = localYmd(now, desk.timezone);
  if (!isSunday(week) || desk.deliveredWeek === week) return false;
  const episode = composeEpisode({ week, sittings: desk.sittings });
  if (episode.sat < 1) return false;
  const ok = await sendEpisodeEmail({ to: desk.email, episode });
  if (!ok) {
    logger.info("episode email skipped", { desk: desk.id });
    return false;
  }
  desk.deliveredWeek = week;
  logger.info("episode email sent", { desk: desk.id, week });
  return true;
}
