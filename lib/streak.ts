// Assumptions: a streak rises once per local calendar day. A gap of more than one day mourns the count.
// A second pooja on the same day does not raise it. The number is a habit, not a verdict.

import { daysBetween, localYmd } from "@/lib/time";

export type StreakState = { current: number; longest: number; lastPoojaAt: string | null };

export type StreakApply = {
  current: number;
  longest: number;
  alreadyToday: boolean;
  mourned: boolean;
  brokenFrom: number;
};

export type StreakView = {
  current: number;
  longest: number;
  doneToday: boolean;
  quiet: boolean;
  quietFrom: number;
};

function gap(lastPoojaAt: string, now: Date, timeZone: string): number {
  return daysBetween(localYmd(new Date(lastPoojaAt), timeZone), localYmd(now, timeZone));
}

export function applyPooja(state: StreakState, now: Date, timeZone: string): StreakApply {
  if (!state.lastPoojaAt) {
    const current = 1;
    return { current, longest: Math.max(state.longest, current), alreadyToday: false, mourned: false, brokenFrom: 0 };
  }
  const days = gap(state.lastPoojaAt, now, timeZone);
  if (days <= 0) {
    return { current: state.current, longest: state.longest, alreadyToday: true, mourned: false, brokenFrom: 0 };
  }
  if (days === 1) {
    const current = state.current + 1;
    return { current, longest: Math.max(state.longest, current), alreadyToday: false, mourned: false, brokenFrom: 0 };
  }
  return {
    current: 1,
    longest: state.longest,
    alreadyToday: false,
    mourned: state.current >= 1,
    brokenFrom: state.current,
  };
}

export function viewStreak(state: StreakState, now: Date, timeZone: string): StreakView {
  if (!state.lastPoojaAt) {
    return { current: state.current, longest: state.longest, doneToday: false, quiet: false, quietFrom: 0 };
  }
  const days = gap(state.lastPoojaAt, now, timeZone);
  if (days <= 0) return { current: state.current, longest: state.longest, doneToday: true, quiet: false, quietFrom: 0 };
  if (days === 1) return { current: state.current, longest: state.longest, doneToday: false, quiet: false, quietFrom: 0 };
  return { current: state.current, longest: state.longest, doneToday: false, quiet: state.current >= 1, quietFrom: state.current };
}
