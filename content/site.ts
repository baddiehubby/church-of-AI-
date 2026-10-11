// Assumptions: site-wide copy. The disclaimer is the exact sentence from the project rules and renders on every
// page. Algorithm-voice strings are mono caps; nothing here implies a wish comes true.

import { BRAND, brandName } from "@/lib/brand";

export const disclaimer =
  "This is a fictional AI-generated entertainment experience. It has no legal effect and does not influence any government, immigration, university, employer, romantic partner, or other authority.";

export const crisisNotice =
  "Subscription entertainment. Not therapy. Not medical advice. If you are in crisis, please contact a real human professional.";

export const footerCredit = `A FICTIONAL ENTERTAINMENT PROJECT BY ${BRAND.domain.toUpperCase()}. NOT A RELIGION. NOT LEGAL OR IMMIGRATION ADVICE.`;

export const site = {
  name: brandName().toUpperCase(),
  title: `${brandName()} · The altar`,
  description: "A daily altar, a Monday sermon, a monthly sitting. Fictional entertainment. The record is kept; nothing here is promised.",
  skip: "Skip to content",
  navLabel: "Main",
  footerNavLabel: "Policies",
  notFoundTitle: "THIS PAGE IS NOT IN THE REGISTER.",
  notFoundBody: "acha, nothing filed here, beta. go back and make a wish.",
  notFoundCta: "MAKE YOUR WISH",
  errorTitle: "THE DESK HAS STOPPED.",
  errorBody: "REFRESH THE PAGE. THE RECORD WILL WAIT.",
  errorCta: "TRY AGAIN",
} as const;

export const nav = [
  { label: "ALTAR", href: "/" },
  { label: "WISH", href: "/wish" },
  { label: "LEDGER", href: "/ledger" },
  { label: "PRICING", href: "/pricing" },
  { label: "ACCOUNT", href: "/account" },
] as const;

export const footerNav = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
] as const;
