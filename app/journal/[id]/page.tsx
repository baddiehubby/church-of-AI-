import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { VisaReadingView } from "@/components/VisaReading";
import { premium, premiumJournal } from "@/content/premium";
import { getWishEntry } from "@/lib/premium";
import { readSession } from "@/lib/session";

import { JournalComposer } from "../journal-composer";
import { JournalTools } from "./journal-tools";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function JournalEntryPage({ params }: Props) {
  const session = await readSession();
  const { id } = await params;
  const entry = await getWishEntry(id, session?.profileId ?? null);
  if (!entry) notFound();
  const latest = entry.readings.at(-1);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.16em] text-brass-light">{premiumJournal.heading}</p>
      <h1 className="serif-warm mt-4 text-3xl text-bone">“{entry.wish}”</h1>
      <p className="mt-3 text-sm text-mist">{premium.privacyHelp}</p>
      {latest ? (
        <div className="mt-8">
          <VisaReadingView
            reading={{
              status: latest.verdict.algo_status,
              sacrifices: [...latest.verdict.algo_sacrifices],
              counsel: latest.verdict.algo_counsel,
              probability: latest.verdict.algo_probability,
              panditReply: latest.verdict.pandit_reply,
            }}
          />
        </div>
      ) : null}
      <JournalComposer entryId={entry.id} />
      <JournalTools entryId={entry.id} />
      <p className="mt-8">
        <Link href="/journal" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          ← {premiumJournal.heading}
        </Link>
      </p>
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
