// Assumptions: the homepage is the restored altar (hero, wish desk, how it works). ?category= preselects a
// category (the hero's visa link); ?notice= carries no-JS errors back from /api/wish. The desk only learns whether
// visa checkout is configured (a boolean), never any key or id. No ledger wall, ticker, or social proof.

import { AltarDesk } from "@/components/AltarDesk";
import { Hero } from "@/components/Hero";
import { DEFAULT_CATEGORY, isCategoryId } from "@/content/categories";
import { altar, howItWorks } from "@/content/landing";
import { visaOffer } from "@/content/visa";
import { visaCheckoutConfigured } from "@/lib/lemon";
import { visaStoreAvailable } from "@/lib/visaWishes";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ category?: string; notice?: string }> };

function noticeText(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "unconfigured") return visaOffer.errors.unconfigured;
  if (code === "visa_rate") return visaOffer.errors.rate;
  if (code === "nap") return visaOffer.errors.nap;
  return code in altar.errors ? altar.errors[code as keyof typeof altar.errors] : null;
}

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const initialCategory = query.category && isCategoryId(query.category) ? query.category : DEFAULT_CATEGORY;
  const visaReady = visaCheckoutConfigured() && visaStoreAvailable();
  return (
    <>
      <Hero />
      <AltarDesk key={initialCategory} initialCategory={initialCategory} notice={noticeText(query.notice)} visaReady={visaReady} />
      <section aria-labelledby="how-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2 id="how-heading" className="font-mono text-sm tracking-[0.2em] text-brass-light">
          {howItWorks.heading}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {howItWorks.steps.map((step, index) => (
            <li key={step.title} className="border border-brass/50 p-5">
              <p className="font-mono text-xs tracking-[0.16em] text-brass">
                {String(index + 1).padStart(2, "0")} · {step.title}
              </p>
              <p className="mt-3 leading-relaxed text-bone/90">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
