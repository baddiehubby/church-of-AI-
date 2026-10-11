import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { premiumJournal } from "@/content/premium";
import { getShareCard } from "@/lib/premium";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ publicId: string }> };

export default async function ShareCardPage({ params }: Props) {
  const { publicId } = await params;
  const card = await getShareCard(decodeURIComponent(publicId));
  if (!card) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="bg-indigo px-3 py-2 text-center font-mono text-xs tracking-[0.14em] text-brass-light ring-1 ring-brass/60">
        {premiumJournal.cardBanner}
      </p>
      <div className="petition-scroll mt-8 px-5 py-10 sm:px-12">
        <p className="font-mono text-xs tracking-[0.18em] text-maroon">SACHA PANDIT</p>
        <p className="serif-warm mt-6 text-2xl italic">{card.summary}</p>
        <p className="mt-6 font-mono text-sm uppercase leading-relaxed tracking-[0.04em]">{card.reflection}</p>
        {card.wish ? <p className="serif-warm mt-6 text-lg">“{card.wish}”</p> : null}
      </div>
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
      <p className="mt-8">
        <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          MAKE YOUR WISH →
        </Link>
      </p>
    </article>
  );
}
