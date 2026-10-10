"use client";

// Assumptions: share tools for a paid visa wish. Every link points at the public share page (certificate number),
// never the private reference link. Native share appears only where navigator.share exists. WhatsApp uses
// wa.me with the encoded caption and link. The PNG comes from the certificate OG route with ?download=1.

import { useEffect, useState } from "react";

import { visaShare } from "@/content/visa";

const button = "press inline-flex min-h-12 items-center border border-brass px-4 font-mono text-xs tracking-[0.14em] text-brass-light";

export function VisaShareRow({ shareUrl, pngHref, fileName }: { shareUrl: string; pngHref: string; fileName: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const text = `${visaShare.caption} ${shareUrl}`;

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <a
        className={button}
        href={shareUrl}
        onClick={(event) => {
          event.preventDefault();
          void navigator.clipboard.writeText(shareUrl).then(() => setCopied(true));
        }}
      >
        {visaShare.copy}
      </a>
      {canShare ? (
        <button type="button" className={button} onClick={() => void navigator.share({ title: visaShare.sharedTitle, text: visaShare.caption, url: shareUrl }).catch(() => undefined)}>
          {visaShare.native}
        </button>
      ) : null}
      <a className={button} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        {visaShare.whatsapp}
      </a>
      <a className={button} href={pngHref} download={fileName}>
        {visaShare.download}
      </a>
      <p role="status" className="w-full text-sm text-mist">
        {copied ? visaShare.copied : ""}
      </p>
    </div>
  );
}
