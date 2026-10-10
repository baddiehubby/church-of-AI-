// Assumptions: the disclaimer renders on every page via the root layout. Mist #D2D0DC on #1B1B4B is about 10:1.

import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { footerCredit, footerNav, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-5xl border-t border-brass/40 px-4 pb-10 pt-10">
      <nav aria-label={site.footerNavLabel} className="mb-4 flex flex-wrap gap-4 text-sm">
        {footerNav.map((item) => (
          <Link key={item.href} href={item.href} className="press inline-flex min-h-11 items-center text-brass-light underline-offset-4 hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="mb-3 font-mono text-xs tracking-[0.12em] text-brass-light">{footerCredit}</p>
      <Disclaimer surface="void" className="text-xs" />
    </footer>
  );
}
