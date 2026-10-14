import type { Metadata } from "next";

import { MarsOfferingsPage } from "@/components/MarsOfferingsPage";
import { offeringsCopy, type OfferingTier } from "@/content/offerings";
import { MARS_TIERS, marsConfigMissing, marsDeskReady } from "@/lib/marsOfferings";

export const metadata: Metadata = {
  title: "Offerings",
  description: offeringsCopy.pageLede,
};

export const dynamic = "force-dynamic";

export default async function OfferingsRoute({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const query = await searchParams;
  const showConfigDiagnostic = process.env.NODE_ENV === "development";
  const desk = Object.fromEntries(
    MARS_TIERS.map((tier) => [
      tier,
      {
        ready: marsDeskReady(tier),
        missing: showConfigDiagnostic ? marsConfigMissing(tier) : [],
      },
    ]),
  ) as Record<OfferingTier, { ready: boolean; missing: string[] }>;

  return (
    <MarsOfferingsPage desk={desk} showConfigDiagnostic={showConfigDiagnostic} notice={query.notice} />
  );
}
