// Altar rite copy. The reading comes from /api/pooja. Nothing here says the line comes true.

import { STATUSES } from "@/content/algorithm";

export const ALTAR_STATUSES = STATUSES;

export type AltarStatus = (typeof ALTAR_STATUSES)[number];

export type AltarReading = {
  algo_status: AltarStatus;
  algo_counsel: string;
  pandit_reply: string;
  verdict_card: string;
};

export const altarScene = {
  placeholder: "what's on your mind today, beta?",
  ring: "RING THE BELL",
  listening: "the Algorithm is listening...",
  title: "THE ALGORITHM HAS SPOKEN",
  save: "save scene",
  share: "share scene",
  again: "ring the bell again",
  saved: "scene saved",
  shared: "scene copied",
  soundOn: "SOUND ON",
  soundOff: "SOUND OFF",
  missingTitle: "THE SCENE IS NOT IN THE REGISTER.",
  missingBody: "acha, that frame was not kept, beta.",
  missingCta: "THE ALTAR",
  intact: "STREAK INTACT",
  risk: "STREAK AT RISK",
  broken: "STREAK BROKEN",
  startAgain: "start again, beta.",
  yesterday: "yesterday's scene",
  wereHere: "you were here",
  mars: "THIS IS A TEMPLE LOCATED ON MARS.",
} as const;

export function welcomeBackLine(day: number): string {
  return `welcome back, beta. day ${day}.`;
}

export const altarErrors = {
  empty: "THE LINE IS EMPTY. WRITE ONE SENTENCE.",
  rate: "THREE LINES AN HOUR. THE DESK OPENS AGAIN LATER.",
  unconfigured: "THE MODEL DESK IS NOT CONNECTED.",
  upstream: "THE ALTAR IS BUSY. TRY AGAIN IN A MINUTE.",
} as const;
