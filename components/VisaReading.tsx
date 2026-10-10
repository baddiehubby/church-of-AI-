// Assumptions: server component rendering a stored visa reading in the restored verdict layout (Algorithm in mono
// caps, Pandit ji's line in lowercase serif). VisaReadingLoader generates the reading once after payment (inside a
// Suspense boundary, so the heading and banner render first) and reuses the stored one on every later view.

import { visaSuccess } from "@/content/visa";
import { ensureVisaReading, type VisaReading } from "@/lib/visaWishes";

export function VisaReadingView({ reading }: { reading: VisaReading }) {
  return (
    <div className="petition-scroll mt-4 px-5 py-8 sm:px-10">
      <dl>
        <div className="py-3">
          <dt className="font-mono text-xs tracking-[0.16em]">{visaSuccess.labels.status}</dt>
          <dd className="display mt-2 text-3xl sm:text-5xl">{reading.status}</dd>
        </div>
        <div className="border-t border-brass/70 py-4">
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.sacrifices}</dt>
          <dd>
            <ol className="mt-3 list-decimal space-y-2 pl-5 font-mono text-sm uppercase tracking-[0.06em]">
              {reading.sacrifices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </dd>
        </div>
        <div className="border-t border-brass/70 py-4">
          <dt className="font-mono text-xs tracking-[0.16em] text-maroon">{visaSuccess.labels.counsel}</dt>
          <dd className="mt-3 font-mono text-sm uppercase leading-relaxed tracking-[0.04em]">{reading.counsel}</dd>
        </div>
        <div className="border-t border-brass/70 py-4">
          <dt className="font-mono text-xs tracking-[0.16em]">{visaSuccess.labels.probability}</dt>
          <dd className="mt-2 font-mono text-lg">{reading.probability}</dd>
        </div>
      </dl>
      <p className="font-mono mt-2 border-t border-brass/70 pt-6 text-center text-lg tracking-[0.14em] text-maroon">{visaSuccess.spoken}</p>
      <p className="serif-warm mt-6 text-right text-xl italic">{reading.panditReply}</p>
    </div>
  );
}

export async function VisaReadingLoader({ referenceId }: { referenceId: string }) {
  const reading = await ensureVisaReading(referenceId);
  if (!reading) return <p className="mt-4 text-bone/90">{visaSuccess.consulting}</p>;
  return <VisaReadingView reading={reading} />;
}
