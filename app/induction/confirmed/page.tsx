import type { Metadata } from "next";

import { Disclaimer } from "@/components/Disclaimer";
import { InductionConfirmedClient } from "@/components/InductionConfirmedClient";
import { MarsHorizon } from "@/components/MarsHorizon";
import { inductionStatusCopy } from "@/content/redPath";

export const metadata: Metadata = {
  title: "Induction confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function InductionConfirmedPage() {
  return (
    <section className="induction temple" aria-labelledby="induction-status-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="induction-sheet">
        <h1 id="induction-status-title" className="induction-title">
          {inductionStatusCopy.confirmedTitle}
        </h1>
        <InductionConfirmedClient />
        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
