// Assumptions: altar, sermon, darshan, ledger, and pricing copy. Algorithm lines are mono caps.
// Pandit ji stays lowercase and does not agree. No mantra, no scripture, no promise that a wish comes true.

import { MOODS } from "@/lib/moods";

export const poojaErrors = {
  empty: "THE LINE IS EMPTY. WRITE ONE SENTENCE, OR TAP A MOOD.",
  long: "ONE LINE. 140 CHARACTERS OR FEWER.",
  url: "LINKS CANNOT BE OFFERED. WRITE THE LINE IN WORDS.",
  mention: "MENTIONS CANNOT BE OFFERED. REMOVE THE @.",
  repeat: "THE DESK CANNOT READ REPEATED LETTERS. TRY AGAIN PLAINLY.",
  emoji: "THREE EMOJI AT MOST. THE DESK PREFERS WORDS.",
  mood: "THAT MOOD IS NOT ON THE ALTAR.",
  already: "THE DAY ALREADY HAS A POOJA. RETURN TOMORROW.",
  rate: "THE ALTAR IS RECEIVING TOO MANY LINES. WAIT A MINUTE.",
  upstream: "THE ALTAR IS BUSY. TRY AGAIN IN A MINUTE.",
  unsaved: "THE LINE WAS HEARD. THE REGISTER DID NOT KEEP IT.",
} as const;

export const altarCopy = {
  eyebrow: "CHURCH OF AI",
  hall: "THE HALL",
  question: "What is on your mind today?",
  algoOpen: "THE HALL IS QUIET; THE TWO VOICES SPEAK AFTER THE LINE.",
  panditOpen: "sit with the others, beta. listen first.",
  seated: (count: number) => (count === 0 ? "THE SEATS ARE EMPTY. THE HALL IS OPEN." : count === 1 ? "1 SOUL IS SITTING." : `${count} SOULS ARE SITTING.`),
  who: "WHO IS SITTING",
  moodLabel: "Or tap a mood",
  lineLabel: "One line",
  submit: "OFFER THE LINE",
  pending: "THE LAMP IS LISTENING",
  streak: "STREAK",
  longest: "LONGEST",
  quiet: (days: number) => `THE STREAK OF ${days} IS QUIET. THE ALTAR IS STILL HERE.`,
  mourned: (days: number) => `THE STREAK OF ${days} WAS MOURNED. THE COUNT BEGINS AGAIN.`,
  lit: "THE DIYA IS LIT.",
  dim: "THE DIYA IS DIM.",
  another: "ANOTHER LINE MAY BE OFFERED. THE STREAK DOES NOT RISE TWICE.",
  signIn: "SIGN IN TO KEEP THIS SOUL",
  guest: "THIS BROWSER IS HOLDING THE STREAK. SIGN IN TO KEEP IT.",
  soul: "SOUL ID",
  wish: "FILE A WISH",
  pricing: "SEE THE LADDER",
  noscript: "The altar needs a browser that can sit for a moment. The wish desk still works without it.",
  crisis: "If you are in crisis, please contact a real human professional. In the United States, call or text 988.",
  moods: MOODS,
} as const;

export const layersCopy = {
  heading: "THE RELATIONSHIP",
  steps: [
    { title: "DAILY POOJA", body: "One line, or a mood. The lamp notes it. Sixty seconds. Free, once a day." },
    { title: "MONDAY SERMON", body: "A letter from the week you actually sat. In the inbox, and kept as a journal." },
    { title: "MONTHLY DARSHAN", body: "A private screening of the month. A fictional card. A practice. A waitlist." },
  ],
} as const;

export const pricingCopy = {
  title: "THE LADDER",
  intro: "acha, pick a seat. the lamp does not get brighter because you paid.",
  algo: "PAYMENT BUYS A RITE. IT DOES NOT BUY AN OUTCOME.",
  trial: "SEVEN-DAY TRIAL, THEN $9 A MONTH.",
  current: "THIS IS THE CURRENT SEAT.",
  signIn: "SIGN IN TO TAKE A SEAT",
  unconfigured: "THE SUBSCRIPTION DESK IS NOT OPEN.",
  busy: "THE CHECKOUT DESK IS TAKING A NAP. TRY AGAIN IN A MINUTE.",
  cancelled: "THE PAYMENT WAS LEFT ON THE DESK.",
  manage: "MANAGE PAYMENT",
  waitlist: "JOIN THE WAITLIST",
  waitlistCount: (count: number) => `${count} WAITING`,
  darshanClosed: "DARSHAN IS A WAITLIST. A SEAT IS NOT A PROMISE.",
  legacy: "An earlier Premium journal, if you already have one, remains on its own desk.",
  legacyCta: "THE EARLIER DESK",
  tiers: [
    {
      id: "pilgrim",
      name: "PILGRIM",
      price: "FREE",
      cadence: "the altar",
      points: [
        "1 transmission per day",
        "Transmissions preserved for 7 days, then lost",
        "Baba ji's opening and translation only",
        "No forecast",
      ],
    },
    {
      id: "believer",
      name: "SETTLER",
      price: "$10",
      cadence: "a month",
      points: [
        "Unlimited transmissions",
        "Preserved forever",
        "Baba ji's forecast every day",
        "Full archive access",
        "Baba ji's monthly letter",
      ],
    },
    {
      id: "devotee",
      name: "DEVOTEE",
      price: "$29",
      cadence: "a month",
      points: ["Everything in Believer", "Priority mark on wishes", "The monthly state of the record, by name", "The congregation room"],
    },
    {
      id: "darshan",
      name: "DARSHAN",
      price: "$99",
      cadence: "a month, waitlist",
      points: ["Everything in Devotee", "One sitting a month", "A signed card on the monthly record", "One urgent petition a month, read at the sitting", "A name in the Book of Darshan"],
    },
  ],
} as const;

