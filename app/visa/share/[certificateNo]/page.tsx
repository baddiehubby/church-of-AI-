// Assumptions: public share page keyed by the certificate number, never the private reference. Paid rows only;
// unpaid or unknown numbers 404. The wish text is omitted. Entertainment banner is required on the shared view.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { VisaReadingView } from "@/components/VisaReading";
import { visaShare, visaSuccess } from "@/content/visa";
import { appUrl } from "@/lib/brand";
import { getSharedVisa, isCertificateNo } from "@/lib/visaWishes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ certificateNo: string }> };

function decodeNo(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const certificateNo = decodeNo((await params).certificateNo);
  const shared = isCertificateNo(certificateNo) ? await getSharedVisa(certificateNo) : null;
  if (!shared) return { title: visaSuccess.missingTitle };
  const title = visaShare.sharedTitle;
  const description = visaShare.metaDescription;
  const image = `${appUrl()}/api/og/certificate/${encodeURIComponent(shared.certificateNo)}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: visaSuccess.certificateAlt }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function VisaSharePage({ params }: Props) {
  const certificateNo = decodeNo((await params).certificateNo);
  if (!isCertificateNo(certificateNo)) notFound();
  const shared = await getSharedVisa(certificateNo);
  if (!shared) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="bg-indigo px-3 py-2 text-center font-mono text-xs tracking-[0.14em] text-brass-light ring-1 ring-brass/60">
        {visaSuccess.banner}
      </p>
      <h1 className="display mt-8 text-3xl text-bone sm:text-5xl">{visaShare.sharedTitle}</h1>
      <p className="serif-warm mt-4 text-xl text-bone/90">{visaShare.sharedBy(shared.firstName)}</p>
      <p className="mt-3 font-mono text-xs tracking-[0.14em] text-brass-light">
        {shared.categoryLabel.toUpperCase()} · {shared.country.toUpperCase()} · {shared.certificateNo}
      </p>
      <p className="mt-4 text-sm text-mist">{visaShare.sharedNote}</p>
      <p className="mt-2 text-sm text-mist">{visaShare.privacy}</p>

      {shared.reading ? (
        <section aria-labelledby="shared-reading-heading" className="mt-10">
          <h2 id="shared-reading-heading" className="font-mono text-sm tracking-[0.18em] text-brass-light">
            {visaSuccess.readingHeading}
          </h2>
          <VisaReadingView reading={shared.reading} />
        </section>
      ) : (
        <p className="mt-8 text-bone/90">{visaSuccess.consulting}</p>
      )}

      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
      <p className="mt-8">
        <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          {visaShare.sharedCta}
        </Link>
      </p>
    </article>
  );
}
