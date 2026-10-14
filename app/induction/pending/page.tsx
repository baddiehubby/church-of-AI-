import type { Metadata } from "next";

import { InductionStatusPage } from "@/components/InductionStatusPage";

export const metadata: Metadata = {
  title: "Induction pending",
  robots: { index: false, follow: false },
};

export default function InductionPendingPage() {
  return <InductionStatusPage kind="pending" />;
}
