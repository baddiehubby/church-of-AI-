import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { premium, premiumJournal } from "@/content/premium";
import { getDailyGuidance, hasPremium } from "@/lib/premium";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const session = await readSession();
  if (!session) notFound();
  if (!(await hasPremium(session.profileId))) notFound();
  const daily = await getDailyGuidance(session.profileId);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-mono text-sm tracking-[0.2em] text-brass-light">{premiumJournal.dailyHeading}</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.14em] text-brass">{daily?.date}</p>
      {daily ? (
        <p className="serif-warm mt-6 text-2xl leading-relaxed text-bone">{daily.text}</p>
      ) : (
        <p className="mt-6 text-bone/90">{premiumJournal.dailyEmpty}</p>
      )}
      <p className="mt-8 text-sm text-mist">{premium.notice}</p>
      <p className="mt-8">
        <Link href="/journal" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          {premium.journalCta}
        </Link>
      </p>
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
