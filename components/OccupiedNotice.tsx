import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { occupiedCopy } from "@/content/safety";

export function OccupiedNotice({ retryHref }: { retryHref: string }) {
  return (
    <article className="grain bg-[#1B1B4B] px-5 py-20 text-center text-[#F2EDE4]">
      <p className="serif-warm mx-auto max-w-xl text-xl">{occupiedCopy.message}</p>
      <p className="mt-6">
        <Link href={retryHref} className="font-mono text-sm tracking-[0.12em] text-[#E2C48A] underline">
          {occupiedCopy.retry}
        </Link>
      </p>
      <div className="mx-auto mt-10 max-w-3xl text-left">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
