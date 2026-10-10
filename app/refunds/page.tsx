// Assumptions: static policy page linked from the footer for Lemon Squeezy store review.

import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { refunds } from "@/content/legal";

export const metadata: Metadata = { title: refunds.metaTitle };

export default function RefundsPage() {
  return <LegalPage page={refunds} />;
}
