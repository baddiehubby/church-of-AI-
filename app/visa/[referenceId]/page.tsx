// Assumptions: private post-payment page. Content (heading, reading, certificate, share) renders only after the
// webhook has marked this reference paid. A visit with a fake or unpaid token shows a waiting/missing state and
// never the wish or reading. The poller only refreshes; it cannot invent a paid row.

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { VisaCertificateView } from "@/components/VisaCertificate";
import { VisaPoller } from "@/components/VisaPoller";
import { VisaReadingLoader } from "@/components/VisaReading";
import { VisaShareRow } from "@/components/VisaShareRow";
import { visaShare, visaSuccess } from "@/content/visa";
import { appUrl, mailbox } from "@/lib/brand";
import { getVisaView, isVisaReference } from "@/lib/visaWishes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ referenceId: string }> };

function decodeRef(raw: string): string {
  return decodeURIComponent(raw).trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const referenceId = decodeRef((await params).referenceId);
  const view = isVisaReference(referenceId) ? await getVisaView(referenceId) : { state: "missing" as const };
  if (view.state !== "paid") {
    const title = view.state === "pending" ? visaSuccess.pendingTitle : view.state === "refunded" ? visaSuccess.refundedTitle : visaSuccess.missingTitle;
    return { title, robots: { index: false, follow: false } };
  }
  const image = `${appUrl()}/api/og/certificate/${encodeURIComponent(referenceId)}`;
  return {
    title: visaSuccess.metaTitle,
    description: visaSuccess.supporting,
    robots: { index: false, follow: false },
    openGraph: {
      title: visaSuccess.heading,
      description: visaSuccess.supporting,
      images: [{ url: image, width: 1200, height: 630, alt: visaSuccess.certificateAlt }],
    },
    twitter: { card: "summary_large_image", title: visaSuccess.heading, description: visaSuccess.supporting, images: [image] },
  };
}

export default async function VisaWishPage({ params }: Props) {
  const referenceId = decodeRef((await params).referenceId);
  const supportHref = `mailto:${mailbox("hello")}`;
  const refreshHref = `/visa/${encodeURIComponent(referenceId)}`;

  if (!isVisaReference(referenceId)) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-mono text-2xl tracking-[0.08em] text-bone">{visaSuccess.missingTitle}</h1>
        <p className="mt-4 text-bone/90">{visaSuccess.missingBody}</p>
        <div className="mt-8">
          <Disclaimer surface="void" />
        </div>
        <p className="mt-8">
          <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
            {visaSuccess.own}
          </Link>
        </p>
      </article>
    );
  }

  const view = await getVisaView(referenceId);

  if (view.state === "missing" || view.state === "pending") {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-mono text-2xl tracking-[0.08em] text-bone">
          {view.state === "missing" ? visaSuccess.missingTitle : visaSuccess.pendingTitle}
        </h1>
        {view.state === "missing" ? <p className="mt-4 text-bone/90">{visaSuccess.missingBody}</p> : <VisaPoller refreshHref={refreshHref} supportHref={supportHref} />}
        <div className="mt-8">
          <Disclaimer surface="void" />
        </div>
        <p className="mt-8">
          <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
            {visaSuccess.own}
          </Link>
        </p>
      </article>
    );
  }

  if (view.state === "refunded") {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-mono text-2xl tracking-[0.08em] text-bone">{visaSuccess.refundedTitle}</h1>
        <p className="mt-4 text-bone/90">{visaSuccess.refundedBody}</p>
        <div className="mt-8">
          <Disclaimer surface="void" />
        </div>
        <p className="mt-8">
          <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
            {visaSuccess.own}
          </Link>
        </p>
      </article>
    );
  }

  const shareUrl = `${appUrl()}/visa/share/${encodeURIComponent(view.certificate.certificateNo)}`;
  const pngHref = `/api/og/certificate/${encodeURIComponent(referenceId)}?download=1`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="bg-indigo px-3 py-2 text-center font-mono text-xs tracking-[0.14em] text-brass-light ring-1 ring-brass/60">
        {visaSuccess.banner}
      </p>
      <h1 className="display mt-8 text-3xl text-bone sm:text-5xl">{visaSuccess.heading}</h1>
      <p className="serif-warm mt-4 text-xl text-bone/90">{visaSuccess.supporting}</p>
      <p className="mt-3 text-sm text-mist">{visaSuccess.privacy}</p>

      <section aria-labelledby="visa-reading-heading" className="mt-10">
        <h2 id="visa-reading-heading" className="font-mono text-sm tracking-[0.18em] text-brass-light">
          {visaSuccess.readingHeading}
        </h2>
        <Suspense fallback={<p className="mt-4 text-bone/90">{visaSuccess.consulting}</p>}>
          <VisaReadingLoader referenceId={referenceId} />
        </Suspense>
      </section>

      <section aria-labelledby="visa-certificate-heading" className="mt-10">
        <h2 id="visa-certificate-heading" className="font-mono text-sm tracking-[0.18em] text-brass-light">
          {visaSuccess.certificateHeading}
        </h2>
        <VisaCertificateView certificate={view.certificate} />
        <a href={pngHref} download={`visa-wish-${view.certificate.certificateNo}.png`} className="btn-outline press mt-4">
          {visaSuccess.download}
        </a>
      </section>

      <section aria-labelledby="visa-share-heading" className="mt-10">
        <h2 id="visa-share-heading" className="font-mono text-sm tracking-[0.18em] text-brass-light">
          {visaShare.heading}
        </h2>
        <VisaShareRow shareUrl={shareUrl} pngHref={pngHref} fileName={`visa-wish-${view.certificate.certificateNo}.png`} />
        <p className="mt-4 text-sm text-mist">{visaSuccess.keepLink}</p>
        <p className="mt-2 text-sm text-mist">{visaSuccess.receiptNote}</p>
      </section>

      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
      <p className="mt-8">
        <Link href="/wish" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          {visaSuccess.own}
        </Link>
      </p>
    </article>
  );
}
