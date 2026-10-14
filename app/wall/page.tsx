import type { Metadata } from "next";
import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { offeringsCopy } from "@/content/offerings";
import { listPublishedWall } from "@/lib/blessingsStore";
import { marsDeskReady } from "@/lib/marsOfferings";

export const metadata: Metadata = {
  title: "Wall of Mars",
  description: offeringsCopy.wallBlurb,
};

export const dynamic = "force-dynamic";

export default async function WallOfMarsPage() {
  const entries = await listPublishedWall();
  const deskOpen = marsDeskReady("wall");

  return (
    <section className="founders temple" aria-labelledby="wall-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="founders-sheet">
        <p className="founders-wall">WALL</p>
        <h1 id="wall-title" className="founders-title">
          {offeringsCopy.wallTitle}
        </h1>
        <p className="founders-subtitle">{offeringsCopy.wallBlurb}</p>
        {entries.length === 0 ? (
          <p className="ritual-opening">{offeringsCopy.wallEmpty}</p>
        ) : (
          <ol className="founders-list">
            {entries.map((entry) => (
              <li key={entry.id} className="is-filled">
                {entry.displayName} · Sol {entry.sol}
              </li>
            ))}
          </ol>
        )}
        <div className="founders-nav">
          {deskOpen ? (
            <Link href="/offerings" className="archive-back">
              ADD A NAME — $20
            </Link>
          ) : (
            <p className="temple-note">{offeringsCopy.deskClosed}</p>
          )}
          <Link href="/patrons" className="archive-back">
            PATRONS OF MARS
          </Link>
          <Link href="/monument" className="archive-back">
            FOUNDER MONUMENT
          </Link>
          <Link href="/founders" className="archive-back">
            WALL OF SURVIVORS
          </Link>
        </div>
        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
