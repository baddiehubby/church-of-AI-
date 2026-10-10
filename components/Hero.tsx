// Assumptions: server component. The portrait is the only priority image; the hologram is a CSS layer that
// hydrates over it. next/image serves AVIF/WebP from the 1152x864 temple portrait. Not a conversation; not lip-sync.

import Image from "next/image";
import Link from "next/link";

import { HologramOfferingLink } from "@/components/HologramOfferingLink";
import { HologramPandit } from "@/components/HologramPandit";
import { VISA_SHOWCASE_CATEGORY } from "@/content/categories";
import { hologram } from "@/content/hologram";
import { hero } from "@/content/landing";

import portrait from "@/public/images/sacha-pandit-hero.jpg";

export function Hero() {
  return (
    <section aria-labelledby="hero-brand" className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 pb-12 pt-6 md:grid-cols-[1fr_1.05fr] md:pt-12">
      <div className="fade-up order-2 md:order-1">
        <p className="font-mono text-xs tracking-[0.16em] text-brass">{hero.eyebrow}</p>
        <h1 id="hero-brand" className="mt-3 font-mono text-lg tracking-[0.32em] text-brass-light">
          {hero.brand}
        </h1>
        <p className="display mt-4 text-4xl text-bone sm:text-5xl">{hero.headline}</p>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-bone/90">{hero.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#wish" className="btn-brass press">
            {hero.primaryCta}
          </Link>
          <HologramOfferingLink />
          <Link href="/premium" className="btn-outline press">
            {hologram.premiumCta}
          </Link>
          <Link href={`/?category=${VISA_SHOWCASE_CATEGORY}#wish`} className="btn-outline press">
            {hero.secondaryCta}
          </Link>
        </div>
      </div>
      <div className="order-1 md:order-2">
        <HologramPandit>
          <Image
            src={portrait}
            alt={hero.imageAlt}
            priority
            fill
            sizes="(max-width: 768px) 92vw, 560px"
            placeholder="blur"
            className="object-cover"
          />
        </HologramPandit>
      </div>
    </section>
  );
}
