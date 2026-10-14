import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { foundersPageCopy } from "@/content/redPath";
import type { PublicFounderSeat } from "@/lib/transmissionsStore";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";

export function FoundersPage({
  seats,
  remaining,
  inductedNote,
}: {
  seats: PublicFounderSeat[];
  remaining: number;
  inductedNote?: boolean;
}) {
  const filled = FOUNDERS_CAP - remaining;

  return (
    <section className="founders temple" aria-labelledby="founders-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="founders-sheet">
        <p className="founders-wall">{foundersPageCopy.wall}</p>
        <h1 id="founders-title" className="founders-title">
          {foundersPageCopy.title}
        </h1>
        <p className="founders-subtitle">{foundersPageCopy.subtitle}</p>
        <p className="founders-count">
          {filled} inscribed. {remaining} remain.
        </p>
        <p className="founders-consent">{foundersPageCopy.consentNote}</p>

        {inductedNote ? (
          <p className="founders-welcome" role="status">
            welcome. your ceremony is in your email. the book already has your seat.
          </p>
        ) : null}

        <ol className="founders-list">
          {seats.map((seat) => (
            <li key={seat.position} className={seat.vacant ? "is-vacant" : "is-filled"}>
              {seat.vacant
                ? foundersPageCopy.vacantLine(seat.position)
                : foundersPageCopy.line(seat.position, seat.displayName, seat.inductedSol)}
            </li>
          ))}
        </ol>

        <div className="founders-nav">
          {remaining > 0 ? (
            <Link href="/induction" className="archive-back">
              THE INDUCTION
            </Link>
          ) : null}
          <Link href="/archive" className="archive-back">
            RETURN TO THE ARCHIVE
          </Link>
        </div>

        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
