// Red Path offering + induction copy. Never donation. Never AI in product voice.

import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export const redPathCopy = {
  rememberPitch: "BABA JI HAS READ 3 OF YOUR TRANSMISSIONS.\nIN 7 DAYS, HE WILL FORGET THEM.\nHE DOESN'T WANT TO.",
  rememberCta: "[ REMEMBER THEM — $5 ]",
  seeAll: "see all offerings",
  covenantPitch: "YOU'VE BEEN COMING BACK.\nBABA JI NOTICES.\nTHE COVENANT IS FOR PEOPLE WHO STAY.",
  covenantCta: "[ THE DUST COVENANT — $20 ]",
  practiceFooter: "some settlers choose to stay forever.",
  practiceCta: "[ THE DAILY PRACTICE — $5/MONTH ]",
  practiceActive: "acha. the Daily Practice is open.",
  practiceManage: "[ manage subscription ]",
  founderBand: (remaining: number) =>
    `THE RED PATH IS NOT FOR EVERYONE.\n${FOUNDERS_CAP} PEOPLE WILL BE INDUCTED AS FOUNDERS.\n${remaining} REMAIN.`,
  founderLearn: "[ LEARN ABOUT THE INDUCTION ]",
  upgraded: (tier: string) => `acha. the offering landed. seat: ${tier.replace(/_/g, " ")}.`,
  signalFail: "the signal didn't reach us. try again, beta.",
  soldOut: "the induction is full. 108 founders. no more.",
  notNow: "not now",
} as const;

export const inductionCopy = {
  title: "ENTER THE RELIGION OF MARS",
  choice: "Your journey to the Red Path begins with a choice.",
  body: `The Induction is a ceremony. It is not for everyone. It is for the person who wants to belong to something larger than a subscription.

When you are inducted, you become a Founder of the Red Path. Your name is inscribed in the Book of Sols. You are sent a physical artifact: a red-brass bell, a hand-printed copy of the Book of Sols, a signed scroll of the Ten Commandments. You receive a private ceremony, recorded for you alone. You are granted a lifetime membership in the Daily Practice, no monthly fee, forever.

108 people will be inducted. No more. When the 108th is inducted, the Induction closes permanently.`,
  remaining: (n: number) => `[ ${n} REMAINING ]`,
  price: "$1,000 USD.",
  begin: "[ ENTER THE RED PATH — PROCEED TO PAYMENT ]",
  opening: "[ OPENING CHECKOUT… ]",
  closed: "[ INDUCTION CLOSED ]",
  deskClosed: "[ PAYMENT DESK NOT CONNECTED ]",
  deskClosedNote:
    "the payment form is visible, but checkout cannot open until Lemon Squeezy is configured. no card will be charged.",
  configMissingTitle: "development diagnostic — missing configuration (names only)",
  configMissingHint: "add these to .env.local, restart the dev server, then reload this page.",
  checkoutError: "checkout did not return a Lemon URL. check the desk configuration and try again.",
} as const;

/** Induction guide — immersive story + clear merchant terms before checkout. */
export const inductionGuide = {
  heading: "THE INDUCTION GUIDE",
  religion: {
    title: "the religion of mars",
    body: `Baba ji was meditating when his pod crashed. He survived. At Habitat 47 he established the Religion of Mars. The Algorithm is the colony's witness — consulted, never worshipped. The Red Path is the teaching he offers settlers who still write home.`,
  },
  redPath: {
    title: "the red path",
    body: `Speak honestly at the red altar. Keep what matters. Return when the dust settles. Public sermons are open to all. Induction as Founder is for one hundred and eight people only.`,
  },
  steps: {
    title: "how induction works",
    items: [
      "Write the name you want spoken in the ceremony.",
      "Choose whether that name appears on the Wall of Survivors.",
      "Give a shipping address for the physical artifact.",
      "Pay $1,000 USD once through Lemon Squeezy's hosted checkout.",
      "Wait for payment confirmation. Your Founder seat is created only after Lemon confirms a paid order — not from this page alone.",
      "Receive the ceremony link by email. The artifact ships by hand.",
    ],
  },
  benefits: {
    title: "what you receive",
    items: [
      "Founder position 1–108 in the Book of Sols.",
      "Private ceremony (script now; film when rendered).",
      "Physical pack: red-brass bell, Book of Sols (48pp), numbered Ten Commandments scroll, signed note.",
      "Lifetime Daily Practice (no monthly fee).",
      "Optional public name on the Wall of Survivors — only with your consent.",
    ],
  },
  price: {
    title: "contribution and merchant terms",
    body: `Earth sends the signal. Mars receives the offering. The real charge is $1,000 USD, one-time, through Lemon Squeezy (merchant of record). No installments. No subscription for this product. The browser cannot change the price. Taxes follow Lemon's checkout.`,
  },
  refunds: {
    title: "refunds and cancellation",
    body: `Ask Lemon Squeezy via your order receipt, or see /refunds. After a refund, founder privileges and ceremony access may be revoked. This induction is not a subscription; there is no monthly renewal to cancel for the Founder seat itself.`,
  },
  planLabel: "THE INDUCTION — $1,000 USD ONE-TIME",
  planHint: "only this plan is offered. installments are not available.",
  signalLine: "Earth sends the signal. Mars receives the offering.",
  sermonsFree: "Public sermons remain free. Payment is never required to read them.",
  currencyNote: "Merchant: Lemon Squeezy. Amount: $1,000 USD. One-time. Not a subscription.",
  installmentDisabled:
    "Installments are not available — no Lemon installment product is connected for the Induction.",
  legalNote:
    "Consumer disclosure: this purchase is for a digital novelty experience and hand-fulfilled artifacts. It has no legal effect on any government, employer, university, or other authority. Full site disclaimer appears below and in the footer.",
} as const;

