"use client";

import Link from "next/link";
import { useState } from "react";

import { redPathCopy } from "@/content/redPath";
import type { CheckoutTier } from "@/lib/redPathOfferings";

// Full-width bone card. Lemon checkout only — no Stripe.

export function UpgradeMoment({
  onDismiss,
  pitch,
  cta,
  tier,
  secondaryHref,
  secondaryLabel,
}: {
  onDismiss?: () => void;
  pitch: string;
  cta: string;
  tier: CheckoutTier;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function checkout() {
    if (pending) return;
    setPending(true);
    setNote(null);
    try {
      const response = await fetch("/api/checkout/offering", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const url =
        payload && typeof payload === "object" && typeof (payload as { url?: unknown }).url === "string"
          ? (payload as { url: string }).url
          : null;
      const error =
        payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null;
      if (!response.ok || !url) {
        setNote(error ?? redPathCopy.signalFail);
        return;
      }
      window.location.assign(url);
    } catch {
      setNote(redPathCopy.signalFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="upgrade-moment" aria-label="Offering">
      <p className="upgrade-moment-copy">{pitch}</p>
      <div className="upgrade-moment-actions">
        <button type="button" className="upgrade-moment-primary" onClick={() => void checkout()} disabled={pending}>
          {cta}
        </button>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="upgrade-moment-secondary">
            {secondaryLabel}
          </Link>
        ) : null}
        {onDismiss ? (
          <button type="button" className="upgrade-moment-dismiss" onClick={onDismiss}>
            {redPathCopy.notNow}
          </button>
        ) : null}
      </div>
      {note ? (
        <p className="temple-note" role="alert">
          {note}
        </p>
      ) : null}
    </aside>
  );
}
