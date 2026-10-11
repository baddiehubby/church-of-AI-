import type { Metadata } from "next";
import Link from "next/link";

import { darshanCopy, pricingCopy } from "@/content/congregation";
import { countDarshansBetween, currentSoul, listDarshans, waitlistSnapshot } from "@/lib/congregation";
import { screeningSlots } from "@/lib/slots";
import { atLeast } from "@/lib/tiers";
import { formatWhen, monthStart, safeZone, zonedToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Darshan", description: darshanCopy.algo };

export default async function DarshanPage() {
  const soul = await currentSoul();
  if (!soul) {
    return (
      <article className="screening px-4 py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="display text-5xl text-bone">{darshanCopy.title}</h1>
          <p className="serif-warm mt-4 text-2xl text-bone">{darshanCopy.signIn}</p>
          <Link href="/login?next=/darshan" className="btn-brass press mt-8">
            {darshanCopy.signIn}
          </Link>
        </div>
      </article>
    );
  }
  const zone = safeZone(soul.timezone);
  const now = new Date();
  const start = zonedToUtc(monthStart(now, zone), 0, 0, zone);
  const end = zonedToUtc(monthStart(new Date(start.getTime() + 32 * 86_400_000), zone), 0, 0, zone);
  const seated = atLeast(soul.tier, "darshan");
  const [count, mine, waiting] = await Promise.all([
    countDarshansBetween(start.toISOString(), end.toISOString()).catch(() => 0),
    listDarshans(soul.userId).catch(() => []),
    waitlistSnapshot(soul.userId),
  ]);
  const mineThisMonth = mine.filter((row) => row.scheduledAt >= start.toISOString() && row.scheduledAt < end.toISOString());
  const slots = seated && count < 10 && mineThisMonth.length === 0 ? screeningSlots(now, zone) : [];
  return (
    <article className="screening px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-[0.16em] text-brass">{darshanCopy.algo}</p>
        <h1 className="display mt-3 text-5xl text-bone">{darshanCopy.title}</h1>
        <p className="serif-warm mt-4 text-2xl text-bone">{darshanCopy.intro}</p>
        <p className="mt-4 font-mono text-xs tracking-[0.12em] text-brass-light">{pricingCopy.waitlistCount(waiting.count)}</p>
        {waiting.position ? <p className="mt-2 font-mono text-sm text-bone">{darshanCopy.position(waiting.position, waiting.count)}</p> : null}
        {!seated ? (
          <form action="/api/darshan" method="post" className="mt-8">
            <input type="hidden" name="action" value="waitlist" />
            <button type="submit" className="btn-brass press">
              {pricingCopy.waitlist}
            </button>
            <p className="mt-4 text-sm text-mist">{darshanCopy.locked}</p>
          </form>
        ) : null}
        {seated && count >= 10 ? <p className="mt-8 font-mono text-sm text-brass-light">{darshanCopy.full}</p> : null}
        {slots.length > 0 ? (
          <div className="mt-8 grid gap-3">
            {slots.map((slot) => (
              <form key={slot.iso} action="/api/darshan" method="post">
                <input type="hidden" name="action" value="schedule" />
                <input type="hidden" name="slot" value={slot.iso} />
                <button type="submit" className="btn-outline press w-full sm:w-auto">
                  {slot.label}
                </button>
              </form>
            ))}
          </div>
        ) : null}
        <h2 className="mt-12 font-mono text-sm tracking-[0.16em] text-brass-light">{darshanCopy.yours}</h2>
        <ul className="mt-4 grid gap-3">
          {mine.map((row) => (
            <li key={row.id}>
              <Link href={`/darshan/${row.id}`} className="font-mono text-sm tracking-[0.1em] text-brass-light">
                {formatWhen(row.scheduledAt, zone)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
