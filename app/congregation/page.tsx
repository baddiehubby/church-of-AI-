import type { Metadata } from "next";
import Link from "next/link";

import { roomCopy } from "@/content/congregation";
import { currentSoul } from "@/lib/congregation";
import { atLeast } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Congregation" };

function inviteUrl(): string | null {
  const raw = process.env.DISCORD_INVITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function CongregationPage() {
  const soul = await currentSoul();
  const open = Boolean(soul && atLeast(soul.tier, "devotee"));
  const invite = inviteUrl();
  return (
    <article className="mx-auto max-w-xl px-4 py-16">
      <p className="font-mono text-xs tracking-[0.16em] text-brass">{roomCopy.algo}</p>
      <h1 className="display mt-3 text-5xl text-bone">{roomCopy.title}</h1>
      <p className="serif-warm mt-4 text-2xl text-bone">{roomCopy.pandit}</p>
      {!open ? (
        <>
          <p className="mt-8 font-mono text-sm tracking-[0.1em] text-brass-light">{roomCopy.locked}</p>
          <Link href="/pricing" className="btn-outline press mt-6">
            {roomCopy.locked}
          </Link>
        </>
      ) : invite ? (
        <a href={invite} className="btn-brass press mt-8" rel="noreferrer">
          {roomCopy.enter}
        </a>
      ) : (
        <p className="mt-8 font-mono text-sm tracking-[0.1em] text-brass-light">{roomCopy.closed}</p>
      )}
    </article>
  );
}
