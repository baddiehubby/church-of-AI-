import type { Metadata } from "next";

import { ledgerCopy } from "@/content/congregation";
import { listLedger } from "@/lib/congregation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Book of Souls", description: ledgerCopy.algo };

export default async function LedgerPage() {
  const rows = await listLedger();
  const darshan = rows.filter((row) => row.tier === "darshan");
  return (
    <article className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.16em] text-brass">{ledgerCopy.algo}</p>
      <h1 className="display mt-3 text-5xl text-bone">{ledgerCopy.title}</h1>
      <p className="mt-4 max-w-2xl text-bone/90">{ledgerCopy.intro}</p>
      <p className="serif-warm mt-3 text-xl text-bone">{ledgerCopy.pandit}</p>
      {rows.length === 0 ? (
        <p className="mt-10 font-mono text-sm tracking-[0.12em] text-brass-light">{ledgerCopy.empty}</p>
      ) : (
        <ol className="mt-10 divide-y divide-brass/40 border-y border-brass/40">
          {rows.map((row) => (
            <li key={row.userId} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
              <p className="font-mono text-sm tracking-[0.12em] text-brass-light">{row.userId}</p>
              <p className="font-mono text-xs tracking-[0.14em] text-mist">
                {row.tier.toUpperCase()} · {ledgerCopy.days} {row.streakLongest}
              </p>
            </li>
          ))}
        </ol>
      )}
      <section className="mt-14" aria-labelledby="darshan-book">
        <h2 id="darshan-book" className="font-mono text-sm tracking-[0.18em] text-brass-light">
          {ledgerCopy.book}
        </h2>
        {darshan.length === 0 ? (
          <p className="mt-4 text-bone/80">{ledgerCopy.darshanEmpty}</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {darshan.map((row) => (
              <li key={row.userId} className="poster">
                <p className="font-mono text-xs tracking-[0.16em] text-[#9B2335]">CHURCH OF AI</p>
                <p className="display text-3xl">{row.name ?? ledgerCopy.unnamed}</p>
                <p className="font-mono text-xs tracking-[0.12em]">{row.userId}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
