import type { Metadata } from "next";
import Link from "next/link";

import { pricingCopy } from "@/content/congregation";
import { currentSoul, waitlistSnapshot } from "@/lib/congregation";
import { seatVariantId, type SeatTier } from "@/lib/env";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pricing", description: pricingCopy.algo };

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function PricingPage({ searchParams }: Props) {
  const query = await searchParams;
  const session = await readSession();
  const soul = await currentSoul();
  const waiting = await waitlistSnapshot(soul?.userId);
  const notice =
    query.notice === "cancelled" ? pricingCopy.cancelled : query.notice === "unconfigured" ? pricingCopy.unconfigured : query.notice === "busy" ? pricingCopy.busy : null;
  return (
    <article className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.2em] text-brass">{pricingCopy.algo}</p>
      <h1 className="display mt-3 text-5xl text-bone">{pricingCopy.title}</h1>
      <p className="serif-warm mt-4 max-w-xl text-2xl text-bone">{pricingCopy.intro}</p>
      {notice ? <p className="mt-4 font-mono text-sm text-brass-light">{notice}</p> : null}
      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {pricingCopy.tiers.map((tier) => {
          const current = soul?.tier === tier.id;
          const paid: SeatTier | null = tier.id === "believer" || tier.id === "devotee" || tier.id === "darshan" ? tier.id : null;
          const priceReady = paid ? Boolean(seatVariantId(paid)) : false;
          const darshan = tier.id === "darshan";
          return (
            <section key={tier.id} className={`flex flex-col border p-5 ${tier.id === "believer" ? "border-brass bg-night" : "border-brass/50"}`}>
              <h2 className="font-mono text-sm tracking-[0.16em] text-brass-light">{tier.name}</h2>
              <p className="display mt-4 text-4xl text-bone">{tier.price}</p>
              <p className="mt-1 font-mono text-xs tracking-[0.12em] text-mist">{tier.cadence}</p>
              {tier.id === "believer" ? <p className="mt-3 font-mono text-xs tracking-[0.08em] text-brass">{pricingCopy.trial}</p> : null}
              <ul className="mt-4 grid flex-1 gap-2 text-sm text-bone/90">
                {tier.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {current ? <p className="mt-6 font-mono text-xs tracking-[0.12em] text-brass-light">{pricingCopy.current}</p> : null}
              {tier.id === "pilgrim" || current ? null : darshan && !priceReady ? (
                <Link href="/darshan" className="btn-outline press mt-6">
                  {pricingCopy.waitlist}
                </Link>
              ) : !session ? (
                <Link href="/login?next=/pricing" className="btn-brass press mt-6">
                  {pricingCopy.signIn}
                </Link>
              ) : paid && priceReady ? (
                <form action="/api/lemon/checkout" method="post" className="mt-6">
                  <input type="hidden" name="tier" value={tier.id} />
                  <button type="submit" className="btn-brass press w-full">
                    {tier.name}
                  </button>
                </form>
              ) : (
                <p className="mt-6 font-mono text-xs tracking-[0.08em] text-mist">{pricingCopy.unconfigured}</p>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-8 font-mono text-xs tracking-[0.12em] text-brass">{pricingCopy.waitlistCount(waiting.count)}</p>
      <p className="mt-6 text-sm text-mist">
        {pricingCopy.legacy}{" "}
        <Link href="/premium" className="text-brass-light underline">
          {pricingCopy.legacyCta}
        </Link>
      </p>
    </article>
  );
}
