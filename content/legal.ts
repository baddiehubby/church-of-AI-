// Assumptions: plain-English policy pages so Lemon Squeezy store review can find Terms, Privacy, and Refunds.
// Not legal advice; the operator should have these reviewed before launch.

import { BRAND, brandName, mailbox } from "@/lib/brand";

export type LegalPage = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  sections: readonly { heading: string; body: string }[];
};

const hello = mailbox("hello");

export const terms: LegalPage = {
  metaTitle: "Terms",
  metaDescription: "Fictional AI-generated entertainment. No legal effect. Not immigration advice.",
  title: "TERMS",
  sections: [
    {
      heading: "What this is",
      body: `${brandName()} (${BRAND.domain}) is a fictional, AI-generated entertainment experience. You write a wish and receive an AI-generated reading. Nothing here predicts, promises, or influences any outcome. It is not a religious service.`,
    },
    {
      heading: "Visa wishes",
      body: "Sacha Pandit cannot issue visas, influence immigration decisions, or guarantee visa approval. A visa wish purchase does not include a visa application, immigration advice, or contact with any government. Do not share passport numbers, application numbers, or documents.",
    },
    {
      heading: "What you buy",
      body: "Three separate digital entertainment products. (1) A blessing / offering: a one-time tip for a petition certificate, minimum $10 USD (up to $500). Not a subscription. On visa categories the primary $10 payment is this blessing. (2) A Visa Wish Certificate: $10 one-time for a reading and certificate, when that product is connected. (3) Sacha Pandit Premium: $10 per month for a private journal, daily guidance, follow-ups, shareable cards, and hologram access where supported. Lemon Squeezy is the merchant of record. Purchases are never combined. None of these make a wish come true or influence any authority.",
    },
    {
      heading: "Premium billing",
      body: "Premium renews every month at $10 USD until you cancel in the Lemon Squeezy customer portal (link in your receipt email). After you cancel, access continues until the paid period ends. Refunds follow Lemon Squeezy policy for digital subscriptions.",
    },
    {
      heading: "Free readings",
      body: "Free readings are public records at their own link. Do not write anything private in a free wish. We may remove content that is abusive, impersonates someone, or breaks the law.",
    },
    { heading: "Age", body: "You must be 13 or older. If you are under 18, a parent or guardian must agree." },
    { heading: "Contact", body: `Questions: ${hello}` },
  ],
};

export const privacy: LegalPage = {
  metaTitle: "Privacy",
  metaDescription: "What the desk stores and how to ask for deletion.",
  title: "PRIVACY",
  sections: [
    {
      heading: "What we store",
      body: "Free wishes: the wish text, category, and the generated reading. Visa wishes: category, destination, wish text, optional first name, the generated reading, payment status, and the Lemon Squeezy order id. Certificates: the name you enter and the order id. Premium: your email for sign-in, saved journal wishes and readings, optional goals, share-card summaries, and subscription status. We never ask for passport numbers or visa application numbers.",
    },
    {
      heading: "What is public",
      body: "Free readings are public at their link. A visa wish is private to whoever holds its link; if you share it, the shared view shows your first name, category, destination, and reading, but not your wish text. Premium journal entries are private. A shareable card is created only when you ask, and it shows a short reflection by default, not the full wish.",
    },
    {
      heading: "Who processes it",
      body: "Lemon Squeezy (payments), Supabase (database), an AI provider (to write the reading), Resend (certificate email), and our host. We do not sell your data and we do not run ad trackers. We never ask for or store card details, passport numbers, or documents.",
    },
    {
      heading: "Premium journal deletion",
      body: "While signed in you can delete an individual journal entry from its page. To delete your whole Premium history, email us from the address you signed in with.",
    },
    { heading: "Deletion", body: `Email ${hello} with your link, reference, or sign-in email to have it removed.` },
  ],
};

export const refunds: LegalPage = {
  metaTitle: "Refunds",
  metaDescription: "Refunds follow Lemon Squeezy policy.",
  title: "REFUNDS",
  sections: [
    {
      heading: "The short version",
      body: "Refunds follow Lemon Squeezy's refund policy for digital goods.",
    },
    {
      heading: "How to ask",
      body: `Reply to your Lemon Squeezy order or subscription email, or write to ${hello}. When a visa wish is refunded, its reading and certificate are no longer available at its link. When Premium is cancelled or expires, journal, daily guidance, and follow-ups stop at the end of the paid period.`,
    },
  ],
};
