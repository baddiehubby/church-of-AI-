// Assumptions: site-wide copy. The disclaimer is the exact sentence from the project rules and renders on every
// page. Algorithm-voice strings are mono caps; nothing here implies a wish comes true.

import { BRAND, brandName } from "@/lib/brand";

export const disclaimer =
  "This is a fictional AI-generated entertainment experience. It has no legal effect and does not influence any government, immigration, university, employer, romantic partner, or other authority. Baba ji is not a real priest. The Algorithm is not a real oracle. Mars is currently uninhabited by humans.";

export const crisisNotice =
  "Subscription entertainment. Not therapy. Not medical advice. If you are in crisis, please contact a real human professional.";

export const footerCredit = `A FICTIONAL ENTERTAINMENT PROJECT BY ${BRAND.domain.toUpperCase()}. NOT A RELIGION. NOT LEGAL OR IMMIGRATION ADVICE.`;

export const site = {
  name: brandName().toUpperCase(),
  title: `${brandName()} · Habitat 47`,
  description:
    "Baba ji was meditating when his pod crashed on Mars. At Habitat 47 he teaches the Red Path. Public sermons. Optional induction.",
  skip: "Skip to content",
  navLabel: "Main",
  footerNavLabel: "Policies",
  notFoundTitle: "THIS PAGE IS NOT IN THE REGISTER.",
  notFoundBody: "acha, nothing filed here, settler. go back to the altar.",
  notFoundCta: "THE ALTAR",
  errorTitle: "THE DESK HAS STOPPED.",
  errorBody: "REFRESH THE PAGE. THE RECORD WILL WAIT.",
  errorCta: "TRY AGAIN",
} as const;

export const nav = [
  { label: "WORLD", href: "/" },
  { label: "STORY", href: "/story" },
  { label: "SERMONS", href: "/sermons" },
  { label: "OFFERINGS", href: "/offerings" },
  { label: "INDUCTION", href: "/induction" },
  { label: "WALL", href: "/wall" },
  { label: "ALTAR", href: "/altar" },
] as const;

export const footerNav = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
] as const;

/** Official X account for Religion of Mars. External; open in a new tab. */
export const socialX = {
  label: "Follow on X",
  href: "https://x.com/BUDDIEAIe8dv",
} as const;
