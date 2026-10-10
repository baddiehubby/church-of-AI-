"use client";

import { useState } from "react";

import { premium } from "@/content/premium";

export function PremiumCheckout() {
  const [consent, setConsent] = useState(false);
  return (
    <form action="/api/premium/checkout" method="post" className="grid max-w-xl gap-4">
      <p className="font-mono text-sm tracking-[0.06em] text-brass-light">{premium.recurringLine}</p>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-bone/90">
        <input
          type="checkbox"
          name="consent"
          value="1"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
          className="mt-1 h-5 w-5 shrink-0 accent-[#00C8FF]"
        />
        <span>{premium.consent}</span>
      </label>
      <button type="submit" disabled={!consent} className="btn-brass press w-full sm:w-auto">
        {premium.cta}
      </button>
    </form>
  );
}
