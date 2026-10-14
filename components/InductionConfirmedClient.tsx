"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { inductionStatusCopy } from "@/content/redPath";

type StatusPayload = {
  inducted?: boolean;
  pending?: boolean;
  position?: number;
  ceremony_url?: string | null;
  pending_status?: string | null;
};

export function InductionConfirmedClient() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch("/api/induction/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as StatusPayload;
        if (!cancelled) setStatus(data);
        if (!cancelled && !data.inducted && attempts < 12) {
          window.setTimeout(() => void poll(), 5_000);
        }
      } catch {
        if (!cancelled && attempts < 12) {
          window.setTimeout(() => void poll(), 5_000);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const inducted = Boolean(status?.inducted);
  const waiting = !inducted;

  return (
    <div className="induction-confirm-status" role="status" aria-live="polite">
      {inducted ? (
        <>
          <p className="induction-status-body">
            the webhook sealed your seat
            {typeof status?.position === "number" ? ` — founder ${status.position}` : ""}. the Wall updates only
            with your display-name consent.
          </p>
          {status?.ceremony_url ? (
            <Link href={status.ceremony_url} className="induction-begin">
              [ OPEN YOUR CEREMONY ]
            </Link>
          ) : null}
          <Link href="/founders?inducted=1" className="induction-begin">
            {inductionStatusCopy.confirmedFounders}
          </Link>
        </>
      ) : (
        <>
          <p className="induction-status-body">{inductionStatusCopy.confirmedBody}</p>
          <p className="induction-plan-hint">
            {waiting
              ? "waiting for Lemon to confirm payment. this page does not enroll you by itself."
              : "no Founder seat yet."}
          </p>
          <Link href="/founders" className="archive-back">
            {inductionStatusCopy.pendingCta}
          </Link>
          <Link href="/induction/pending" className="archive-back">
            [ PENDING STATE ]
          </Link>
        </>
      )}
      <Link href="/induction" className="archive-back">
        {inductionStatusCopy.confirmedAgain}
      </Link>
    </div>
  );
}
