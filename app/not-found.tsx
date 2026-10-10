import Link from "next/link";

import { site } from "@/content/site";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-mono text-2xl tracking-[0.12em] text-bone">{site.notFoundTitle}</h1>
      <p className="serif-warm mt-4 text-xl text-bone">{site.notFoundBody}</p>
      <Link href="/#wish" className="btn-brass press mt-8">
        {site.notFoundCta}
      </Link>
    </div>
  );
}
