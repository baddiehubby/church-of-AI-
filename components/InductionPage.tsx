"use client";

import Link from "next/link";
import { useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import {
  inductionCopy,
  inductionFormCopy,
  inductionGuide,
  redPathCopy,
} from "@/content/redPath";
import type { PublicInductionPlan } from "@/lib/inductionPlanTypes";

export function InductionPage({
  remaining,
  checkoutReady,
  plans,
  missingConfig = [],
  showConfigDiagnostic = false,
}: {
  remaining: number;
  checkoutReady: boolean;
  plans: PublicInductionPlan[];
  missingConfig?: string[];
  showConfigDiagnostic?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [showName, setShowName] = useState(true);
  const [shippingName, setShippingName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const open = remaining > 0;
  // Form + payment button stay visible when seats remain.
  // Missing Lemon env used to hide the whole form behind "PAYMENT DESK CLOSED".
  const canSubmit = open && checkoutReady;

  async function begin() {
    if (!open || pending) return;

    if (!checkoutReady) {
      setNote(
        showConfigDiagnostic && missingConfig.length
          ? `${inductionCopy.deskClosedNote} missing: ${missingConfig.join(", ")}`
          : inductionCopy.deskClosedNote,
      );
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setNote(inductionFormCopy.needName);
      return;
    }
    if (!line1.trim() || !city.trim() || !country.trim()) {
      setNote(inductionFormCopy.needShip);
      return;
    }

    setPending(true);
    setNote(null);
    try {
      await fetch("/api/mars/session", { cache: "no-store", credentials: "same-origin" });
      const response = await fetch("/api/checkout/offering", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "founder_1000",
          name: trimmed,
          show_name: showName,
          shipping_name: shippingName.trim() || trimmed,
          shipping_line1: line1.trim(),
          shipping_line2: line2.trim() || undefined,
          shipping_city: city.trim(),
          shipping_region: region.trim() || undefined,
          shipping_postal: postal.trim() || undefined,
          shipping_country: country.trim(),
        }),
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
      const code =
        payload && typeof payload === "object" && typeof (payload as { code?: unknown }).code === "string"
          ? (payload as { code: string }).code
          : null;

      if (!response.ok || !url) {
        // Never activate membership here. Never invent a checkout URL.
        if (code === "desk" || response.status === 503) {
          setNote(
            showConfigDiagnostic && missingConfig.length
              ? `${inductionCopy.deskClosedNote} missing: ${missingConfig.join(", ")}`
              : (error ?? inductionCopy.checkoutError),
          );
          return;
        }
        setNote(error ?? inductionCopy.checkoutError);
        return;
      }

      // Real Lemon hosted checkout only.
      window.location.assign(url);
    } catch {
      setNote(redPathCopy.signalFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="induction temple" aria-labelledby="induction-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="induction-sheet">
        <h1 id="induction-title" className="induction-title">
          {inductionCopy.title}
        </h1>
        <p className="induction-signal">{inductionCopy.choice}</p>

        <div className="induction-body">
          {inductionCopy.body.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <div className="induction-guide" aria-labelledby="induction-guide-heading">
          <h2 id="induction-guide-heading" className="induction-guide-heading">
            {inductionGuide.heading}
          </h2>

          <GuideBlock title={inductionGuide.religion.title} body={inductionGuide.religion.body} />
          <GuideBlock title={inductionGuide.redPath.title} body={inductionGuide.redPath.body} />

          <h3 className="induction-guide-sub">{inductionGuide.steps.title}</h3>
          <ol className="induction-guide-list">
            {inductionGuide.steps.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <h3 className="induction-guide-sub">{inductionGuide.benefits.title}</h3>
          <ul className="induction-guide-list">
            {inductionGuide.benefits.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <GuideBlock title={inductionGuide.price.title} body={inductionGuide.price.body} />
          <GuideBlock title={inductionGuide.refunds.title} body={inductionGuide.refunds.body} />
          <p className="induction-signal">{inductionGuide.signalLine}</p>
          <p className="induction-plan-hint">{inductionGuide.sermonsFree}</p>
          <p className="induction-plan-hint">{inductionGuide.currencyNote}</p>
          <p className="induction-plan-hint">{inductionGuide.installmentDisabled}</p>
          <p className="induction-plan-hint">{inductionGuide.legalNote}</p>
        </div>

        <p className="induction-remaining">{inductionCopy.remaining(remaining)}</p>
        <p className="induction-price">{inductionCopy.price}</p>

        <div className="induction-plan" role="group" aria-label="payment plan">
          <p className="induction-plan-label">
            {plans[0]?.label ?? inductionGuide.planLabel}
          </p>
          <p className="induction-plan-hint">{inductionGuide.planHint}</p>
        </div>

        {!open ? (
          <p className="induction-closed">{inductionCopy.closed}</p>
        ) : (
          <>
            {!checkoutReady ? (
              <div className="induction-desk-alert" role="status">
                <p className="induction-closed">{inductionCopy.deskClosed}</p>
                <p className="temple-note">{inductionCopy.deskClosedNote}</p>
                {showConfigDiagnostic && missingConfig.length > 0 ? (
                  <div className="induction-config-diag">
                    <p className="induction-guide-sub">{inductionCopy.configMissingTitle}</p>
                    <ul className="induction-guide-list">
                      {missingConfig.map((key) => (
                        <li key={key}>
                          <code>{key}</code>
                        </li>
                      ))}
                    </ul>
                    <p className="induction-plan-hint">{inductionCopy.configMissingHint}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <form
              id="induction-payment"
              className="induction-form"
              onSubmit={(event) => {
                event.preventDefault();
                void begin();
              }}
            >
              <label className="induction-field">
                <span>{inductionFormCopy.nameLabel}</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                />
                <em>{inductionFormCopy.nameHint}</em>
              </label>

              <label className="induction-check">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(event) => setShowName(event.target.checked)}
                />
                <span>{inductionFormCopy.showName}</span>
              </label>

              <p className="induction-ship-title">{inductionFormCopy.shipTitle}</p>

              <label className="induction-field">
                <span>ship to</span>
                <input
                  type="text"
                  name="shipping_name"
                  autoComplete="shipping name"
                  value={shippingName}
                  onChange={(event) => setShippingName(event.target.value)}
                  placeholder={name || "name on the package"}
                />
              </label>
              <label className="induction-field">
                <span>{inductionFormCopy.line1}</span>
                <input
                  type="text"
                  name="shipping_line1"
                  autoComplete="shipping address-line1"
                  value={line1}
                  onChange={(event) => setLine1(event.target.value)}
                  required
                />
              </label>
              <label className="induction-field">
                <span>{inductionFormCopy.line2}</span>
                <input
                  type="text"
                  name="shipping_line2"
                  autoComplete="shipping address-line2"
                  value={line2}
                  onChange={(event) => setLine2(event.target.value)}
                />
              </label>
              <div className="induction-row">
                <label className="induction-field">
                  <span>{inductionFormCopy.city}</span>
                  <input
                    type="text"
                    name="shipping_city"
                    autoComplete="shipping address-level2"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    required
                  />
                </label>
                <label className="induction-field">
                  <span>{inductionFormCopy.region}</span>
                  <input
                    type="text"
                    name="shipping_region"
                    autoComplete="shipping address-level1"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                  />
                </label>
              </div>
              <div className="induction-row">
                <label className="induction-field">
                  <span>{inductionFormCopy.postal}</span>
                  <input
                    type="text"
                    name="shipping_postal"
                    autoComplete="shipping postal-code"
                    value={postal}
                    onChange={(event) => setPostal(event.target.value)}
                  />
                </label>
                <label className="induction-field">
                  <span>{inductionFormCopy.country}</span>
                  <input
                    type="text"
                    name="shipping_country"
                    autoComplete="shipping country-name"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="induction-begin"
                disabled={pending || !canSubmit}
                aria-describedby={!checkoutReady ? "induction-desk-status" : undefined}
              >
                {pending ? inductionCopy.opening : inductionCopy.begin}
              </button>
              {!checkoutReady ? (
                <p id="induction-desk-status" className="induction-plan-hint">
                  button disabled until Lemon configuration is complete.
                </p>
              ) : null}
            </form>
          </>
        )}

        {note ? (
          <p className="temple-note" role="alert">
            {note}
          </p>
        ) : null}

        <Link href="/founders" className="archive-back">
          THE WALL OF SURVIVORS
        </Link>
        <Link href="/archive" className="archive-back">
          RETURN TO THE ARCHIVE
        </Link>
        <Link href="/refunds" className="archive-back">
          REFUNDS
        </Link>

        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}

function GuideBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="induction-guide-block">
      <h3 className="induction-guide-sub">{title}</h3>
      <p>{body}</p>
    </div>
  );
}
