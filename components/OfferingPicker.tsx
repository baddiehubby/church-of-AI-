"use client";

import Link from "next/link";

import { offeringsCopy } from "@/content/offerings";

/** Legacy altar picker — points settlers to the Religion of Mars offerings desk. */
export function OfferingPicker({ onTransmit }: { open?: Record<string, boolean>; onTransmit: () => void }) {
  return (
    <div className="offering-picker">
      <p className="offering-picker-title">{offeringsCopy.pageTitle}</p>
      <p className="offering-picker-sub">{offeringsCopy.pageLede}</p>
      <div className="offering-buttons">
        <button type="button" className="temple-log" onClick={onTransmit}>
          {offeringsCopy.returnTemple}
        </button>
        <Link href="/offerings" className="temple-log">
          [ OPEN THE OFFERING DESK ]
        </Link>
      </div>
    </div>
  );
}
