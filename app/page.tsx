import type { Metadata } from "next";

import { PoojaAltar } from "@/components/PoojaAltar";
import { altarCopy, layersCopy } from "@/content/congregation";
import { loadAltar } from "@/lib/altarView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The altar",
  description: altarCopy.question,
};

export default async function HomePage() {
  const altar = await loadAltar();
  return (
    <>
      <PoojaAltar initial={altar} />
      <section aria-labelledby="layers-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2 id="layers-heading" className="font-mono text-sm tracking-[0.2em] text-brass-light">
          {layersCopy.heading}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {layersCopy.steps.map((step, index) => (
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
