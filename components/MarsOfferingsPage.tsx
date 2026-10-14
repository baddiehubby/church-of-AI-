"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { offeringsCopy, offeringTiers, type OfferingTier } from "@/content/offerings";
import { MARS_TIERS } from "@/lib/marsOfferingsClient";
import { dayOfYear, persistentSoulId } from "@/lib/sceneFrame";

type DeskStatus = Record<OfferingTier, { ready: boolean; missing: string[] }>;

export function MarsOfferingsPage({
  desk,
  showConfigDiagnostic,
  notice,
}: {
  desk: DeskStatus;
  showConfigDiagnostic: boolean;
  notice?: string;
}) {
  const [soul, setSoul] = useState("");
  const [sol, setSol] = useState(1);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pendingTier, setPendingTier] = useState<OfferingTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSoul(persistentSoulId());
    setSol(dayOfYear());
  }, []);

  useEffect(() => {
    if (notice === "desk") setError(offeringsCopy.deskClosed);
    if (notice === "name") setError(offeringsCopy.needName);
    if (notice === "message") setError(offeringsCopy.needMessage);
    if (notice === "offering") setError(offeringsCopy.checkoutError);
  }, [notice]);

  async function checkout(tier: OfferingTier) {
    const spec = offeringTiers[tier];
    if (!desk[tier].ready) {
      setError(
        showConfigDiagnostic && desk[tier].missing.length
          ? `${offeringsCopy.deskClosedHint} missing: ${desk[tier].missing.join(", ")}`
          : offeringsCopy.deskClosed,
      );
      return;
    }
    if (!soul) {
      setError("settler session is still opening. wait a moment and try again.");
      return;
    }

    setPendingTier(tier);
    setError(null);
    try {
      const response = await fetch("/api/mars/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tier,
          user_id: soul,
          sol,
          name: name.trim() || undefined,
          message: message.trim() || undefined,
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
      const missing =
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { missing?: unknown }).missing)
          ? ((payload as { missing: string[] }).missing)
          : [];

      if (!response.ok || !url) {
        if (missing.length && showConfigDiagnostic) {
          setError(`${err ?? offeringsCopy.deskClosed} missing: ${missing.join(", ")}`);
        } else {
          setError(err ?? offeringsCopy.checkoutError);
        }
        return;
      }
      // Real Lemon hosted checkout only — never invent success.
      window.location.assign(url);
    } catch {
      setError(offeringsCopy.checkoutError);
    } finally {
      setPendingTier(null);
    }
  }

  return (
    <section className="offerings temple" aria-labelledby="offerings-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="offerings-sheet">
        <h1 id="offerings-title" className="offerings-title">
          {offeringsCopy.pageTitle}
        </h1>
        <p className="offerings-lede">{offeringsCopy.pageLede}</p>

        <div className="offerings-fields">
          <label className="induction-field">
            <span>{offeringsCopy.nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={offeringsCopy.namePlaceholder}
              maxLength={40}
              autoComplete="nickname"
            />
          </label>
          <label className="induction-field">
            <span>
              {offeringsCopy.prayerLabel} / {offeringsCopy.wishLabel}
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`${offeringsCopy.prayerPlaceholder} · ${offeringsCopy.wishPlaceholder}`}
              maxLength={280}
              rows={4}
            />
          </label>
        </div>

        <ul className="offerings-list">
          {MARS_TIERS.map((tier) => {
            const spec = offeringTiers[tier];
            const ready = desk[tier].ready;
            const busy = pendingTier === tier;
            return (
              <li key={tier} className={spec.premium ? "offerings-card is-premium" : "offerings-card"}>
                <h2 className="offerings-card-title">{spec.label}</h2>
                <p className="offerings-card-price">{spec.dollars} USD · one-time</p>
                <p className="offerings-card-blurb">{spec.blurb}</p>
                {!ready ? (
                  <div className="induction-desk-alert" role="status">
                    <p className="induction-closed">{offeringsCopy.deskClosed}</p>
                    <p className="temple-note">{offeringsCopy.deskClosedHint}</p>
                    {showConfigDiagnostic && desk[tier].missing.length > 0 ? (
                      <ul className="induction-guide-list">
                        {desk[tier].missing.map((key) => (
                          <li key={key}>
                            <code>{key}</code>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="induction-begin"
                  disabled={!ready || pendingTier !== null}
                  onClick={() => void checkout(tier)}
                >
                  {busy ? offeringsCopy.opening : spec.cta}
                </button>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="temple-note" role="alert">
            {error}
          </p>
        ) : null}

        <nav className="offerings-nav" aria-label="offering destinations">
          <Link href="/wall" className="archive-back">
            WALL OF MARS
          </Link>
          <Link href="/patrons" className="archive-back">
            PATRONS OF MARS
          </Link>
          <Link href="/monument" className="archive-back">
            FOUNDER MONUMENT
          </Link>
          <Link href="/" className="archive-back">
            RETURN TO THE WORLD
          </Link>
        </nav>

        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
