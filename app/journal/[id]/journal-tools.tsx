"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { premiumJournal } from "@/content/premium";
import { isRecord } from "@/lib/guards";

export function JournalTools({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [includeWish, setIncludeWish] = useState(false);

  async function share(): Promise<void> {
    const response = await fetch(`/api/journal/${encodeURIComponent(entryId)}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ includeWish }),
    });
    const payload: unknown = await response.json().catch(() => ({}));
    const record = isRecord(payload) ? payload : {};
    if (typeof record.publicId === "string") setShareUrl(`${window.location.origin}/card/${record.publicId}`);
  }

  async function remove(): Promise<void> {
    if (!window.confirm(premiumJournal.confirmDelete)) return;
    const response = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, { method: "DELETE" });
    if (response.ok) router.push("/journal");
  }

  return (
    <div className="mt-8 grid gap-4">
      <label className="flex min-h-12 items-center gap-3 text-sm text-bone/90">
        <input type="checkbox" checked={includeWish} onChange={(event) => setIncludeWish(event.target.checked)} />
        {premiumJournal.sharePublic}
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-outline press" onClick={() => void share()}>
          {premiumJournal.share}
        </button>
        <button type="button" className="btn-outline press" onClick={() => void remove()}>
          {premiumJournal.delete}
        </button>
      </div>
      {shareUrl ? (
        <p className="text-sm text-brass-light">
          <a href={shareUrl} className="underline">
            {shareUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}
