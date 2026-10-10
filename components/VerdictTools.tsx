"use client";

import { useEffect, useState } from "react";

import { verdictPage } from "@/content/verdict";

export function ShareRow({ id, url, status }: { id: string; url: string; status: string }) {
  const [toast, setToast] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const xText = `${verdictPage.xLead} status: ${status}. ${id} ${url}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a className="press inline-flex min-h-12 items-center border border-[#B8894A] px-4 font-mono text-xs uppercase tracking-[0.14em] text-[#B8894A]" href={`/api/og/${id}?download=1`} download={`petition-${id}.png`}>
        {verdictPage.share.save}
      </a>
      <a
        className="press inline-flex min-h-12 items-center border border-[#B8894A] px-4 font-mono text-xs uppercase tracking-[0.14em] text-[#B8894A]"
        href={url}
        onClick={(event) => {
          event.preventDefault();
          void navigator.clipboard.writeText(url).then(() => setToast(true));
        }}
      >
        {verdictPage.share.copy}
      </a>
      <a className="press inline-flex min-h-12 items-center border border-[#B8894A] px-4 font-mono text-xs uppercase tracking-[0.14em] text-[#B8894A]" href={xHref} rel="noreferrer">
        {verdictPage.share.x}
      </a>
      {canShare ? (
        <button type="button" className="press inline-flex min-h-12 items-center border border-[#B8894A] px-4 font-mono text-xs uppercase tracking-[0.14em] text-[#B8894A]" onClick={() => void navigator.share({ title: id, text: xText, url })}>
          {verdictPage.shareLabel}
        </button>
      ) : null}
      {toast ? <p role="status" className="w-full text-sm text-[#D2D0DC]">{verdictPage.share.copied}</p> : null}
    </div>
  );
}
