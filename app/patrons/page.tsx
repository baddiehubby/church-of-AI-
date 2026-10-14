import type { Metadata } from "next";
import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { PatronOffer } from "@/components/PatronOffer";
import { offeringsCopy } from "@/content/offerings";
import { listPatrons } from "@/lib/blessingsStore";
import { marsDeskReady } from "@/lib/marsOfferings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patrons of Mars",
  description: offeringsCopy.patronsBlurb,
};

export default async function PatronsPage() {
  const year = new Date().getFullYear();
  const patrons = await listPatrons(year);
  const patronDesk = marsDeskReady("patron");

  return (
    <section className="temple patrons-page">
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="patrons-stage">
        <p className="temple-bar">{offeringsCopy.patronsTitle}</p>
        <p className="founders-subtitle">{offeringsCopy.patronsBlurb}</p>
        <ul className="patrons-list">
          {patrons.map((patron) => (
            <li key={`${patron.displayName}-${patron.sol}-${patron.year}`}>
              <p className="patrons-name">{patron.displayName}</p>
              <p className="patrons-line">Patron of Mars · Sol {patron.sol}</p>
            </li>
          ))}
        </ul>
        {patrons.length === 0 ? <p className="ritual-opening">{offeringsCopy.patronsEmpty}</p> : null}
        {patronDesk ? <PatronOffer /> : <p className="temple-note">{offeringsCopy.deskClosed}</p>}
        <nav className="founders-nav" aria-label="related lists">
          <Link href="/wall" className="archive-back">
            WALL OF MARS
          </Link>
          <Link href="/monument" className="archive-back">
            FOUNDER MONUMENT
          </Link>
          <Link href="/offerings" className="archive-back">
            ALL OFFERINGS
          </Link>
        </nav>
      </div>
      <Disclaimer surface="void" className="temple-disclaimer mx-auto px-4 pb-6 text-center" />
    </section>
  );
}
