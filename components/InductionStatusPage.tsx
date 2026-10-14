import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { inductionStatusCopy } from "@/content/redPath";

type StatusKind = "confirmed" | "pending" | "failed";

const COPY: Record<
  StatusKind,
  { title: string; body: string; primaryHref: string; primaryLabel: string; secondaryHref?: string; secondaryLabel?: string }
> = {
  confirmed: {
    title: inductionStatusCopy.confirmedTitle,
    body: inductionStatusCopy.confirmedBody,
    primaryHref: "/founders?inducted=1",
    primaryLabel: inductionStatusCopy.confirmedFounders,
    secondaryHref: "/induction",
    secondaryLabel: inductionStatusCopy.confirmedAgain,
  },
  pending: {
    title: inductionStatusCopy.pendingTitle,
    body: inductionStatusCopy.pendingBody,
    primaryHref: "/founders",
    primaryLabel: inductionStatusCopy.pendingCta,
    secondaryHref: "/induction",
    secondaryLabel: inductionStatusCopy.failedCta,
  },
  failed: {
    title: inductionStatusCopy.failedTitle,
    body: inductionStatusCopy.failedBody,
    primaryHref: "/induction",
    primaryLabel: inductionStatusCopy.failedCta,
    secondaryHref: "/refunds",
    secondaryLabel: "[ REFUNDS ]",
  },
};

export function InductionStatusPage({ kind }: { kind: StatusKind }) {
  const copy = COPY[kind];
  return (
    <section className="induction temple" aria-labelledby="induction-status-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="induction-sheet">
        <h1 id="induction-status-title" className="induction-title">
          {copy.title}
        </h1>
        <p className="induction-status-body">{copy.body}</p>
        <Link href={copy.primaryHref} className="induction-begin">
          {copy.primaryLabel}
        </Link>
        {copy.secondaryHref && copy.secondaryLabel ? (
          <Link href={copy.secondaryHref} className="archive-back">
            {copy.secondaryLabel}
          </Link>
        ) : null}
        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
