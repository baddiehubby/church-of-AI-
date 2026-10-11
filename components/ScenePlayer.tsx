"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AltarFilm } from "@/components/AltarFilm";
import { Disclaimer } from "@/components/Disclaimer";
import type { AltarSceneFrame } from "@/lib/sceneFrame";

export function ScenePlayer({ frame }: { frame: AltarSceneFrame }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <section className="altar-night">
        <Disclaimer surface="void" className="relative z-10 mx-auto px-4 pb-6 text-center" />
      </section>
    );
  }
  return <AltarFilm frame={frame} onAgain={() => router.push("/")} />;
}
