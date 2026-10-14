import type { Metadata, Viewport } from "next";

import { MarsWorldHome } from "@/components/MarsWorldHome";
import { marsWorld } from "@/content/marsWorld";
import { getColonyStatus } from "@/lib/transmissionsStore";

export const metadata: Metadata = {
  title: "The Religion of Mars",
  description: marsWorld.lede,
};

export const viewport: Viewport = {
  themeColor: "#0A0E27",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const colony = await getColonyStatus().catch(() => ({
    settlers_active_today: 0,
    transmissions_since_sunrise: 0,
    streaks_broken_yesterday: 0,
    founders_inducted: 0,
    founders_remaining: 108,
  }));

  return (
    <MarsWorldHome
      foundersInducted={colony.founders_inducted}
      foundersRemaining={colony.founders_remaining}
      settlersActiveToday={colony.settlers_active_today}
    />
  );
}
