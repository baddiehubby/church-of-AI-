import "server-only";

import type { AltarState } from "@/lib/altarState";
import { currentSoul, hallCount, listPoojas } from "@/lib/congregation";
import { readSession } from "@/lib/session";
import { viewStreak } from "@/lib/streak";
import { atLeast } from "@/lib/tiers";
import { safeZone } from "@/lib/time";

export async function loadAltar(): Promise<AltarState> {
  const session = await readSession();
  const soul = await currentSoul();
  const empty: AltarState = {
    soulId: null,
    tier: "pilgrim",
    streakCurrent: 0,
    streakLongest: 0,
    lit: false,
    quiet: false,
    quietFrom: 0,
    timezoneSet: false,
    signedIn: Boolean(session),
    canAnother: false,
    listening: 0,
    today: null,
  };
  const listening = await hallCount();
  if (!soul) return { ...empty, listening };
  const zone = safeZone(soul.timezone);
  const view = viewStreak({ current: soul.streakCurrent, longest: soul.streakLongest, lastPoojaAt: soul.lastPoojaAt }, new Date(), zone);
  let today: AltarState["today"] = null;
  if (view.doneToday) {
    try {
      const latest = (await listPoojas(soul.userId))[0];
      if (latest) today = { reflection: latest.reflection, algo: latest.algoResponse, pandit: latest.panditNod };
    } catch {
      today = null;
    }
  }
  return {
    soulId: soul.userId,
    tier: soul.tier,
    streakCurrent: view.current,
    streakLongest: view.longest,
    lit: view.doneToday,
    quiet: view.quiet,
    quietFrom: view.quietFrom,
    timezoneSet: soul.timezoneSet,
    signedIn: Boolean(session),
    canAnother: atLeast(soul.tier, "believer"),
    listening,
    today,
  };
}
