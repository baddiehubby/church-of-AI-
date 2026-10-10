import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { premium, premiumJournal } from "@/content/premium";
import { hasPremium, listWishEntries } from "@/lib/premium";
import { readSession } from "@/lib/session";

import { JournalComposer } from "./journal-composer";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const session = await readSession();
  if (!session) notFound();
  const entitled = await hasPremium(session.profileId);
  if (!entitled) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-mono text-sm tracking-[0.2em] text-brass-light">{premiumJournal.heading}</h1>
        <p className="mt-4 text-lg text-bone/90">{premiumJournal.gated}</p>
        <p className="mt-6">
          <Link href="/premium" className="btn-brass press">
            {premium.cta}
          </Link>
        </p>
        <div className="mt-10">
          <Disclaimer surface="void" />
        </div>
      </article>
    );
  }
  const entries = (await listWishEntries(session.profileId)) ?? [];
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-mono text-sm tracking-[0.2em] text-brass-light">{premiumJournal.heading}</h1>
      <p className="mt-3 text-sm text-mist">{premium.privacyHelp}</p>
      <p className="mt-2 text-sm text-mist">{premium.localeNote}</p>
      <JournalComposer />
      {entries.length === 0 ? (
        <p className="mt-8 text-bone/90">{premiumJournal.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-4">
          {entries.map((entry) => (
            <li key={entry.id} className="border border-brass/50 p-5">
              <p className="text-bone/90">“{entry.wish}”</p>
              <p className="mt-3 font-mono text-xs tracking-[0.14em] text-brass-light">{entry.createdAt.slice(0, 10)}</p>
              <p className="mt-4">
                <Link href={`/journal/${entry.id}`} className="font-mono text-xs tracking-[0.14em] text-brass-light">
                  {premiumJournal.followUp} →
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8">
        <Link href="/daily" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          {premium.dailyCta}
        </Link>
      </p>
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
