"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { premium, premiumJournal } from "@/content/premium";
import { isRecord } from "@/lib/guards";

export function JournalComposer({ entryId }: { entryId?: string }) {
  const router = useRouter();
  const [wish, setWish] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, entryId }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (response.status === 404) {
        setError(premiumJournal.missing);
        return;
      }
      const record = isRecord(payload) ? payload : {};
      if (!response.ok) {
        setError(typeof record.error === "string" ? record.error : "THE DESK IS BUSY.");
        return;
      }
      if (typeof record.entryId === "string") router.push(`/journal/${record.entryId}`);
      router.refresh();
      setWish("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8">
      <label className="grid gap-2 text-sm" htmlFor="journal-wish">
        <span className="font-mono text-xs tracking-[0.14em] text-brass-light">{premiumJournal.wishLabel}</span>
        <span className="text-mist">{premium.privacyHelp}</span>
        <textarea
          id="journal-wish"
          required
          maxLength={280}
          rows={4}
          value={wish}
          onChange={(event) => setWish(event.target.value)}
          className="focus-ring w-full border border-brass/70 bg-night px-3 py-3 text-lg text-bone"
        />
      </label>
      {error ? (
        <p className="mt-2 text-sm text-brass-light" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-brass press mt-4">
        {entryId ? premiumJournal.followUp : premiumJournal.submit}
      </button>
    </form>
  );
}
