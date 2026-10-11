import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import portrait from "@/public/images/sacha-pandit-hero.jpg";

import { Disclaimer } from "@/components/Disclaimer";
import { HologramPandit } from "@/components/HologramPandit";
import { OfferingForm } from "@/components/OfferingForm";
import { OfferingSlip } from "@/components/OfferingSlip";
import { PredictionPop } from "@/components/PredictionPop";
import { PremiumOffer } from "@/components/PremiumOffer";
import { ShareRow } from "@/components/VerdictTools";
import { hologram } from "@/content/hologram";
import { hero } from "@/content/landing";
import { certificateOffer, verdictPage } from "@/content/verdict";
import { BRAND } from "@/lib/brand";
import { petitionCheckoutConfigured } from "@/lib/lemon";
import { getPetition } from "@/lib/petitions";
import { isPetitionId } from "@/lib/soul-id";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ petitionId: string }>; searchParams: Promise<{ notice?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { petitionId } = await params;
  const id = decodeURIComponent(petitionId).trim().toUpperCase();
  const petition = isPetitionId(id) ? await getPetition(id) : null;
  const title = petition ? `${petition.petitionId} · ${verdictPage.reviewed}` : verdictPage.missingTitle;
  const description = petition?.status ?? verdictPage.metaDescription;
  const image = `${BRAND.domain}/api/og/${id}`;
  const alt = petition ? `${verdictPage.ogAlt}. ${petition.status}. ${petition.petitionId}` : verdictPage.ogAlt;
  return {
    title,
    description,
    openGraph: { title, description, url: `${BRAND.domain}/verdict/${id}`, images: [{ url: image, width: 1200, height: 630, alt }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function VerdictPage({ params, searchParams }: PageProps) {
  const { petitionId } = await params;
  const query = await searchParams;
  const id = decodeURIComponent(petitionId).trim().toUpperCase();
  if (!isPetitionId(id)) notFound();
  const petition = await getPetition(id);
  if (!petition) notFound();
  const url = `${BRAND.domain}/verdict/${petition.petitionId}`;
  const notice = query.notice && query.notice in verdictPage.notices ? verdictPage.notices[query.notice as keyof typeof verdictPage.notices] : null;
  const pandit = petition.panditReply ?? verdictPage.panditFallback;
  return (
    <article className="grain bg-[#1B1B4B] px-4 py-12 text-[#F2EDE4] sm:px-5 sm:py-16">
      <div className="petition-scroll mx-auto max-w-3xl px-5 py-8 sm:px-12 sm:py-12">
        <p className="text-center font-mono text-xs tracking-[0.18em] text-[#8A6230]">{verdictPage.received}</p>
        <dl className="mt-8">
          <div className="border-t border-[#B8894A]/70 py-4">
            <dt className="font-mono text-xs tracking-[0.16em]">{verdictPage.soulLabel}</dt>
            <dd className="mt-1 font-mono text-sm text-[#1A1740]">{petition.petitionId}</dd>
          </div>
          <div className="border-t border-[#B8894A]/70 py-4">
            <dt className="font-mono text-xs tracking-[0.16em] text-[#1A1740]">{verdictPage.statusLabel}</dt>
            <dd className="display mt-2 text-4xl text-[#1A1740] sm:text-6xl">{petition.status}</dd>
          </div>
          <div className="border-t border-[#B8894A]/70 py-4">
            <dt className="font-mono text-xs tracking-[0.16em] text-[#6E1E23]">{verdictPage.sacrificeHeading}</dt>
            <dd>
              <ol className="mt-3 list-decimal space-y-2 pl-5 font-mono text-sm uppercase tracking-[0.06em] text-[#1A1740]">
                {petition.sacrifices.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </dd>
          </div>
          <div className="border-t border-[#B8894A]/70 py-4">
            <dt className="font-mono text-xs tracking-[0.16em] text-[#6E1E23]">{verdictPage.counselHeading}</dt>
            <dd className="serif-warm mt-3 text-lg leading-relaxed text-[#1A1740]">{petition.counsel}</dd>
          </div>
          <div className="border-t border-[#B8894A]/70 py-4">
            <dt className="font-mono text-xs tracking-[0.16em] text-[#1A1740]">{verdictPage.probabilityHeading}</dt>
            <dd className="mt-2 font-mono text-lg text-[#1A1740]">{petition.probability}</dd>
          </div>
        </dl>
        <p className="display mt-2 border-t border-[#B8894A]/70 pt-6 text-center text-3xl text-[#8A6230] sm:text-4xl">{verdictPage.spoken}</p>
      </div>
      <aside className="mx-auto mt-8 max-w-xl text-right">
        <p className="serif-warm text-xl italic text-[#F2EDE4] sm:text-2xl">{pandit}</p>
      </aside>
      <div className="mx-auto max-w-3xl">
        <ShareRow id={petition.petitionId} url={url} status={petition.status} />
        <div className="mx-auto mt-10 max-w-md">
          <HologramPandit compact petitionId={petition.petitionId} mood={petition.certified ? "offering-received" : undefined}>
            <Image src={portrait} alt={hero.imageAlt} fill sizes="(max-width: 768px) 92vw, 420px" className="object-cover" />
          </HologramPandit>
        </div>
        <div className="mt-10">
          <PredictionPop seed={petition.petitionId} />
        </div>
        <div id="certificate" className="altar-desk mt-6 border border-[#B8894A] bg-[#F4E7D4] p-6 text-[#1A1740] sm:p-8">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-[#8A6230]">{certificateOffer.kicker}</p>
          <h2 className="mt-2 font-mono text-sm tracking-[0.12em]">{certificateOffer.heading}</h2>
          <p className="serif-warm mt-2 text-lg italic">{certificateOffer.bowl}</p>
          <p className="mt-2 font-mono text-xs tracking-[0.12em]">{certificateOffer.minimum}</p>
          <p className="mt-3 text-sm leading-relaxed">{certificateOffer.body}</p>
          {petition.certified ? (
            <>
              <p className="serif-warm mt-4 text-lg">{hologram.offeringReceived}</p>
              <OfferingSlip petitionId={petition.petitionId} />
              <p className="mt-4">
                <Link className="underline" href={`/certificate/${petition.petitionId}`}>
                  {certificateOffer.slipKicker}
                </Link>
              </p>
            </>
          ) : (
            <OfferingForm petitionId={petition.petitionId} notice={notice} bowlReady={petitionCheckoutConfigured()} />
          )}
        </div>
        <PremiumOffer />
        <div className="mt-8"><Disclaimer surface="void" /></div>
        <p className="mt-8"><Link href="/" className="font-mono text-sm tracking-[0.12em] text-[#E2C48A]">{verdictPage.own}</Link></p>
      </div>
    </article>
  );
}
