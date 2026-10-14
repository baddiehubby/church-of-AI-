"use client";

import { useEffect, useState } from "react";

import { offeringsCopy, offeringTiers } from "@/content/offerings";
import { dayOfYear, persistentSoulId } from "@/lib/sceneFrame";

export function PatronOffer() {
  const [soul, setSoul] = useState("");
  const [sol, setSol] = useState(1);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSoul(persistentSoulId());
    setSol(dayOfYear());
  }, []);

  if (!soul) return null;

  async function begin() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/mars/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          tier: "patron",
          user_id: soul,
          sol,
          name: name.trim() || undefined,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const url =
        payload && typeof payload === "object" && typeof (payload as { url?: unknown }).url === "string"
          ? (payload as { url: string }).url
          : null;
      const err =
        payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null;
      if (!response.ok || !url) {
        setError(err ?? offeringsCopy.checkoutError);
        return;
      }
      window.location.assign(url);
    } catch {
      setError(offeringsCopy.checkoutError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={offeringsCopy.namePlaceholder}
        maxLength={40}
        className="offering-name-input"
        autoComplete="nickname"
      />
      <button type="button" className="temple-log" disabled={pending} onClick={() => void begin()}>
        {pending ? offeringsCopy.opening : offeringTiers.patron.cta}
      </button>
      {error ? (
        <p className="temple-note" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
