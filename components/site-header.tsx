// Assumptions: tiny header; the wordmark and one anchor fit at 390px, so no mobile drawer is needed.

import Link from "next/link";

import { nav, site } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href="/" className="press font-mono text-sm tracking-[0.22em] text-brass-light">
        {site.name}
      </Link>
      <nav aria-label={site.navLabel} className="flex flex-wrap items-center gap-2">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="press inline-flex min-h-11 items-center border border-brass px-2 font-mono text-[0.65rem] tracking-[0.12em] text-brass-light">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
