import { BabaSignature } from "@/components/BabaSignature";
import { offeringsCopy, offeringTiers, type OfferingTier } from "@/content/offerings";

export function BlessingCard({
  tier,
  name,
  habitatId,
  sol,
  blessingText,
  message,
}: {
  tier: OfferingTier;
  name: string;
  habitatId: string;
  sol: number;
  blessingText: string;
  message?: string | null;
}) {
  return (
    <article className="blessing-card" id="blessing-card">
      <p className="blessing-card-kicker">{offeringsCopy.cardTitle}</p>
      <p className="blessing-card-for">{offeringTiers[tier].label}</p>
      <div className="blessing-card-rule" aria-hidden="true" />
      <p className="blessing-card-for">for {name}</p>
      <p className="blessing-card-meta">
        Habitat {habitatId} · Sol {sol}
      </p>
      {message ? <p className="blessing-card-text">&ldquo;{message}&rdquo;</p> : null}
      <p className="blessing-card-text">&ldquo;{blessingText}&rdquo;</p>
      <div className="blessing-card-sign">
        <p>— Baba ji</p>
        <BabaSignature className="blessing-signature" />
      </div>
      <p className="sr-only">{offeringTiers[tier].label}</p>
    </article>
  );
}
