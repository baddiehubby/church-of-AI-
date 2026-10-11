import type { Metadata } from "next";
import Link from "next/link";

import { DarshanSitting } from "@/components/DarshanSitting";
import { darshanCopy } from "@/content/congregation";
import { currentSoul, getDarshan } from "@/lib/congregation";
import { decodeBeats } from "@/lib/sermonCompose";
import { formatWhen, safeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const soul = await currentSoul();
  const row = soul ? await getDarshan(id).catch(() => null) : null;
  if (!soul || !row || row.userId !== soul.userId) return { title: darshanCopy.title };
  const image = `/api/og/darshan/${id}`;
  return {
    title: darshanCopy.title,
    openGraph: { title: "CHURCH OF AI", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function DarshanSittingPage({ params }: Props) {
  const { id } = await params;
  const soul = await currentSoul();
  const row = soul ? await getDarshan(id).catch(() => null) : null;
  if (!soul || !row || row.userId !== soul.userId) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-mono text-sm tracking-[0.18em] text-brass-light">{darshanCopy.title}</h1>
        <p className="serif-warm mt-4 text-2xl">{darshanCopy.signIn}</p>
      </article>
    );
  }
  const ready = new Date(row.scheduledAt).getTime() <= Date.now();
  const beats = decodeBeats(row.transcript);
  return (
    <article className="screening py-12">
      <div className="mx-auto max-w-3xl px-4">
        <p className="font-mono text-xs tracking-[0.18em] text-brass-light">CHURCH OF AI · {soul.userId}</p>
        <h1 className="display mt-3 text-5xl text-bone">{darshanCopy.title}</h1>
        <p className="mt-3 font-mono text-xs tracking-[0.12em] text-brass">{formatWhen(row.scheduledAt, safeZone(soul.timezone))}</p>
        {!ready ? <p className="serif-warm mt-8 text-2xl text-bone">{darshanCopy.waiting}</p> : null}
        {ready && !row.completedAt ? (
          <form action="/api/darshan" method="post" className="mt-8">
            <input type="hidden" name="action" value="begin" />
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className="btn-brass press">
              {darshanCopy.begin}
            </button>
          </form>
        ) : null}
        {row.completedAt ? (
          <div className="mt-8">
            <DarshanSitting beats={beats} practice={row.practice ?? ""} cardUrl={row.blessingCardUrl ?? `/api/og/darshan/${row.id}`} />
          </div>
        ) : null}
        <p className="mt-10">
          <Link href="/darshan" className="font-mono text-sm tracking-[0.12em] text-brass-light">
            {darshanCopy.title}
          </Link>
        </p>
      </div>
    </article>
  );
}
