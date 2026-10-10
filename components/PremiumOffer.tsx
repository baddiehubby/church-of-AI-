import Link from "next/link";

import { premium } from "@/content/premium";
import { premiumCheckoutConfigured } from "@/lib/lemon";

export function PremiumOffer() {
  const ready = premiumCheckoutConfigured();
  return (
    <section id="premium" aria-labelledby="premium-offer-heading" className="mt-10 border border-brass bg-paper p-6 text-ink">
      <h2 id="premium-offer-heading" className="font-mono text-sm tracking-[0.16em] text-maroon">
        {premium.heading}
      </h2>
      <p className="mt-3 leading-relaxed">{premium.lede}</p>
      <p className="mt-2 font-mono text-sm">{premium.price}</p>
      <p className="mt-3 text-sm leading-relaxed">{premium.distinguish}</p>
      <p className="mt-3 text-sm leading-relaxed">{premium.notice}</p>
      {!ready ? (
        <p role="alert" className="mt-3 border-l-4 border-maroon pl-3 text-maroon">
          {premium.unconfigured}
        </p>
      ) : null}
      <p className="mt-5">
        <Link href="/premium" className="btn-brass press">
          {premium.cta}
        </Link>
      </p>
    </section>
  );
}
