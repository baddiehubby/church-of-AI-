import type { Metadata } from "next";

import { AltarBell } from "@/components/AltarBell";
import { altarScene } from "@/content/altarScene";
import { currentSoul } from "@/lib/congregation";

export const metadata: Metadata = {
  title: "The altar",
  description: altarScene.placeholder,
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const query = await searchParams;
  const soul = await currentSoul();
  return <AltarBell tier={soul?.tier ?? "pilgrim"} notice={query.notice ?? null} />;
}
