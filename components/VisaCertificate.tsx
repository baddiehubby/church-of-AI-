// Assumptions: HTML Visa Wish Certificate on the private success page. Same fields as the OG renderer
// (brand, category, country, sanitized wish, public certificate number, issue date, entertainment disclaimer).
// React escapes the wish. Never says "approved".

import { Disclaimer } from "@/components/Disclaimer";
import { visaSuccess } from "@/content/visa";
import type { VisaCertificate } from "@/lib/visaWishes";

function day(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toISOString().slice(0, 10);
}

export function VisaCertificateView({ certificate }: { certificate: VisaCertificate }) {
  const title = certificate.firstName ? certificate.firstName.toUpperCase() : "ON THE RECORD";
  return (
    <div className="petition-scroll mt-4 px-5 py-8 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs tracking-[0.18em] text-maroon">SACHA PANDIT</p>
        <p className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.certificateHeading}</p>
      </div>
      <p className="mt-4 bg-indigo px-3 py-2 text-center font-mono text-xs tracking-[0.14em] text-brass-light">{visaSuccess.banner}</p>
      <h3 className="display mt-6 text-3xl sm:text-5xl">{title}</h3>
      <p className="serif-warm mt-4 text-xl leading-relaxed">“{certificate.wish}”</p>
      <dl className="mt-8 grid gap-4 border-t border-brass/70 pt-6 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.category}</dt>
          <dd className="mt-1 font-mono text-sm uppercase">{certificate.categoryLabel}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.country}</dt>
          <dd className="mt-1 font-mono text-sm uppercase">{certificate.country}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.reference}</dt>
          <dd className="mt-1 font-mono text-sm">{certificate.certificateNo}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.issued}</dt>
          <dd className="mt-1 font-mono text-sm">{day(certificate.issuedAt)}</dd>
        </div>
      </dl>
      <div className="mt-6 border-t border-brass/70 pt-4">
        <Disclaimer surface="cream" className="text-xs" />
      </div>
    </div>
  );
}
