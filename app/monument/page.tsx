import type { Metadata } from "next";
import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { offeringsCopy, offeringTiers } from "@/content/offerings";
import { listPublishedMonument } from "@/lib/blessingsStore";
import { marsDeskReady } from "@/lib/marsOfferings";

export const metadata: Metadata = {
  title: "Founder Monument",
  description: offeringTiers.founder_engraving.blurb,
};

export const dynamic = "force-dynamic";

export default async function FounderMonumentPage() {
  const entries = await listPublishedMonument();
  const deskOpen = marsDeskReady("founder_engraving");
  const engraving = offeringTiers.founder_engraving;

  return (
    <section className="founders temple monument" aria-labelledby="monument-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="founders-sheet">
        <p className="founders-wall">MONUMENT</p>
        <h1 id="monument-title" className="founders-title">
          {offeringsCopy.monumentTitle}
        </h1>
        <p className="induction-price">{offeringsCopy.monumentPremium}</p>
        <p className="founders-subtitle">{engraving.blurb}</p>
        <div className="induction-guide-block">
          <h2 className="induction-guide-sub">what engraving includes</h2>
          <ul className="induction-guide-list">
            <li>Your chosen display name on this Founder monument page after verified payment.</li>
            <li>Moderation before publication — blocked or invalid names stay held, never invented as live.</li>
            <li>An order confirmation record at Habitat 47.</li>
            <li>Distinct from the Wall of Mars ($20) and from Patrons of Mars ($50).</li>
            <li>Distinct from Red Path Induction seats on the Wall of Survivors.</li>
          </ul>
        </div>
        {entries.length === 0 ? (
          <p className="ritual-opening">{offeringsCopy.monumentEmpty}</p>
        ) : (
          <ol className="founders-list">
            {entries.map((entry, index) => (
              <li key={entry.id} className="is-filled">
                #{index + 1} · {entry.displayName} · Sol {entry.sol}
              </li>
            ))}
          </ol>
        )}
        <div className="founders-nav">
          {deskOpen ? (
            <Link href="/offerings" className="archive-back">
              {engraving.cta}
            </Link>
          ) : (
            <p className="temple-note">{offeringsCopy.deskClosed}</p>
          )}
          <Link href="/wall" className="archive-back">
            WALL OF MARS
          </Link>
          <Link href="/offerings" className="archive-back">
            ALL OFFERINGS
          </Link>
        </div>
        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}