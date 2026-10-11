// Assumptions: plain-English policy pages so Lemon Squeezy store review can find Terms, Privacy, and Refunds.
// Not legal advice; the operator should have these reviewed before launch. Never a charity; offerings are
// payments for digital novelty artifacts. The exact site disclaimer is rendered by Disclaimer on each page.

import { disclaimer } from "@/content/site";
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
  metaDescription: "Fictional AI-generated entertainment. No legal effect. Not a charity. Not immigration advice.",
  title: "TERMS",
  sections: [
    {
      heading: "What this is",
      body: `${brandName()} (${BRAND.domain}) is a fictional, AI-generated entertainment project. You write a wish and receive an AI-generated reading, and you may buy a digital novelty artifact (a certificate, slip, or journal access). Nothing here predicts, promises, or influences any outcome. It is not a religion, not a temple, and not a religious service.`,
    },
    {
      heading: "Not a charity",
      body: `${brandName()} is not a charity, not a nonprofit, and not a religious institution. Offerings, tithes, and other payments are commercial payments for digital novelty artifacts. They are not tax-deductible. A payment does not support a cause, a temple, or a public-benefit program.`,
    },
    {
      heading: "No legal effect",
      body: "Nothing on this site has legal effect. A reading, certificate, blessing, offering, visa wish, or Premium subscription does not influence any government, immigration authority, university, employer, romantic partner, court, or other authority. Do not treat a status line, probability, or certificate as a decision about your life.",
    },
    {
      heading: "What you buy",
      body: "Lemon Squeezy is the merchant of record. A pay-what-you-want offering, minimum $10 USD (up to $500), buys a petition certificate, and a $10 Visa Wish Certificate when that product is connected. Subscription entertainment is also billed by Lemon Squeezy: Pilgrim is free (one daily pooja, one wish a week); Believer is $9 a month after a seven-day trial (unlimited poojas, a weekly sermon, the archive, the monthly open letter); Devotee is $29 a month (Believer, plus a priority mark, a monthly record by name, and the congregation room); Darshan is $99 a month when that product is connected (Devotee, plus one monthly sitting). An earlier Premium journal at $10 a month may still renew for people who already have it. None of these make a wish come true.",
    },
    {
      heading: "Visa wishes",
      body: "Sacha Pandit cannot issue visas, influence immigration decisions, or guarantee any visa outcome. A visa wish purchase does not include a visa application, immigration advice, or contact with any government. Do not share passport numbers, application numbers, or documents.",
    },
    {
      heading: "Premium billing",
      body: "Believer, Devotee, and Darshan renew every month through Lemon Squeezy until you cancel in the Lemon Squeezy customer portal from your account page. A change of seat is billed on the new variant. A failed payment is retried by Lemon Squeezy; the seat holds while it does. After you cancel, access continues until the paid period ends. The seven-day Believer trial is set on that product. One-time certificates are separate Lemon Squeezy orders. The earlier Premium journal, if you still have one, still renews through Lemon Squeezy.",
    },
    {
      heading: "Free readings",
      body: "Free readings are public records at their own link. Do not write anything private in a free wish. We may remove content that is abusive, impersonates someone, or breaks the law.",
    },
    { heading: "Age", body: "You must be 13 or older. If you are under 18, a parent or guardian must agree." },
    { heading: "Contact", body: `Questions: ${hello}` },
    { heading: "Disclaimer", body: disclaimer },
  ],
};

export const privacy: LegalPage = {
  metaTitle: "Privacy",
  metaDescription: "What the desk stores and how to ask for deletion. Fictional entertainment; not a charity.",
  title: "PRIVACY",
  sections: [
    {
      heading: "Who we are",
      body: `${brandName()} is a fictional entertainment project. It is not a charity. Payments you make are for digital novelty artifacts and are not tax-deductible. This page explains what we store so you can decide what to write.`,
    },
    {
      heading: "What we store",
      body: "Free wishes: the wish text, category, and the generated reading. Daily poojas: one line or a mood, the two replies, and a streak. Sermons and sittings: the letter written from those lines. Visa wishes: category, destination, wish text, optional first name, the generated reading, payment status, and the Lemon Squeezy order id. Certificates: the name you enter and the order id. Account: your email, optional name, time zone, Soul ID, and the Lemon Squeezy subscription id. We never ask for passport numbers, visa application numbers, or card numbers.",
    },
    {
      heading: "What is public",
      body: "Free readings are public at their link. A visa wish is private to whoever holds its link; if you share it, the shared view shows your first name, category, destination, and reading, but not your wish text. Premium journal entries are private. A shareable card is created only when you ask, and it shows a short reflection by default, not the full wish.",
    },
    {
      heading: "Who processes it",
      body: "Lemon Squeezy (subscriptions and one-time certificates; they are the merchant of record and see checkout details; we store an order id or subscription id, never a card number), Supabase (database), an AI provider (to write a reading), Resend (sermon, reminder, certificate, or sign-in email), Upstash (rate limits; hashed IP only), Sentry (errors; identifiers only, never the wish or your email), and our host (Vercel). We do not sell your data and we do not run ad trackers. We never ask for or store card details, passport numbers, or documents.",
    },
    {
      heading: "Premium journal deletion",
      body: "While signed in you can delete an individual journal entry from its page. To delete your whole Premium history, email us from the address you signed in with.",
    },
    { heading: "Deletion", body: `Email ${hello} with your link, reference, or sign-in email to have it removed.` },
    {
      heading: "No legal effect",
      body: "Stored readings and certificates have no legal effect on any real-world outcome. They do not influence any government, immigration authority, university, employer, or other authority.",
    },
    { heading: "Disclaimer", body: disclaimer },
  ],
};

export const refunds: LegalPage = {
  metaTitle: "Refunds",
  metaDescription: "An online mandir located on Mars. Payments are for digital novelty artifacts, not a charity.",
  title: "REFUNDS",
  sections: [
    {
      heading: "The short version",
      body: "This is an online mandir located on Mars.",
    },
    {
      heading: "What you paid for",
      body: "An offering, blessing, Visa Wish Certificate, or Premium subscription is a payment for a digital novelty artifact (a reading, certificate, slip, or journal access). It is not charity, not tax-deductible, and not a fee for a real-world result. A refund does not mean a wish failed or succeeded; nothing here has legal effect on any real-world outcome.",
    },
    {
      heading: "How to ask",
      body: `Reply to your Lemon Squeezy order or subscription email, or write to ${hello}. Include the order id from your receipt if you have it. Lemon Squeezy reviews digital-goods refunds under its current policy.`,
    },
    {
      heading: "After a refund or cancel",
      body: "When a visa wish is refunded, its reading and certificate are no longer available at its link. When a petition offering is refunded, the slip may remain on file as a record of a reversed payment; it still does not fulfill a wish. When Premium is cancelled or expires, journal, daily guidance, and follow-ups stop at the end of the paid period.",
    },
    {
      heading: "Subscriptions",
      body: "Cancel a seat any time from the account page, which opens the Lemon Squeezy customer portal. Cancel stops future renewals. It does not by itself refund time already paid unless Lemon Squeezy's policy says so. A change of seat is billed on the new variant. One-time certificates are separate orders. An earlier Premium journal, if you still have one, is cancelled in the same portal.",
    },
    { heading: "Disclaimer", body: disclaimer },
  ],
};
