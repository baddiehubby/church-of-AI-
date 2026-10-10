"use client";

// Assumptions: the wish desk (restored AltarDesk, extended). Native radio inputs give radio-group semantics and
// arrow-key navigation; each option is a 44px+ target with a visible focus ring. Selecting a category updates the
// form in place. Visa categories reveal the country (Europe only), the optional first name, and the $10 offer
// with its notice next to the button; their submit goes to checkout. Without JS the form posts to /api/wish and
// <noscript> renders the fields a no-JS visitor may need. Processing lines follow the real request: "received"
// on submit, "consulting" only while the request is still in flight, "ready" when the server answers.

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  categories,
  europeCountries,
  isVisaCategory,
  placeholderFor,
  type CategoryId,
} from "@/content/categories";
import { altar } from "@/content/landing";
import { visaOffer } from "@/content/visa";
import { isRecord } from "@/lib/guards";
import { announceHologram, rememberFreeReading } from "@/lib/hologram";

type Stage = "idle" | "received" | "consulting" | "ready" | "checkout";

const CONSULTING_AFTER_MS = 700;

function VisaOffer({ ready, children }: { ready: boolean; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="visa-offer-heading" className="mt-6 border border-brass bg-paper p-5 text-ink">
      <h3 id="visa-offer-heading" className="font-mono text-sm tracking-[0.16em] text-maroon">
        {visaOffer.heading}
      </h3>
      <p className="mt-3 leading-relaxed">{visaOffer.body}</p>
      <p className="mt-2 font-mono text-sm">{visaOffer.price}</p>
      <p id="visa-notice" className="mt-3 leading-relaxed text-ink">
        {visaOffer.notice}
      </p>
      {!ready ? (
        <p role="alert" className="mt-3 border-l-4 border-maroon pl-3 text-maroon">
          {visaOffer.unconfigured}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function CountrySelect({ value, onChange, noscript }: { value: string; onChange?: (value: string) => void; noscript?: boolean }) {
  return (
    <label className="mt-5 grid gap-2 text-sm" htmlFor={noscript ? "country-noscript" : "country"}>
      <span className="font-mono text-xs tracking-[0.14em] text-brass-light">
        {altar.countryLabel}
        {noscript ? altar.noscript.country : ""}
      </span>
      <select
        id={noscript ? "country-noscript" : "country"}
        name="country"
        required={!noscript}
        value={noscript ? undefined : value}
        defaultValue={noscript ? "" : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone"
      >
        <option value="">{altar.countryPlaceholder}</option>
        {europeCountries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </label>
  );
}

function FirstName({ value, onChange, noscript }: { value?: string; onChange?: (value: string) => void; noscript?: boolean }) {
  return (
    <label className="mt-5 grid gap-2 text-sm" htmlFor={noscript ? "first-name-noscript" : "first-name"}>
      <span className="font-mono text-xs tracking-[0.14em] text-brass-light">
        {altar.firstNameLabel}
        {noscript ? altar.noscript.firstName : ""}
      </span>
      <input
        id={noscript ? "first-name-noscript" : "first-name"}
        name="firstName"
        maxLength={40}
        autoComplete="given-name"
        value={noscript ? undefined : value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone"
      />
    </label>
  );
}

export function AltarDesk({ initialCategory, notice, visaReady }: { initialCategory: CategoryId; notice: string | null; visaReady: boolean }) {
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [country, setCountry] = useState("");
  const [wish, setWish] = useState("");
  const [firstName, setFirstName] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [fieldError, setFieldError] = useState<{ field: string; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(notice);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const visa = isVisaCategory(category);
  const europe = category === "visa-europe";
  const pending = stage !== "idle";
  const visaBlocked = visa && !visaReady;

  function reset(text: string, field?: string) {
    window.clearTimeout(timer.current);
    setStage("idle");
    if (field && field !== "category") setFieldError({ field, text });
    else setFormError(text);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || visaBlocked) return;
    setFieldError(null);
    setFormError(null);
    setStage("received");
    announceHologram("processing");
    timer.current = window.setTimeout(() => setStage((current) => (current === "received" ? "consulting" : current)), CONSULTING_AFTER_MS);
    try {
      const response = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, category, country: europe ? country : undefined, firstName: visa ? firstName : undefined }),
      });
      const payload: unknown = await response.json();
      const record = isRecord(payload) ? payload : {};
      if (!response.ok) {
        const text = typeof record.error === "string" ? record.error : altar.errors.upstream;
        announceHologram("idle");
        reset(text, typeof record.field === "string" ? record.field : undefined);
        return;
      }
      window.clearTimeout(timer.current);
      if (typeof record.checkoutUrl === "string" && record.checkoutUrl.startsWith("https://")) {
        setStage("checkout");
        window.location.assign(record.checkoutUrl);
        return;
      }
      if (typeof record.petitionId === "string" && record.petitionId) {
        setStage("ready");
        rememberFreeReading(record.petitionId);
        window.location.assign(`/verdict/${encodeURIComponent(record.petitionId)}`);
        return;
      }
      announceHologram("idle");
      reset(altar.errors.upstream);
    } catch {
      announceHologram("idle");
      reset(altar.errors.upstream);
    }
  }

  const stageText = stage === "idle" ? null : altar.stages[stage === "checkout" ? "checkout" : stage];
  const wishError = fieldError?.field === "wish" ? fieldError.text : null;
  const countryError = fieldError?.field === "country" ? fieldError.text : null;
  const nameError = fieldError?.field === "firstName" ? fieldError.text : null;

  return (
    <section id="wish" aria-labelledby="wish-heading" className="mx-auto w-full max-w-3xl scroll-mt-6 px-4 py-14">
      <h2 id="wish-heading" className="font-mono text-sm tracking-[0.2em] text-brass-light">
        {altar.heading}
      </h2>
      <p className="serif-warm mt-3 text-2xl text-bone">{altar.intro}</p>

      <form action="/api/wish" method="post" onSubmit={onSubmit} className="mt-8">
        <fieldset>
          <legend className="font-mono text-xs tracking-[0.14em] text-brass-light">{altar.categoriesLabel}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((item) => {
              const checked = category === item.id;
              return (
                <label
                  key={item.id}
                  className={`focus-within-ring press flex min-h-12 cursor-pointer items-center border px-3 py-2 text-sm leading-snug ${
                    checked ? "border-brass-light bg-maroon text-bone" : "border-brass/60 text-bone hover:bg-brass/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={item.id}
                    checked={checked}
                    onChange={() => {
                      setCategory(item.id);
                      setFieldError(null);
                      setFormError(null);
                    }}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {europe ? (
          <>
            <CountrySelect value={country} onChange={setCountry} />
            {countryError ? <p className="mt-2 text-sm text-brass-light" role="alert">{countryError}</p> : null}
          </>
        ) : (
          <noscript>
            <CountrySelect value="" noscript />
          </noscript>
        )}

        <label className="mt-5 grid gap-2" htmlFor="wish-text">
          <span className="font-mono text-xs tracking-[0.14em] text-brass-light">{altar.wishLabel}</span>
          <span id="wish-help" className="text-sm text-bone/85">
            {visa ? altar.wishHelpVisa : altar.wishHelp} {altar.privacyHelp}
          </span>
          <textarea
            id="wish-text"
            name="wish"
            required
            maxLength={280}
            rows={4}
            value={wish}
            onChange={(event) => setWish(event.target.value)}
            placeholder={placeholderFor(category, country)}
            aria-describedby={`wish-help wish-count${wishError ? " wish-error" : ""}`}
            aria-invalid={wishError ? true : undefined}
            className="focus-ring w-full border border-brass/70 bg-night px-3 py-3 text-lg text-bone placeholder:text-bone/60"
          />
        </label>
        <p id="wish-count" className="mt-2 font-mono text-xs tracking-[0.14em] text-brass">
          {Array.from(wish.trim()).length} / 280
        </p>
        {wishError ? <p id="wish-error" className="mt-1 text-sm text-brass-light" role="alert">{wishError}</p> : null}

        {visa ? (
          <>
            <FirstName value={firstName} onChange={setFirstName} />
            {nameError ? <p className="mt-2 text-sm text-brass-light" role="alert">{nameError}</p> : null}
          </>
        ) : (
          <noscript>
            <FirstName noscript />
          </noscript>
        )}

        <p className="mt-4 min-h-6 text-sm text-bone" role="status" aria-live="polite">
          {stageText ?? formError ?? (visa ? "" : altar.publicNote)}
        </p>

        {visa ? (
          <VisaOffer ready={visaReady}>
            <button type="submit" disabled={pending || visaBlocked} aria-describedby="visa-notice" className="btn-brass press mt-5 w-full sm:w-auto">
              {visaOffer.cta}
            </button>
          </VisaOffer>
        ) : (
          <>
            <button type="submit" disabled={pending} className="btn-brass press mt-2">
              {formError && !pending ? altar.errors.retry : altar.submit}
            </button>
            <noscript>
              <VisaOffer ready={visaReady}>
                <p className="mt-3 text-sm">{altar.noscript.visa}</p>
              </VisaOffer>
            </noscript>
          </>
        )}
      </form>
    </section>
  );
}
