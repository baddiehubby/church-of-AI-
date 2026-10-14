import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BabaJi } from "@/components/BabaJi";
import { BlessingActions } from "@/components/BlessingActions";
import { BlessingCard } from "@/components/BlessingCard";
import { BlessingRemember } from "@/components/BlessingRemember";
import { Disclaimer } from "@/components/Disclaimer";
import { offeringsCopy, offeringTiers } from "@/content/offerings";
import { getBlessing } from "@/lib/blessingsStore";
import { appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const blessing = UUID.test(id) ? await getBlessing(id) : null;
  const title = blessing ? `${offeringsCopy.cardTitle} · ${blessing.name}` : offeringsCopy.cardTitle;
  return { title, description: offeringsCopy.successLine };
}

export default async function BlessingPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const blessing = await getBlessing(id);
  if (!blessing) notFound();

  if (blessing.status !== "issued") {
    return (
      <section className="temple blessing-page">
        <div className="temple-sky" aria-hidden="true" />
        <div className="temple-grain" aria-hidden="true" />
        <div className="blessing-stage">
          <p className="ritual-kicker">{offeringsCopy.waiting}</p>
          <p className="ritual-opening">{offeringsCopy.waitingBody}</p>
          <meta httpEquiv="refresh" content="6" />
        </div>
        <Disclaimer surface="void" className="temple-disclaimer mx-auto px-4 pb-6 text-center" />
      </section>
    );
  }

  const url = `${appUrl()}/blessing/${blessing.id}`;
  const title = offeringTiers[blessing.tier]?.label ?? offeringsCopy.cardTitle;

  return (
    <section className="temple blessing-page">
      <BlessingRemember tier={blessing.tier} blessingId={blessing.id} habitatId={blessing.habitatId} />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />
      <div className="blessing-stage">
        <div className="ritual-figure">
          <BabaJi pose="up" />
        </div>
        <p className="ritual-opening">{offeringsCopy.successLine}</p>
        <BlessingCard
          tier={blessing.tier}
          name={blessing.name}
          habitatId={blessing.habitatId}
          sol={blessing.sol}
          blessingText={blessing.blessingText}
          message={blessing.message}
        />
        <BlessingActions
          url={url}
          title={title}
          name={blessing.name}
          habitatId={blessing.habitatId}
          sol={blessing.sol}
          blessingText={blessing.blessingText}
        />
        <p className="blessing-remembers">{offeringsCopy.remembers}</p>
        {blessing.tier === "wall" ? (
          <Link href="/wall" className="temple-log mt-4">
            WALL OF MARS
          </Link>
        ) : null}
        {blessing.tier === "patron" ? (
          <Link href="/patrons" className="temple-log mt-4">
            PATRONS OF MARS
          </Link>
        ) : null}
        {blessing.tier === "founder_engraving" ? (
          <Link href="/monument" className="temple-log mt-4">
            FOUNDER MONUMENT
          </Link>
        ) : null}
        <Link href="/offerings" className="temple-log mt-4">
          {offeringsCopy.returnTemple}
        </Link>
      </div>
      <Disclaimer surface="void" className="temple-disclaimer mx-auto px-4 pb-6 text-center" />
    </section>
  );
}
