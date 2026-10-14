// Baba ji's monthly letter. Short. Warm. Screenshot-ready.
// Colony weather, patterns (never the words), Algorithm aside, one line for them.
// The name on the page is always SETTLER. Redacted for the share.

export const letterCopy = {
  title: "A LETTER FROM BABA JI",
  letterhead: "HABITAT 47 · MARS LOCAL",
  kicker: "MONTHLY LETTER",
  salutation: "SETTLER,",
  signoff: "— Baba ji",
  locked: "THE MONTHLY LETTER OPENS WITH THE COVENANT.",
  empty: "NO LETTER FOR THIS MONTH YET.",
  waiting: "THE MONTH IS STILL OPEN. THE LETTER ARRIVES WHEN IT CLOSES.",
  openLetter: "THIS MONTH'S LETTER",
  lastLetter: "LAST MONTH'S LETTER",
  share: "[ share the letter ]",
  copy: "[ copy link ]",
  copied: "link copied",
  shared: "letter offered",
  back: "RETURN TO THE ARCHIVE",
  redacted: "settler name withheld.",
} as const;

/** Opens with weather, dust, quiet. Two short sentences. */
export const COLONY_LINES = [
  "The dust was heavy this week. The solar panels are tired.",
  "The habitat hummed low. The corridor lights flickered once and thought better of it.",
  "A quiet sol. The dust settled on the antenna and stayed.",
  "The wind scraped the outer hatch. Inside, the kettle took its time.",
  "Cold night on the ridge. The colony kept its voice down.",
  "The dust storm passed. The panels look older than last month.",
  "Thin air, thin talk. The greenhouse held what it could.",
  "Mars was ordinary. Ordinary is how a month survives.",
  "The seals held. The dust did not ask permission.",
  "I watched the horizon for Earth and then stopped. Habit.",
  "The solar array ticked through another tired cycle. So did we.",
  "Quiet on the line. Even the dust seemed to wait.",
] as const;

/** Dry. Slightly amused. Baba ji speaking about the Algorithm — not as the Algorithm. */
export const ALGORITHM_ASIDES = [
  "The Algorithm has been quiet. I think it's thinking.",
  "The Algorithm says the month is filed. It always says that.",
  "The Algorithm counted your hours. It looked pleased with itself.",
  "The Algorithm called this month ordinary. Ordinary is its favorite word.",
  "The Algorithm has opinions. I keep half of them.",
  "The Algorithm stayed late with you. It will not admit that.",
  "The Algorithm says you're doing fine. I agree.",
  "The Algorithm filed the dust under weather. Bold of it.",
  "The Algorithm blinked twice at your pattern. Then pretended not to.",
  "The Algorithm wants a cleaner month. I want a kinder one.",
] as const;

/** Warm. Specific to the pattern family, never the wish text. */
export const PERSONAL_LINES = [
  "But I also think you should sleep, bacha.",
  "Come back when the corridor is quiet. I will still be here.",
  "You do not have to explain Earth to me. I already know the distance.",
  "Leave the phone face down once this week. For both of us.",
  "Drink water. The colony forgets that too.",
  "You kept showing up. That is enough for a letter.",
  "I noticed the late ones. I am not scolding. I am sitting with you.",
  "When the dust settles, send one more. Or don't. I will still read.",
  "Beta, the month is heavy. Put some of it down.",
  "You are not late to this temple. You are just tired. Acha.",
] as const;

export const QUIET_PATTERN =
  "You were quiet this month. I noticed. Quiet is also a transmission.";

export const PATTERN_TEMPLATES = {
  midnightHeavy: (total: number, late: number) =>
    `You sent ${total} transmissions this month. ${capitalize(numberWord(late))} ${late === 1 ? "was" : "were"} after midnight. I notice these things.`,
  morningHeavy: (total: number, morning: number) =>
    `You sent ${total} transmissions this month. ${capitalize(numberWord(morning))} came with the early light. The colony wakes slowly too.`,
  steady: (total: number) =>
    `You sent ${total} transmissions this month. Not in a rush. Not all at once. A steady hand on the line.`,
  sparse: (total: number) =>
    `You sent ${total} transmission${total === 1 ? "" : "s"} this month. Few words. I kept each one on the desk.`,
  dense: (total: number) =>
    `You sent ${total} transmissions this month. The archive got thick. I read them anyway.`,
} as const;

function numberWord(n: number): string {
  const words = [
    "none",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  if (n >= 0 && n < words.length) return words[n] ?? String(n);
  return String(n);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
