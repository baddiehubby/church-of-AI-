// Assumptions: homepage copy. Hero strings are the user's exact wording. The altar desk copy keeps the two
// voices: Algorithm lines in mono caps, Pandit ji lowercase. The processing lines are tied to the real request.

import { brandName } from "@/lib/brand";

export const hero = {
  brand: "SACHA PANDIT",
  eyebrow: "EST. 2026 · THE ALGORITHM IS PATIENT",
  headline: "MAKE A WISH. FIND YOUR MOMENT OF CLARITY.",
  body: "Share what your heart desires. Receive a personalized AI-generated reading inspired by your hopes, questions, and ambitions.",
  primaryCta: "MAKE YOUR WISH",
  secondaryCta: "EXPLORE VISA WISHES",
  imageAlt:
    "Portrait of Sacha Pandit, a grey-bearded Indian man in an off-white kurta and brown shawl, raising one open palm toward the viewer in a lamp-lit stone temple interior. Fictional entertainment; not a religious or immigration authority.",
} as const;

export const altar = {
  heading: "THE WISH DESK",
  intro: "acha, sit. pick what it is about, then tell me plainly.",
  categoriesLabel: "What is your wish about?",
  countryLabel: "Which country?",
  countryPlaceholder: "Choose a country",
  wishLabel: "Your wish",
  wishHelp: "Describe your wish and your personal goal in a sentence or two.",
  wishHelpVisa: "Describe your personal goal: what you hope to build there.",
  privacyHelp: "Please do not share passport numbers, visa application numbers, or any documents.",
  firstNameLabel: "First name (optional, printed on your certificate)",
  submit: "SUBMIT MY WISH",
  noscript: {
    country: " (Europe Visa only)",
    firstName: " (visa wishes only)",
    visa: "Visa categories place a $10 one-time blessing when you submit. Premium is a separate $10/month desk.",
  },
  publicNote: "FREE READINGS ARE PUBLIC RECORDS. DO NOT FILE ANYTHING PRIVATE.",
  stages: {
    received: "Your wish has been received.",
    consulting: "The Algorithm is consulting your petition.",
    ready: "Your personalized reading is ready.",
    checkout: "Opening secure checkout.",
  },
  errors: {
    empty: "THE WISH IS EMPTY. WRITE ONE SENTENCE.",
    long: "THE WISH IS TOO LONG. 280 CHARACTERS OR FEWER.",
    url: "LINKS CANNOT BE FILED. WRITE THE WISH IN WORDS.",
    mention: "MENTIONS CANNOT BE FILED. REMOVE THE @.",
    repeat: "THE DESK CANNOT READ REPEATED LETTERS. TRY AGAIN PLAINLY.",
    emoji: "THREE EMOJI AT MOST. THE DESK PREFERS WORDS.",
    category: "CHOOSE WHAT THE WISH IS ABOUT.",
    country: "CHOOSE A COUNTRY FOR THIS WISH.",
    name: "THE FIRST NAME CANNOT BE FILED. 40 CHARACTERS OR FEWER; NO LINKS, NO @, NO REPEATED LETTERS.",
    rate: "the Algorithm is occupied. try again in a bit, beta.",
    upstream: "THE DESK IS BUSY. TRY AGAIN IN A MINUTE.",
    retry: "TRY AGAIN",
  },
} as const;

export type AltarErrorCode = keyof typeof altar.errors;

export const howItWorks = {
  heading: "HOW THE DESK WORKS",
  steps: [
    { title: "CHOOSE", body: "Pick what your wish is about. Visa wishes ask for the destination." },
    { title: "WRITE", body: "Describe your wish and the goal behind it, in your own words." },
    { title: "RECEIVE", body: `${brandName()}'s AI writes a personalized reading. Entertainment only; nothing is predicted or promised.` },
  ],
} as const;