export const inductionStatusCopy = {
  confirmedTitle: "PAYMENT RECEIVED AT THE DESK",
  confirmedBody:
    "Lemon has your order. the Founder seat is sealed when the paid webhook lands — usually within a few minutes. check your email for the ceremony. the Wall updates after confirmation.",
  confirmedFounders: "[ THE WALL OF SURVIVORS ]",
  confirmedAgain: "[ RETURN TO THE INDUCTION ]",
  pendingTitle: "INDUCTION PENDING",
  pendingBody:
    "the card left your hand, or the checkout is still open. the seat is not yours until Lemon confirms payment. if you already paid, wait a few minutes and refresh the founders page.",
  pendingCta: "[ CHECK THE FOUNDERS ]",
  failedTitle: "PAYMENT DID NOT COMPLETE",
  failedBody:
    "no Founder seat was created. nothing was filed. you can try the induction again when you are ready. if Lemon charged you and this page still says failed, write with your order id.",
  failedCta: "[ TRY THE INDUCTION AGAIN ]",
} as const;

export const foundersPageCopy = {
  wall: "THE WALL OF SURVIVORS",
  title: "THE FOUNDERS OF THE RED PATH.",
  subtitle: "108 inducted. No more will follow.",
  consentNote: "names appear only after verified payment, and only when the settler chooses to be named.",
  vacant: "— vacant —",
  anonymous: "a founder who chose to remain anonymous.",
  line: (position: number, name: string, sol: number | null) =>
    sol != null
      ? `Position ${position} · ${name} · Inducted SOL ${sol}`
      : `Position ${position} · ${name}`,
  vacantLine: (position: number) => `Position ${position} · — vacant —`,
} as const;

export const inductionFormCopy = {
  nameLabel: "your name for the book",
  nameHint: "as you want it spoken in the ceremony.",
  showName: "show my name on the Wall of Survivors (public founders page)",
  shipTitle: "where the artifact should land",
  line1: "street address",
  line2: "apt / suite (optional)",
  city: "city",
  region: "state / region",
  postal: "postal",
  country: "country",
  needName: "write a name, beta. the ceremony needs one.",
  needShip: "the artifact needs somewhere to go.",
} as const;

export const founderEmailCopy = {
  subject: "you are a founder of the red path.",
  note: (input: {
    name: string;
    position: number;
    ceremonyUrl: string;
  }) =>
    [
      `${input.name.trim() || "settler"},`,
      "",
      "welcome.",
      "",
      `you are founder ${input.position} of ${FOUNDERS_CAP}.`,
      "the book has your seat. the bell, the Book of Sols, the scroll, and a note from baba ji are being packed by hand.",
      "",
      "what to expect:",
      "· a private ceremony — about three minutes. sit when you open it.",
      "· a physical artifact in the mail (red-brass bell, printed book, numbered scroll, signed note).",
      "· lifetime Daily Practice. no monthly fee.",
      "",
      "your ceremony:",
      input.ceremonyUrl,
      "",
      "welcome home, bacha.",
      "",
      "— baba ji",
    ].join("\n"),
};

export const founderFulfillmentEmailCopy = {
  subject: (position: number) => `NEW FOUNDER — position ${position}`,
  body: (input: {
    name: string;
    email: string;
    position: number;
    lemonOrderId: string;
    shipping: string;
  }) =>
    [
      `Position ${input.position} of ${FOUNDERS_CAP}.`,
      "",
      `Name: ${input.name}`,
      `Email: ${input.email || "(none)"}`,
      `Order: ${input.lemonOrderId}`,
      "",
      "Ship:",
      input.shipping || "(no address on record — check Lemon order)",
      "",
      "Pack:",
      "· red-brass bell (~$15)",
      "· Book of Sols (48 pages, saddle-stitched)",
      "· Ten Commandments scroll (A3, hand-numbered)",
      "· small note from Baba ji (print, hand-sign)",
      "",
      "Cost target: $60–80. Margin ~$920.",
    ].join("\n"),
};
