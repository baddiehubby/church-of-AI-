// Religion of Mars paid offerings. Baba ji receives. Never promise supernatural results.
// Prices are catalog truth for the app; Lemon variants must match. Client never sets amount.

export type OfferingTier = "prayer" | "wall" | "wish" | "patron" | "founder_engraving";

export const offeringsCopy = {
  pageTitle: "OFFERINGS FROM EARTH",
  pageLede:
    "Five one-time signals. Lemon Squeezy is merchant of record. Benefits unlock only after a paid webhook confirms the order.",
  deskClosed: "THE OFFERING DESK IS NOT OPEN.",
  deskClosedHint:
    "checkout stays closed until Lemon API key, store id, and this tier's variant id are configured.",
  nameLabel: "display name",
  namePlaceholder: "a name for mars",
  prayerLabel: "prayer text",
  prayerPlaceholder: "write a prayer addressed toward mars",
  wishLabel: "wish for the ritual",
  wishPlaceholder: "a personal wish for the symbolic ritual",
  needName: "a display name is required for this offering.",
  needMessage: "write the prayer or wish text before opening checkout.",
  opening: "[ OPENING CHECKOUT… ]",
  checkoutError: "checkout did not return a Lemon URL. try again when the desk is connected.",
  successLine: "acha. the order is confirmed on mars.",
  waiting: "WAITING FOR LEMON TO CONFIRM PAYMENT.",
  waitingBody:
    "the desk does not invent success. refresh after checkout completes. membership and wall names appear only when Lemon reports paid.",
  remembers: "the temple remembers. — Baba ji",
  returnTemple: "[ return to the world ]",
  patronsTitle: "PATRONS OF MARS",
  patronsEmpty: "no patrons are listed yet. names appear only after verified payment.",
  patronsBlurb:
    "Patron recognition is separate from the Wall of Mars and from the Founder monument. A short credit, not a wall plaque.",
  wallTitle: "THE WALL OF MARS",
  wallEmpty: "the wall is empty. names appear only after verified payment and moderation.",
  wallBlurb:
    "A chosen display name, published after Lemon confirms payment and the name passes moderation. Not the Founder monument. Not the patrons list.",
  monumentTitle: "THE FOUNDER MONUMENT",
  monumentEmpty: "no engravings yet. names appear only after verified $1,000 payment and moderation.",
  monumentPremium: "FOUNDER NAME ENGRAVING — $1,000 USD",
  cardTitle: "ORDER CONFIRMATION",
  savePng: "[ save PNG ]",
  copyLink: "[ copy link ]",
  share: "[ share ]",
  copied: "link copied",
  saved: "card saved",
} as const;

export const offeringTiers: Record<
  OfferingTier,
  {
    label: string;
    dollars: string;
    amountCents: number;
    blurb: string;
    lemonName: string;
    cta: string;
    requiresMessage: boolean;
    requiresName: boolean;
    premium?: boolean;
  }
> = {
  prayer: {
    label: "SEND A PRAYER TO MARS",
    dollars: "$10",
    amountCents: 1000,
    blurb:
      "Your prayer is filed at Habitat 47 and held in the order record. A confirmation after Lemon confirms payment. Symbolic. No claim that anyone on Earth will answer.",
    lemonName: "Send a Prayer to Mars",
    cta: "[ SEND A PRAYER — $10 ]",
    requiresMessage: true,
    requiresName: false,
  },
  wall: {
    label: "WALL OF MARS",
    dollars: "$20",
    amountCents: 2000,
    blurb:
      "Add a chosen display name to the Wall of Mars after verified payment and moderation. Distinct from patrons and from the Founder monument.",
    lemonName: "Wall of Mars Name",
    cta: "[ ADD MY NAME TO THE WALL — $20 ]",
    requiresMessage: false,
    requiresName: true,
  },
  wish: {
    label: "PERSONAL WISH RITUAL",
    dollars: "$25",
    amountCents: 2500,
    blurb:
      "A personal wish ritual — a symbolic blessing recorded for you. Entertainment only. It does not promise supernatural results or any guaranteed real-world outcome.",
    lemonName: "Personal Wish Ritual",
    cta: "[ BEGIN THE WISH RITUAL — $25 ]",
    requiresMessage: true,
    requiresName: true,
  },
  patron: {
    label: "PATRON OF MARS",
    dollars: "$50",
    amountCents: 5000,
    blurb:
      "Patron recognition on the Patrons of Mars list. Distinct from Wall of Mars listings and from Founder engraving.",
    lemonName: "Patron of Mars",
    cta: "[ BECOME A PATRON — $50 ]",
    requiresMessage: false,
    requiresName: true,
  },
  founder_engraving: {
    label: "FOUNDER NAME ENGRAVING",
    dollars: "$1,000",
    amountCents: 100_000,
    blurb:
      "Premium Founder engraving on the dedicated monument: your chosen display name carved into the Founder register, a permanent monument credit, and a confirmation record. Engraving means the moderated name is inscribed on the monument page after Lemon confirms the $1,000 payment — not a physical stone unless separately fulfilled by the operator.",
    lemonName: "Founder Name Engraving",
    cta: "[ ENGRAVE MY NAME — $1,000 ]",
    requiresMessage: false,
    requiresName: true,
    premium: true,
  },
};

/** Lemon dashboard reviewer copy. Not settler-facing product voice. */
export const lemonReviewerBlurb =
  "A digital novelty artifact from a fictional Mars colony entertainment project. Instant confirmation page after payment. Not charity. Not tax-deductible. Not a real religious sacrament.";
