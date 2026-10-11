// Assumptions: shared plain layout for Terms, Privacy, and Refunds; copy lives in content/legal.ts.
// The exact site disclaimer is also rendered here so policy pages carry it in the article, not only the footer.

import { Disclaimer } from "@/components/Disclaimer";
import type { LegalPage as LegalPageCopy } from "@/content/legal";

export function LegalPage({ page }: { page: LegalPageCopy }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-mono text-3xl tracking-[0.14em] text-brass-light">{page.title}</h1>
      {page.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="serif-warm text-xl text-bone">{section.heading}</h2>
          <p className="mt-2 leading-relaxed text-bone/90">{section.body}</p>
        </section>
      ))}
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
