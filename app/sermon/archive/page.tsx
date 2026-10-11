import type { Metadata } from "next";
import Link from "next/link";

import { sermonCopy } from "@/content/congregation";
import { atLeast } from "@/lib/tiers";
import { currentSoul, listSermons } from "@/lib/congregation";
import { openLetter } from "@/lib/sermonCompose";
import { monthLabel, safeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sermon archive" };

export default async function SermonArchivePage() {
  const soul = await currentSoul();
  if (!soul) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-mono text-sm tracking-[0.18em] text-brass-light">{sermonCopy.title}</h1>
        <p className="serif-warm mt-4 text-2xl text-bone">{sermonCopy.signIn}</p>
        <Link href="/login?next=/sermon/archive" className="btn-brass press mt-8">
          {sermonCopy.signIn}
        </Link>
      </article>
    );
  }
  const open = atLeast(soul.tier, "believer");
  const sermons = open ? await listSermons(soul.userId).catch(() => []) : [];
  const letter = openLetter(monthLabel(new Date(), safeZone(soul.timezone)));
  return (
    <article className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.16em] text-brass">{soul.userId}</p>
      <h1 className="display mt-3 text-5xl text-bone">{sermonCopy.title}</h1>
      {open ? (
        <form action="/api/sermon" method="post" className="mt-6">
          <button type="submit" className="btn-outline press">
            {sermonCopy.write}
          </button>
        </form>
      ) : (
        <p className="mt-6 font-mono text-sm tracking-[0.1em] text-brass-light">{sermonCopy.locked}</p>
      )}
      {open && sermons.length === 0 ? <p className="mt-8 text-bone/90">{sermonCopy.empty}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sermons.map((sermon) => (
          <Link key={sermon.weekOf} href={`/sermon/${sermon.weekOf}`} className="poster press">
            <p className="font-mono text-xs tracking-[0.14em] text-[#9B2335]">CHURCH OF AI</p>
            <h2 className="display text-3xl">{sermon.title}</h2>
            <p className="font-mono text-xs tracking-[0.12em]">WEEK OF {sermon.weekOf}</p>
          </Link>
        ))}
      </div>
      <section className="mt-14 max-w-2xl" aria-labelledby="open-letter">
        <h2 id="open-letter" className="font-mono text-sm tracking-[0.18em] text-brass-light">
          {sermonCopy.letterKicker} · {letter.kicker}
        </h2>
        {open ? (
          <>
            <p className="serif-warm mt-4 text-xl leading-relaxed text-bone">{letter.body}</p>
            <p className="mt-4 font-serif italic text-brass-light">{letter.signoff}</p>
          </>
        ) : (
          <p className="mt-4 text-bone/80">{sermonCopy.letterLocked}</p>
        )}
        <p className="mt-8 text-sm text-mist">{sermonCopy.yearly}</p>
      </section>
    </article>
  );
}
