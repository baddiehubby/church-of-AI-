import type { Metadata } from "next";

import { EpisodeSpread } from "@/components/EpisodeSpread";
import { currentSoul } from "@/lib/congregation";
import { isSunday } from "@/lib/episodeCompose";
import { episodeAllowed } from "@/lib/seat";

export const metadata: Metadata = {
  title: "The episode",
  description: "A weekly episode from the altar. Fictional entertainment. The week is on file; nothing here is promised.",
};

export default async function EpisodePage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const soul = await currentSoul();
  return <EpisodeSpread week={isSunday(week) ? week : null} allowed={episodeAllowed(soul?.tier ?? "pilgrim")} />;
}
