import type { Metadata } from "next";

import { InductionStatusPage } from "@/components/InductionStatusPage";

export const metadata: Metadata = {
  title: "Induction payment failed",
  robots: { index: false, follow: false },
};

export default function InductionFailedPage() {
  return <InductionStatusPage kind="failed" />;
}
