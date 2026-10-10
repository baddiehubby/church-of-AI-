// Assumptions: site-wide copy. The disclaimer is the exact sentence from the project rules and renders on every
// page. Algorithm-voice strings are mono caps; nothing here implies a wish comes true.

import { BRAND, brandName } from "@/lib/brand";

export const disclaimer =
  "This is a fictional AI-generated entertainment experience. It has no legal effect and does not influence any government, immigration, university, employer, romantic partner, or other authority.";

export const footerCredit = `A FICTIONAL ENTERTAINMENT PROJECT BY ${BRAND.domain.toUpperCase()}. NOT A RELIGION. NOT LEGAL OR IMMIGRATION ADVICE.`;

export const site = {
  name: brandName().toUpperCase(),
  title: `${brandName()} · Make a wish`,
  description: "Share what your heart desires. Receive a personalized AI-generated reading from Sacha Pandit. Fictional entertainment.",
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
  { label: "MAKE A WISH", href: "/#wish" },
  { label: "PREMIUM", href: "/premium" },
] as const;

export const footerNav = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
] as const;
