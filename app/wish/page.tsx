// Assumptions: the wish desk moved off the altar. ?category= preselects a category. ?notice= carries no-JS errors.

import type { Metadata } from "next";

import { AltarDesk } from "@/components/AltarDesk";
import { Hero } from "@/components/Hero";
import { DEFAULT_CATEGORY, isCategoryId } from "@/content/categories";
import { altar, howItWorks } from "@/content/landing";
import { visaOffer } from "@/content/visa";
import { petitionCheckoutConfigured, premiumCheckoutConfigured, visaCheckoutConfigured } from "@/lib/lemon";
import { visaStoreAvailable } from "@/lib/visaWishes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "File a wish" };

type Props = { searchParams: Promise<{ category?: string; notice?: string }> };

function noticeText(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "unconfigured") return visaOffer.errors.unconfigured;
  if (code === "visa_rate") return visaOffer.errors.rate;
  if (code === "nap") return visaOffer.errors.nap;
  return code in altar.errors ? altar.errors[code as keyof typeof altar.errors] : null;
}

export default async function WishPage({ searchParams }: Props) {
  const query = await searchParams;
  const initialCategory = query.category && isCategoryId(query.category) ? query.category : DEFAULT_CATEGORY;
  return (
    <>
      <Hero />
      <AltarDesk
        key={initialCategory}
        initialCategory={initialCategory}
        notice={noticeText(query.notice)}
        bowlReady={petitionCheckoutConfigured()}
        visaReady={visaCheckoutConfigured() && visaStoreAvailable()}
        premiumReady={premiumCheckoutConfigured()}
      />
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
