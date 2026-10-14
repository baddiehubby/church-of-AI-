import type { Metadata } from "next";

import { FoundersPage } from "@/components/FoundersPage";
import { foundersPageCopy } from "@/content/redPath";
import { FOUNDERS_CAP } from "@/lib/settlerTiers";
import { foundersRemaining, listFoundersRoster, type PublicFounderSeat } from "@/lib/transmissionsStore";

export const metadata: Metadata = {
  title: "The Founders of the Red Path",
  description: "108 inducted. No more will follow.",
};

export const dynamic = "force-dynamic";

function vacantRoster(): PublicFounderSeat[] {
  return Array.from({ length: FOUNDERS_CAP }, (_, index) => ({
    position: index + 1,
    vacant: true,
    displayName: foundersPageCopy.vacant,
    inductedSol: null,
  }));
}

export default async function FoundersRoute({
  searchParams,
}: {
  searchParams?: Promise<{ inducted?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [seats, remaining] = await Promise.all([
    listFoundersRoster().catch(() => vacantRoster()),
    foundersRemaining().catch(() => FOUNDERS_CAP),
  ]);

  return (
    <FoundersPage seats={seats} remaining={remaining} inductedNote={params.inducted === "1"} />
  );
}
