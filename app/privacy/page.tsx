// Assumptions: static policy page linked from the footer for Lemon Squeezy store review.

import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { privacy } from "@/content/legal";

export const metadata: Metadata = { title: privacy.metaTitle };

export default function PrivacyPage() {
  return <LegalPage page={privacy} />;
}
