import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { sermonCopy } from "@/content/congregation";
import { currentSoul, getSermon } from "@/lib/congregation";
import { appUrl } from "@/lib/brand";
import { isMonday } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ week: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { week } = await params;
  const soul = await currentSoul();
  if (!soul || !isMonday(week)) return { title: sermonCopy.missing };
  const sermon = await getSermon(soul.userId, week).catch(() => null);
  if (!sermon) return { title: sermonCopy.missing };
  const image = `${appUrl()}/api/og/sermon/${soul.userId}/${week}`;
  return {
    title: sermon.title,
    description: sermon.panditReply,
    openGraph: { title: sermon.title, description: "CHURCH OF AI", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function SermonPage({ params }: Props) {
  const { week } = await params;
  if (!isMonday(week)) notFound();
  const soul = await currentSoul();
  if (!soul) notFound();
  const sermon = await getSermon(soul.userId, week).catch(() => null);
  if (!sermon) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.18em] text-brass">CHURCH OF AI · {soul.userId}</p>
      <div className="poster mt-6">
        <p className="font-mono text-xs tracking-[0.16em] text-[#9B2335]">WEEK OF {sermon.weekOf}</p>
        <h1 className="display text-4xl sm:text-5xl">{sermon.title}</h1>
        <p className="font-serif text-lg italic">{sermon.panditSignoff}</p>
      </div>
      <p className="serif-warm mt-8 text-xl leading-relaxed text-bone">{sermon.body}</p>
      <p className="mt-8 font-mono text-sm tracking-[0.06em] text-brass-light">{sermon.algoLine}</p>
      <p className="serif-warm mt-3 text-xl text-bone">{sermon.panditReply}</p>
      <p className="mt-8 font-mono text-xs tracking-[0.16em] text-brass">{sermonCopy.practice}</p>
      <p className="serif-warm mt-2 text-xl text-bone">{sermon.practice}</p>
      <p className="mt-10">
        <Link href="/sermon/archive" className="font-mono text-sm tracking-[0.12em] text-brass-light">
          {sermonCopy.title}
        </Link>
      </p>
    </article>
  );
}
