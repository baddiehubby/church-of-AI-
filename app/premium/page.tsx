import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { PremiumCheckout } from "@/components/PremiumCheckout";
import { premium } from "@/content/premium";
import { premiumCheckoutConfigured } from "@/lib/lemon";
import { hasPremium } from "@/lib/premium";
import { authConfigured, readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function PremiumPage({ searchParams }: Props) {
  const session = await readSession();
  const entitled = session ? await hasPremium(session.profileId) : false;
  const checkoutReady = premiumCheckoutConfigured();
  const loginReady = authConfigured();
  const query = await searchParams;
  const consentNotice = query.notice === "consent" ? premium.errors.consent : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-mono text-sm tracking-[0.2em] text-brass-light">{premium.heading}</h1>
      <p className="display mt-4 text-4xl text-bone">{premium.price}</p>
      <p className="mt-3 font-mono text-sm tracking-[0.06em] text-brass-light">{premium.recurringLine}</p>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-bone/90">{premium.lede}</p>
      <p className="mt-4 text-sm leading-relaxed text-mist">{premium.distinguish}</p>
      <p className="mt-3 text-sm leading-relaxed text-mist">{premium.notice}</p>
      <p className="mt-3 text-sm text-mist">{premium.localeNote}</p>

      <ul className="mt-8 grid gap-4">
        {premium.billing.map((line) => (
          <li key={line} className="border-l-2 border-brass pl-4 text-sm leading-relaxed text-bone/90">
            {line}
          </li>
        ))}
      </ul>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {premium.features.map((feature) => (
          <li key={feature.title} className="border border-brass/50 p-5">
            <h2 className="font-mono text-xs tracking-[0.14em] text-brass-light">{feature.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-bone/90">{feature.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {entitled ? (
          <div className="flex flex-wrap gap-3">
            <Link href="/journal" className="btn-brass press">
              {premium.journalCta}
            </Link>
            <Link href="/daily" className="btn-outline press">
              {premium.dailyCta}
            </Link>
          </div>
        ) : !loginReady ? (
          <p role="alert" className="border-l-4 border-brass-light pl-3 text-brass-light">
            {premium.loginUnconfigured}
          </p>
        ) : !session ? (
          <Link href="/login" className="btn-brass press">
            {premium.loginCta}
          </Link>
        ) : !checkoutReady ? (
          <p role="alert" className="border-l-4 border-brass-light pl-3 text-brass-light">
            {premium.unconfigured}
          </p>
        ) : (
          <>
            {consentNotice ? (
              <p role="alert" className="mb-4 border-l-4 border-brass-light pl-3 text-brass-light">
                {consentNotice}
              </p>
            ) : null}
            <PremiumCheckout />
          </>
        )}
      </div>

      <div className="mt-12">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
