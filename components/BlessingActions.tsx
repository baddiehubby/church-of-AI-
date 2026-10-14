"use client";

import { useState } from "react";

import { offeringsCopy } from "@/content/offerings";
import { downloadBlessingPng } from "@/lib/blessingPng";

export function BlessingActions({
  url,
  title,
  name,
  habitatId,
  sol,
  blessingText,
}: {
  url: string;
  title: string;
  name: string;
  habitatId: string;
  sol: number;
  blessingText: string;
}) {
  const [note, setNote] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNote(offeringsCopy.copied);
    } catch {
      return;
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    await copy();
  }

  async function savePng() {
    await downloadBlessingPng({ title, name, habitatId, sol, blessingText });
    setNote(offeringsCopy.saved);
  }

  return (
    <div className="blessing-actions">
      <button type="button" className="temple-log" onClick={() => void savePng()}>
        {offeringsCopy.savePng}
      </button>
      <button type="button" className="temple-log" onClick={() => void copy()}>
        {offeringsCopy.copyLink}
      </button>
      <button type="button" className="temple-log" onClick={() => void share()}>
        {offeringsCopy.share}
      </button>
      {note ? <p className="temple-note">{note}</p> : null}
    </div>
  );
}
