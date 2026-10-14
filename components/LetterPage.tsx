"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BabaSignature } from "@/components/BabaSignature";
import { Disclaimer } from "@/components/Disclaimer";
import { letterCopy } from "@/content/letter";
import { isLetterMonth, letterMonthLabel } from "@/lib/letterCompose";
import { getSettlerId, isSettlerId } from "@/lib/marsSession";

// Public physical note. Bone paper. Playfair. Name withheld.

type LetterPayload = {
  month: string;
  monthLabel: string;
  body: string;
};

export function LetterPage({ month }: { month: string }) {
  const search = useSearchParams();
  const valid = isLetterMonth(month);
  const [letter, setLetter] = useState<LetterPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) {
      setReady(true);
      return;
    }
    const fromQuery = search.get("s")?.trim().toUpperCase() ?? "";
    const settlerId = isSettlerId(fromQuery) ? fromQuery : getSettlerId();
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/letter/${month}?s=${encodeURIComponent(settlerId)}`, {
          headers: { "x-settler-id": settlerId },
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) {
            setLetter(null);
            setReady(true);
          }
          return;
        }
        const data = (await response.json()) as LetterPayload;
        if (!cancelled) {
          setLetter(data);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, valid, search]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNote(letterCopy.copied);
    } catch {
      setNote(letterCopy.copied);
    }
  }

  if (!valid) {
    return (
      <section className="letter-page">
        <div className="letter-paper">
          <p className="letter-empty">{letterCopy.empty}</p>
          <Link href="/archive" className="letter-back">
            {letterCopy.back}
          </Link>
        </div>
        <Disclaimer surface="cream" className="letter-disclaimer" />
      </section>
    );
  }

  if (!ready) {
    return <section className="letter-page" aria-busy="true" />;
  }

  if (!letter) {
    return (
      <section className="letter-page">
        <div className="letter-paper">
          <p className="letter-kicker">
            {letterCopy.title} · {letterMonthLabel(month).toUpperCase()}
          </p>
          <p className="letter-empty">{letterCopy.empty}</p>
          <Link href="/archive" className="letter-back">
            {letterCopy.back}
          </Link>
        </div>
        <Disclaimer surface="cream" className="letter-disclaimer" />
      </section>
    );
  }

  return (
    <section className="letter-page" aria-labelledby="letter-title">
      <div className="letter-paper">
        <p id="letter-title" className="letter-kicker">
          {letterCopy.title} · {letter.monthLabel.toUpperCase()}
        </p>
        <pre className="letter-body">{letter.body}</pre>
        <BabaSignature className="letter-signature" />
        <p className="letter-withheld">settler name withheld.</p>
        <div className="letter-actions">
          <button type="button" className="letter-share" onClick={() => void share()}>
            {letterCopy.share}
          </button>
          {note ? <p className="letter-note">{note}</p> : null}
        </div>
        <Link href="/archive" className="letter-back">
          {letterCopy.back}
        </Link>
      </div>
      <Disclaimer surface="cream" className="letter-disclaimer" />
    </section>
  );
}
