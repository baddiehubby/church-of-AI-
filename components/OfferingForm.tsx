"use client";

import { useMemo, useState } from "react";

import { certificateOffer } from "@/content/verdict";
import { OFFERING_PRESETS, parseOfferingDollars } from "@/lib/offering";

export function OfferingForm({ petitionId, notice }: { petitionId: string; notice: string | null }) {
  const [preset, setPreset] = useState<string>(String(certificateOffer.suggestedDollars));
  const [custom, setCustom] = useState(String(certificateOffer.suggestedDollars));
  const parsed = useMemo(
    () => parseOfferingDollars(preset === "custom" ? custom : preset),
    [preset, custom],
  );
  const dollars = parsed.ok ? parsed.dollars : certificateOffer.suggestedDollars;

  return (
    <form action="/api/checkout" method="post" className="mt-4 grid gap-4">
      {notice ? (
        <p role="alert" className="text-sm text-[#6E1E23]">
          {notice}
        </p>
      ) : null}
      <input type="hidden" name="petition_id" value={petitionId} />
      <label className="grid gap-1 text-sm">
        {certificateOffer.nameLabel}
        <input name="name" required maxLength={40} autoComplete="name" className="min-h-12 border border-[#B8894A] bg-transparent px-3" />
      </label>
      <fieldset>
        <legend className="text-sm">{certificateOffer.amountLabel}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OFFERING_PRESETS.map((amount) => (
            <label
              key={amount}
              className={`press inline-flex min-h-11 cursor-pointer items-center border px-3 font-mono text-sm ${
                preset === String(amount) ? "border-[#6E1E23] bg-[#6E1E23] text-[#F2EDE4]" : "border-[#B8894A]"
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
            className={`press inline-flex min-h-11 cursor-pointer items-center border px-3 font-mono text-sm ${
              preset === "custom" ? "border-[#6E1E23] bg-[#6E1E23] text-[#F2EDE4]" : "border-[#B8894A]"
            }`}
          >
            <input type="radio" name="amount" value="custom" checked={preset === "custom"} onChange={() => setPreset("custom")} className="sr-only" />
            Custom
          </label>
        </div>
      </fieldset>
      {preset === "custom" ? (
        <label className="grid gap-1 text-sm">
          {certificateOffer.customLabel}
          <input
            name="custom_amount"
            type="number"
            min={certificateOffer.minDollars}
            max={certificateOffer.maxDollars}
            step={1}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="min-h-12 border border-[#B8894A] bg-transparent px-3"
          />
        </label>
      ) : (
        <input type="hidden" name="custom_amount" value="" />
      )}
      <p className="font-mono text-sm" role="status">
        {certificateOffer.preview(dollars)}
      </p>
      <p className="text-sm">{certificateOffer.oneTime}</p>
      <button type="submit" className="press min-h-12 border border-[#B8894A] bg-[#6E1E23] px-4 font-mono text-sm tracking-[0.12em] text-[#F2EDE4]">
        {certificateOffer.button}
      </button>
    </form>
  );
}
