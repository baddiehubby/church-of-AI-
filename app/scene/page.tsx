import type { Metadata } from "next";
import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { ScenePlayer } from "@/components/ScenePlayer";
import { altarScene } from "@/content/altarScene";
import { parseSceneFrame } from "@/lib/sceneFrame";

export const metadata: Metadata = {
  title: "The scene",
  description: altarScene.title,
};

export default async function ScenePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const frame = parseSceneFrame(await searchParams);
  if (!frame) {
    return (
      <section className="altar-night">
        <div className="altar-stage">
          <h1 className="font-mono text-sm tracking-[0.18em] text-brass-light">{altarScene.missingTitle}</h1>
          <p className="serif-warm mt-4 text-2xl text-bone">{altarScene.missingBody}</p>
          <Link href="/" className="btn-outline press mt-8">
            {altarScene.missingCta}
          </Link>
        </div>
        <Disclaimer surface="void" className="relative z-10 mx-auto px-4 pb-6 text-center" />
      </section>
    );
  }
  return <ScenePlayer frame={frame} />;
}
