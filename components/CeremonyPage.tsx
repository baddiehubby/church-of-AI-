import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { MarsHorizon } from "@/components/MarsHorizon";
import { ceremonyCopy } from "@/content/ceremony";
import type { CeremonyRecord } from "@/lib/ceremony";

export function CeremonyPage({ ceremony }: { ceremony: CeremonyRecord | null }) {
  if (!ceremony) {
    return (
      <section className="ceremony temple" aria-labelledby="ceremony-missing">
        <MarsHorizon />
        <div className="temple-sky" aria-hidden="true" />
        <div className="temple-grain" aria-hidden="true" />
        <div className="ceremony-sheet">
          <h1 id="ceremony-missing" className="ceremony-title">
            {ceremonyCopy.missing}
          </h1>
          <Link href="/" className="archive-back">
            RETURN
          </Link>
          <Disclaimer surface="void" className="temple-disclaimer" />
        </div>
      </section>
    );
  }

  const videoReady = ceremony.video_status === "ready" && ceremony.video_url;

  return (
    <section className="ceremony temple" aria-labelledby="ceremony-title">
      <MarsHorizon />
      <div className="temple-sky" aria-hidden="true" />
      <div className="temple-dust temple-dust-a" aria-hidden="true" />
      <div className="temple-dust temple-dust-b" aria-hidden="true" />
      <div className="temple-grain" aria-hidden="true" />

      <div className="ceremony-sheet">
        <p className="ceremony-eyebrow">FOUNDER {ceremony.position} · PRIVATE</p>
        <h1 id="ceremony-title" className="ceremony-title">
          {ceremonyCopy.title}
        </h1>

        {videoReady ? (
          <div className="ceremony-video">
            <p className="ceremony-hint">{ceremonyCopy.videoReady}</p>
            <video controls playsInline preload="metadata" src={ceremony.video_url ?? undefined}>
              <track kind="captions" />
            </video>
          </div>
        ) : (
          <p className="ceremony-hint">
            {ceremony.video_status === "pending" ? ceremonyCopy.videoPending : ceremonyCopy.videoReady}
          </p>
        )}

        <article className="ceremony-script">
          {ceremony.script.split("\n").map((line, index) =>
            line.trim() ? (
              <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
            ) : (
              <br key={`br-${index}`} />
            ),
          )}
        </article>

        <p className="ceremony-sign">{ceremonyCopy.signed}</p>

        <Link href="/founders" className="archive-back">
          THE FOUNDERS
        </Link>

        <Disclaimer surface="void" className="temple-disclaimer" />
      </div>
    </section>
  );
}
