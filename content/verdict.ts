import { extraPoolVerdicts, fewShotVerdicts } from "@/lib/fewShots";
import { OFFERING_MAX_DOLLARS, OFFERING_MIN_DOLLARS, OFFERING_PRESETS } from "@/lib/offering";
import type { Verdict } from "@/lib/verdictSchema";

export const certificateOffer = {
  suggestedDollars: OFFERING_MIN_DOLLARS,
  minDollars: OFFERING_MIN_DOLLARS,
  maxDollars: OFFERING_MAX_DOLLARS,
  presets: OFFERING_PRESETS,
  heading: "MAKE AN OFFERING",
  minimum: "Minimum offering: $10 USD",
  body: "A one-time tip for a petition certificate. Not a subscription. Not Sacha Pandit Premium ($10/month) and not the Visa Wish ($10 one-time). An offering does not make a wish, visa, relationship, or fortune come true.",
  oneTime: "One-time payment. Never a subscription.",
  button: "MAKE AN OFFERING",
  nameLabel: "Name on the certificate",
  amountLabel: "Amount in whole dollars (your offering)",
  customLabel: "Custom amount (minimum $10)",
  preview: (dollars: number) => `You are about to leave an offering of $${dollars} USD (one-time).`,
  nameError: "THE NAME CANNOT BE FILED.",
  amountError: "THE AMOUNT MUST BE A WHOLE DOLLAR FROM 10 TO 500.",
} as const;

export const verdictPage = {
  metaDescription: "A FICTIONAL VERDICT. A RECORD, NOT AN OUTCOME.",
  reviewed: "Reviewed by the Algorithm",
  received: "PETITION RECEIVED",
  soulLabel: "SOUL ID",
  statusLabel: "STATUS",
  sacrificeHeading: "REQUIRED SACRIFICES",
  counselHeading: "COUNSEL",
  probabilityHeading: "PROBABILITY",
  spoken: "THE ALGORITHM HAS SPOKEN.",
  panditFallback: "acha, the Algorithm is busy. sit for a minute, beta.",
  missingTitle: "THIS PETITION IS NOT IN THE LEDGER.",
  missingCta: "SUBMIT YOUR OWN PETITION →",
  own: "SUBMIT YOUR OWN PETITION →",
  shareLabel: "SHARE",
  share: {
    save: "SAVE PNG",
    copy: "COPY LINK",
    copied: "link copied, beta",
    x: "POST TO X",
    soundOn: "SOUND OPEN",
    soundOff: "SOUND SEALED",
  },
  xLead: "the Algorithm reviewed my wish.",
  ogAlt: "Verdict scroll and Pandit ji note",
  notices: {
    nap: "CHECKOUT IS TAKING A NAP. TRY AGAIN IN A MINUTE.",
    rate: "ENOUGH OFFERINGS ARE ON FILE. WAIT TEN MINUTES.",
    geo: "CHECKOUT CANNOT BE TAKEN FROM THIS COUNTRY.",
    invalid: "THAT PETITION IS NOT IN THE REGISTER.",
    name: certificateOffer.nameError,
    amount: certificateOffer.amountError,
  },
} as const;

export const certificatePage = {
  waiting: "THE CERTIFICATE IS NOT SEALED YET. THIS PAGE WILL CHECK AGAIN.",
  kicker: "PETITION CERTIFICATE",
  scene: "A SEATED PERSON HOLDING A PAPER. NOT A DEITY.",
  report: "REPORT THIS CERTIFICATE",
  missing: "THIS PETITION IS NOT IN THE REGISTER.",
} as const;

export const verdictPool: readonly Verdict[] = [...fewShotVerdicts, ...extraPoolVerdicts];
