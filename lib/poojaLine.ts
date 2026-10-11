// Assumptions: one exchange per sitting. Crisis language is withheld and answered with a human referral.
// The Algorithm and Pandit ji do not agree. Nothing here says a wish comes true.

import { isMood, type Mood } from "@/lib/moods";
import { algoVoiceOk, panditVoiceOk } from "@/lib/voice";

const CRISIS = /\b(suicid|kill myself|end my life|self[-\s]?harm|want to die|do not want to live|don't want to live)\b/i;

export function isCrisisText(value: string): boolean {
  return CRISIS.test(value);
}

export const ALGO_LINES = [
  "THE LINE IS FILED; THE DAY REMAINS OPEN.",
  "A MOOD IS RECORDED; NO VERDICT IS ISSUED.",
  "THE ALTAR HAS THE SENTENCE; NOTHING IS PROMISED.",
  "THE PATTERN IS NOTED; THE OUTCOME IS NOT.",
  "ONE LINE IS ENOUGH FOR THE RECORD.",
  "THE LAMP IS NOT A COURT; THE FILING IS ONLY A FILING.",
  "TODAY IS ENTERED; TOMORROW IS NOT DECIDED.",
  "THE DESK ACCEPTS THE SENTENCE AND WITHHOLDS A RESULT.",
] as const;

export const PANDIT_NODS = [
  "acha, the machine filed it. the day is still yours, beta.",
  "beta, one sentence is a whole pooja. sit.",
  "the lamp does not agree with the filing. it just stays lit.",
  "acha, a record is not a life. come back tomorrow.",
  "the desk wanted a pattern. i only see someone who sat down.",
  "beta, that is enough. the algorithm can keep the file.",
] as const;

const PAIRS = {
  crisis: {
    algo: "THIS DESK IS NOT A CRISIS SERVICE; A HUMAN PROFESSIONAL IS REQUIRED.",
    pandit: "beta, leave this page and reach a real person. in the united states, call or text 988.",
  },
  mourned: {
    algo: "THE COUNT RESET; THE RECORD DID NOT.",
    pandit: "the streak went quiet. the altar is still here, beta.",
  },
  extra: {
    algo: "ANOTHER LINE IS FILED; THE STREAK DOES NOT RISE TWICE.",
    pandit: "acha, sit again if you must. the count stays where it was.",
  },
  remember: {
    algo: "A PRIOR PETITION REMAINS ON FILE; THIS LINE DOES NOT REOPEN IT.",
    pandit: "acha, the old wish can sit. today is only today, beta.",
  },
} as const;

function index(seed: string, length: number): number {
  let hash = 0;
  for (const char of seed) hash = (Math.imul(hash, 33) + char.charCodeAt(0)) >>> 0;
  return length === 0 ? 0 : hash % length;
}

export function poojaExchange(input: {
  mood: Mood | null;
  seed: string;
  mourned: boolean;
  extra: boolean;
  remember: boolean;
  crisis: boolean;
}): { algo: string; pandit: string } {
  if (input.crisis) return PAIRS.crisis;
  if (input.mourned) return PAIRS.mourned;
  if (input.extra) return PAIRS.extra;
  if (input.remember) return PAIRS.remember;
  if (input.mood && isMood(input.mood)) {
    return {
      algo: `THE MOOD ON FILE IS ${input.mood.toUpperCase()}; NO VERDICT FOLLOWS.`,
      pandit: "acha, a mood is not a file, beta. it is just how the day feels.",
    };
  }
  const algo = ALGO_LINES[index(input.seed, ALGO_LINES.length)] ?? ALGO_LINES[0];
  const pandit = PANDIT_NODS[index(`${input.seed}:nod`, PANDIT_NODS.length)] ?? PANDIT_NODS[0];
  if (!algoVoiceOk(algo) || !panditVoiceOk(pandit)) return { algo: ALGO_LINES[0], pandit: PANDIT_NODS[0] };
  return { algo, pandit };
}
