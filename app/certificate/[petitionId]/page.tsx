import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { hologram } from "@/content/hologram";
import { certificatePage, verdictPage } from "@/content/verdict";
import { BRAND, mailbox } from "@/lib/brand";
import { getCertificate, getPetition } from "@/lib/petitions";
import { isPetitionId } from "@/lib/soul-id";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ petitionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { petitionId } = await params;
  const id = decodeURIComponent(petitionId).trim().toUpperCase();
  const image = `${BRAND.domain}/api/og/certificate/${id}`;
  return {
    title: `${id} · ${certificatePage.kicker}`,
    description: certificatePage.waiting,
    openGraph: { images: [{ url: image, width: 1200, height: 630, alt: certificatePage.kicker }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { petitionId } = await params;
  const id = decodeURIComponent(petitionId).trim().toUpperCase();
  if (!isPetitionId(id)) notFound();
  const petition = await getPetition(id);
  if (!petition) notFound();
  const certificate = await getCertificate(id);
  const reportHref = `mailto:${mailbox("report")}?subject=${encodeURIComponent(id)}&body=${encodeURIComponent(id)}`;
  if (!certificate) {
    return (
      <article className="grain bg-[#1B1B4B] px-5 py-20 text-center text-[#F2EDE4]">
        <meta httpEquiv="refresh" content="8" />
        <p className="mx-auto max-w-xl font-mono text-sm uppercase tracking-[0.14em]">{certificatePage.waiting}</p>
        <div className="mx-auto mt-10 max-w-3xl text-left"><Disclaimer surface="void" /></div>
      </article>
    );
  }
  const issued = new Date(certificate.issuedAt);
  const when = Number.isNaN(issued.getTime()) ? certificate.issuedAt : issued.toISOString().slice(0, 10);
  return (
    <article className="grain bg-[#1B1B4B] px-4 py-12 text-[#F2EDE4]">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-[0.16em] text-[#E2C48A]">{certificatePage.scene}</p>
        <div className="petition-scroll mt-6 px-5 py-10 sm:px-12">
          <p className="font-mono text-xs tracking-[0.18em] text-[#6E1E23]">{certificatePage.kicker}</p>
          <h1 className="display mt-4 text-4xl text-[#1A1740] sm:text-6xl">{certificate.name ?? "ON THE RECORD"}</h1>
          <p className="serif-warm mt-6 text-2xl text-[#1A1740]">“{petition.wish}”</p>
          <p className="mt-6 font-mono text-sm tracking-[0.12em] text-[#1A1740]">{petition.status}</p>
          <p className="serif-warm mt-6 text-xl italic text-[#1A1740]">{hologram.offeringReceived}</p>
          <p className="serif-warm mt-4 text-xl italic text-[#1A1740]">{petition.panditReply ?? verdictPage.panditFallback}</p>
          <p className="mt-8 font-mono text-xs tracking-[0.14em] text-[#1A1740]">SOUL ID {id}</p>
          <p className="mt-2 font-mono text-xs text-[#1A1740]">{when}</p>
        </div>
        <div className="mt-8"><Disclaimer surface="void" /></div>
        <p className="mt-6"><a className="text-sm underline" href={reportHref}>{certificatePage.report}</a></p>
        <p className="mt-6"><Link href="/" className="font-mono text-sm tracking-[0.12em] text-[#E2C48A]">{verdictPage.own}</Link></p>
      </div>
    </article>
  );
}
