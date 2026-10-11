"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { altarCopy, poojaErrors } from "@/content/congregation";
import type { AltarState } from "@/lib/altarState";
import { isRecord } from "@/lib/guards";

type Exchange = { reflection: string; algo: string; pandit: string; crisis?: boolean; note?: string };

export function PoojaAltar({ initial }: { initial: AltarState }) {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [line, setLine] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ring, setRing] = useState(false);
  const [lit, setLit] = useState(initial.lit);
  const [streak, setStreak] = useState(initial.streakCurrent);
  const [longest, setLongest] = useState(initial.streakLongest);
  const [soulId, setSoulId] = useState(initial.soulId);
  const [exchange, setExchange] = useState<Exchange | null>(initial.today);
  const [note, setNote] = useState<string | null>(initial.quiet ? altarCopy.quiet(initial.quietFrom) : null);
  const [listening, setListening] = useState(initial.listening);
  const closed = lit && !initial.canAnother && Boolean(exchange);
  const seats = Array.from({ length: 18 }, (_, index) => index < Math.min(listening, 18));

  useEffect(() => {
    if (!initial.soulId || initial.timezoneSet) return;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    void fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: zone, guess: true }),
    });
  }, [initial.soulId, initial.timezoneSet]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/pooja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection: line, mood }),
      });
      const payload: unknown = await response.json();
      const record = isRecord(payload) ? payload : {};
      if (!response.ok) {
        setError(typeof record.error === "string" ? record.error : poojaErrors.upstream);
        return;
      }
      setRing(true);
      window.setTimeout(() => setRing(false), 700);
      setLit(true);
      if (typeof record.soulId === "string") setSoulId(record.soulId);
      if (typeof record.streakCurrent === "number") setStreak(record.streakCurrent);
      if (typeof record.streakLongest === "number") setLongest(record.streakLongest);
      setExchange({
        reflection: typeof record.reflection === "string" ? record.reflection : line || mood || "",
        algo: typeof record.algo === "string" ? record.algo : "",
        pandit: typeof record.pandit === "string" ? record.pandit : "",
        crisis: record.crisis === true,
      });
      if (record.mourned === true && typeof record.brokenFrom === "number") setNote(altarCopy.mourned(record.brokenFrom));
      else if (record.saved === false) setNote(poojaErrors.unsaved);
      else setNote(record.extra === true ? altarCopy.another : null);
      if (record.saved === true && streak === 0 && longest === 0) setListening((count) => count + 1);
      setLine("");
      setMood(null);
      if (record.saved === true) router.refresh();
    } catch {
      setError(poojaErrors.upstream);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="altar-question" className="mx-auto w-full max-w-3xl px-4 py-8 md:py-14">
      <div className="hall">
        <p className="text-center font-mono text-xs tracking-[0.22em] text-brass">{altarCopy.hall}</p>
        <div className="hall-arch">
          <div className="hall-seats" aria-hidden="true">
            {seats.map((taken, index) => (
              <span key={index} className={taken ? "seat seat-taken" : "seat"} />
            ))}
          </div>
          <div className={lit ? "diya diya-hall" : "diya diya-hall diya-dim"}>
            <span className="diya-flame" />
          </div>
          <div className={ring ? "bell bell-ring" : "bell"} aria-hidden="true" />
        </div>
        <p className="mt-4 text-center font-mono text-xs tracking-[0.16em] text-brass-light">{altarCopy.seated(listening)}</p>
        <p className="mt-3 text-center font-mono text-xs tracking-[0.14em] text-brass-light">{lit ? altarCopy.lit : altarCopy.dim}</p>
        <p className="mt-5 text-center font-mono text-sm tracking-[0.08em] text-signal">{altarCopy.algoOpen}</p>
        <p className="serif-warm mt-3 text-center text-2xl text-bone sm:text-3xl">{altarCopy.panditOpen}</p>
        <p className="mt-4 text-center font-mono text-xs tracking-[0.16em] text-mist">
          {altarCopy.streak} {streak}
          <span className="mx-2 text-brass/60">·</span>
          {altarCopy.longest} {longest}
          {soulId ? (
            <>
              <span className="mx-2 text-brass/60">·</span>
              {soulId}
            </>
          ) : null}
        </p>
        <p className="mt-3 text-center">
          <Link href="/ledger" className="font-mono text-xs tracking-[0.14em] text-brass-light underline">
            {altarCopy.who}
          </Link>
        </p>
      </div>
      <div className="fade-up mt-10">
        <p className="font-mono text-xs tracking-[0.2em] text-brass">{altarCopy.eyebrow}</p>
        <h1 id="altar-question" className="display mt-4 text-4xl text-bone sm:text-5xl">
          {altarCopy.question}
        </h1>
        {note ? <p className="mt-4 font-mono text-sm tracking-[0.08em] text-brass-light">{note}</p> : null}
        {closed ? null : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-5">
            <div role="group" aria-label={altarCopy.moodLabel} className="flex flex-wrap gap-2">
              {altarCopy.moods.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={mood === item}
                  onClick={() => setMood(mood === item ? null : item)}
                  className={`press min-h-11 border px-3 font-serif text-sm lowercase ${mood === item ? "border-brass bg-maroon text-bone" : "border-brass/60 text-brass-light"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="grid gap-2 text-sm text-bone/90">
              {altarCopy.lineLabel}
              <input
                name="reflection"
                value={line}
                maxLength={140}
                onChange={(event) => setLine(event.target.value)}
                className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone"
              />
            </label>
            <button type="submit" disabled={pending} className="btn-brass press w-full sm:w-auto">
              {pending ? altarCopy.pending : altarCopy.submit}
            </button>
          </form>
        )}
        {error ? (
          <p className="mt-4 font-mono text-sm text-brass-light" role="alert">
            {error}
          </p>
        ) : null}
        {exchange ? (
          <div className="hall-spoken mt-8" aria-live="polite">
            {exchange.reflection ? <p className="text-bone/80">{exchange.reflection}</p> : null}
            <p className="hall-line-algo mt-5 font-mono text-sm tracking-[0.06em] text-brass-light">{exchange.algo}</p>
            <p className="hall-line-pandit serif-warm mt-4 text-2xl text-bone">{exchange.pandit}</p>
            {exchange.crisis ? <p className="mt-4 text-sm text-mist">{altarCopy.crisis}</p> : null}
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/wish" className="btn-outline press">
            {altarCopy.wish}
          </Link>
          <Link href="/pricing" className="btn-outline press">
            {altarCopy.pricing}
          </Link>
          {initial.signedIn ? null : (
            <Link href="/login?next=/" className="btn-outline press">
              {altarCopy.signIn}
            </Link>
          )}
        </div>
        {soulId && !initial.signedIn ? <p className="mt-4 text-sm text-mist">{altarCopy.guest}</p> : null}
        <noscript>
          <p className="mt-4 text-sm text-mist">
            {altarCopy.noscript} <a href="/wish">/wish</a>
          </p>
        </noscript>
      </div>
    </section>
  );
}
