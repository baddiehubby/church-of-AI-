"use client";

import { useMemo, useState, type FormEvent } from "react";

import { certificateOffer } from "@/content/verdict";
import { isRecord } from "@/lib/guards";
import { OFFERING_PRESETS, parseOfferingDollars } from "@/lib/offering";

export function OfferingForm({
  petitionId,
  notice,
  bowlReady,
}: {
  petitionId: string;
  notice: string | null;
  bowlReady: boolean;
}) {
  const [preset, setPreset] = useState<string>(String(certificateOffer.suggestedDollars));
  const [custom, setCustom] = useState(String(certificateOffer.suggestedDollars));
  const [busy, setBusy] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(bowlReady ? null : certificateOffer.bowlPreparingAlgo);
  const [panditNote, setPanditNote] = useState<string | null>(bowlReady ? null : certificateOffer.bowlPreparing);
  const parsed = useMemo(() => parseOfferingDollars(preset === "custom" ? custom : preset), [preset, custom]);
  const dollars = parsed.ok ? parsed.dollars : certificateOffer.suggestedDollars;
  const alert = localNotice ?? notice;
  const canSubmit = !busy && parsed.ok;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bowlReady) {
      setLocalNotice(certificateOffer.bowlPreparingAlgo);
      setPanditNote(certificateOffer.bowlPreparing);
      return;
    }
    if (!parsed.ok || busy) return;
    setBusy(true);
    setLocalNotice(null);
    try {
      const body = new FormData(event.currentTarget);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const payload: unknown = await response.json().catch(() => null);
      const record = isRecord(payload) ? payload : {};
      if (response.ok && typeof record.checkoutUrl === "string" && record.checkoutUrl.startsWith("https://")) {
        window.location.assign(record.checkoutUrl);
        return;
      }
      const error = typeof record.error === "string" ? record.error : certificateOffer.bowlPreparingAlgo;
      setLocalNotice(error);
      if (record.code === "nap" || !response.ok) setPanditNote(certificateOffer.bowlPreparing);
    } catch {
      setLocalNotice(certificateOffer.bowlPreparingAlgo);
      setPanditNote(certificateOffer.bowlPreparing);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action="/api/checkout" method="post" onSubmit={onSubmit} className="altar-offering mt-5">
      <div className="altar-bowl" aria-hidden="true">
        <span className="altar-bowl-rim" />
        <span className="altar-bowl-well" />
      </div>
      <p className="altar-selected font-mono text-sm tracking-[0.14em] text-[#6E1E23]" role="status">
        {busy ? certificateOffer.placing : certificateOffer.selected(dollars)}
      </p>
      {alert ? (
        <p role="alert" className="mt-3 font-mono text-sm leading-relaxed text-[#6E1E23]">
          {alert}
        </p>
      ) : null}
      {panditNote ? <p className="serif-warm mt-2 text-base italic text-[#1A1740]">{panditNote}</p> : null}
      <input type="hidden" name="petition_id" value={petitionId} />
      <label className="mt-5 grid gap-1 text-sm">
        {certificateOffer.nameLabel}
        <input name="name" required maxLength={40} autoComplete="name" className="focus-ring min-h-12 border border-[#B8894A] bg-transparent px-3" />
      </label>
      <fieldset className="mt-5">
        <legend className="text-sm">{certificateOffer.amountLabel}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {OFFERING_PRESETS.map((amount) => (
            <label
              key={amount}
              className={`press flex min-h-14 cursor-pointer items-center justify-center border font-mono text-base ${
                preset === String(amount) ? "border-[#6E1E23] bg-[#6E1E23] text-[#F2EDE4]" : "border-[#B8894A] bg-[#F2EDE4]"
              }`}
            >
              <input
                type="radio"
                name="amount"
                value={amount}
                checked={preset === String(amount)}
                onChange={() => setPreset(String(amount))}
                className="sr-only"
              />
              ${amount}
            </label>
          ))}
          <label
            className={`press flex min-h-14 cursor-pointer items-center justify-center border font-mono text-sm ${
              preset === "custom" ? "border-[#6E1E23] bg-[#6E1E23] text-[#F2EDE4]" : "border-[#B8894A] bg-[#F2EDE4]"
            }`}
          >
            <input type="radio" name="amount" value="custom" checked={preset === "custom"} onChange={() => setPreset("custom")} className="sr-only" />
            Custom
          </label>
        </div>
      </fieldset>
      {preset === "custom" ? (
        <label className="mt-4 grid gap-1 text-sm">
          {certificateOffer.customLabel}
          <input
            name="custom_amount"
            type="number"
            min={certificateOffer.minDollars}
            max={certificateOffer.maxDollars}
            step={1}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="focus-ring min-h-12 border border-[#B8894A] bg-transparent px-3"
          />
        </label>
      ) : (
        <input type="hidden" name="custom_amount" value="" />
      )}
      <p className="mt-4 font-mono text-sm" role="status">
        {certificateOffer.preview(dollars)}
      </p>
      <p className="mt-2 text-sm">{certificateOffer.oneTime}</p>
      <button type="submit" disabled={!canSubmit} className="btn-brass press mt-5 w-full">
        {certificateOffer.button}
      </button>
    </form>
  );
}