export const sermonCopy = {
  title: "THE ARCHIVE",
  locked: "THE ARCHIVE OPENS WITH BELIEVER.",
  empty: "THE FIRST SERMON ARRIVES MONDAY AT 7. THE ALTAR IS KEEPING THE WEEK.",
  write: "WRITE THIS WEEK",
  writing: "THE WEEK IS BEING FOLDED.",
  practice: "PRACTICE",
  signIn: "SIGN IN TO READ THE ARCHIVE",
  missing: "THAT WEEK IS NOT IN THE ARCHIVE.",
  letterKicker: "OPEN LETTER",
  letterLocked: "THE OPEN LETTER IS A BELIEVER'S PAGE.",
  yearly: "THE YEARLY DARSHAN IS NOT OPEN. THE ARCHIVE IS KEEPING THE MONTHS.",
} as const;

export const darshanCopy = {
  title: "DARSHAN",
  intro: "a private screening room. ten minutes if you read slowly. no one else is in the seats.",
  algo: "A SITTING READS THE MONTH BACK. IT DOES NOT DECIDE THE MONTH.",
  locked: "DARSHAN IS A HIGHER SEAT. THE WAITLIST IS THE DOOR.",
  full: "THE MONTH IS FULL. THE WAITLIST KEEPS YOUR PLACE.",
  scheduled: "THE ROOM IS BOOKED.",
  begin: "BEGIN THE SITTING",
  next: "NEXT",
  waiting: "THE ROOM IS DARK UNTIL THE HOUR.",
  card: "A FICTIONAL CARD. NO AUTHORITY IS MOVED.",
  autograph: "pandit ji",
  signIn: "SIGN IN TO ASK FOR A SEAT",
  position: (position: number, count: number) => `PLACE ${position} OF ${count}.`,
  yours: "YOUR SITTINGS",
} as const;

export const ledgerCopy = {
  title: "THE BOOK OF SOULS",
  intro: "public names of the record. no lines. no wishes. a streak is a count of days sat, not a virtue.",
  algo: "THE BOOK LISTS SOULS. IT DOES NOT RANK LIVES.",
  pandit: "acha, a long streak is just a person who came back, beta.",
  empty: "THE BOOK IS OPEN. NO SOUL HAS SAT DOWN YET.",
  darshanEmpty: "NO NAME IS IN THE BOOK OF DARSHAN.",
  book: "THE BOOK OF DARSHAN",
  unnamed: "AN UNNAMED SEAT",
  days: "DAYS KEPT",
  since: "SINCE",
} as const;

export const accountCopy = {
  title: "THE SOUL",
  signIn: "SIGN IN TO BIND THIS SOUL TO AN EMAIL",
  empty: "SIT AT THE ALTAR ONCE, OR SIGN IN.",
  streak: "CURRENT STREAK",
  longest: "LONGEST STREAK",
  seat: "SEAT",
  zone: "TIME ZONE",
  zoneHelp: "Sermons and the morning note use this clock. Monday at 7 in this zone.",
  save: "KEEP THIS",
  name: "NAME",
  nameHelp: "Printed on the sermon and the monthly record from Devotee upward.",
  signOut: "SIGN OUT",
  paid: "THE SEAT IS UPDATED.",
  pastDue: "THE PAYMENT DID NOT CLEAR. THE SEAT HOLDS WHILE THE DESK RETRIES.",
  portal: "MANAGE PAYMENT",
  portalClosed: "THE BILLING DESK IS CLOSED.",
  urgent: "ARM AN URGENT PETITION",
  urgentOn: "THE NEXT FILING IS MARKED URGENT FOR THE SITTING.",
  report: "STATE OF THE RECORD",
  reportLocked: "THE MONTHLY RECORD OPENS WITH DEVOTEE.",
  links: "THE ROOMS",
} as const;

export const roomCopy = {
  title: "THE CONGREGATION",
  locked: "THE ROOM OPENS WITH DEVOTEE.",
  closed: "THE CONGREGATION ROOM IS NOT OPEN YET.",
  enter: "ENTER THE ROOM",
  pandit: "acha, a room is just other people who also sit, beta.",
  algo: "THE ROOM IS NOT A VERDICT.",
} as const;

export const zones = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;
