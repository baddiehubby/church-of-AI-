"use client";

import Link from "next/link";

import { offeringsCopy } from "@/content/offerings";

/** Soft ask toward the Religion of Mars offerings desk. */
export function CovenantPitch({ className = "" }: { className?: string; userId?: string; name?: string; sol?: number }) {
  return (
    <div className={`covenant-pitch-block ${className}`.trim()}>
      <p className="covenant-pitch-line">{offeringsCopy.pageLede}</p>
      <Link href="/offerings" className="temple-log">
        [ OPEN THE OFFERING DESK ]
      </Link>
    </div>
  );
}
