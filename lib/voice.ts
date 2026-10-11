// Assumptions: the Algorithm is mono caps, no contractions, no first person, no exclamation, no emoji.
// Pandit ji is lowercase. A reaction to the Algorithm is one line. The two voices do not match.

const ALGO_FORBIDDEN =
  /\b(?:I|I'M|I'VE|I'LL|I'D|ME|MY|MINE|WE|OUR|OURS|US|DON'T|CAN'T|WON'T|IT'S|THAT'S|ISN'T|AREN'T|WASN'T|WEREN'T|DIDN'T|DOESN'T|HAVEN'T|HASN'T|WOULDN'T|COULDN'T|SHOULDN'T|LET'S|THEY'RE|WE'RE|YOU'RE)\b/;

export function algoVoiceOk(line: string): boolean {
  if (!line || line !== line.toUpperCase()) return false;
  if (/[!?]/.test(line) || /['’]/.test(line)) return false;
  if (/\p{Extended_Pictographic}/u.test(line)) return false;
  if (ALGO_FORBIDDEN.test(line)) return false;
  if (line.includes("\n")) return false;
  return true;
}

export function panditVoiceOk(line: string): boolean {
  if (!line || line !== line.toLowerCase()) return false;
  if (/[!?]/.test(line)) return false;
  if (/\p{Extended_Pictographic}/u.test(line)) return false;
  if (line.includes("\n")) return false;
  return true;
}

export function voicesDisagree(algo: string, pandit: string): boolean {
  if (!algoVoiceOk(algo) || !panditVoiceOk(pandit)) return false;
  if (algo.toLowerCase() === pandit) return false;
  if (pandit.includes(algo.toLowerCase())) return false;
  return true;
}
