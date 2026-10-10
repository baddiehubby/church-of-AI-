// Assumptions: static policy page linked from the footer for Lemon Squeezy store review.

import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { terms } from "@/content/legal";

export const metadata: Metadata = { title: terms.metaTitle };

export default function TermsPage() {
  return <LegalPage page={terms} />;
}
