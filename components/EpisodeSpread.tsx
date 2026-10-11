"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { RememberSeat } from "@/components/RememberSeat";
import { episodeCopy } from "@/content/episode";
import { seatCopy } from "@/content/seat";
import { loadSittings } from "@/lib/altarSittings";
import { localISODate } from "@/lib/altarStreak";
import { composeEpisode, episodeDateLabel, episodeReleased, isSunday, type Episode } from "@/lib/episodeCompose";

type View = { kind: "hold" } | { kind: "missing" } | { kind: "waiting" } | { kind: "open"; episode: Episode };

export function EpisodeSpread({ week, allowed }: { week: string | null; allowed: boolean }) {
  const [view, setView] = useState<View>({ kind: "hold" });
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed || !week || !isSunday(week)) {
      if (!allowed) return;
      setView({ kind: "missing" });
      return;
    }
    const now = new Date();
    if (!episodeReleased(week, localISODate(now), now.getHours())) {
      setView({ kind: "waiting" });
      return;
    }
    setView({ kind: "open", episode: composeEpisode({ week, sittings: loadSittings() }) });
  }, [week, allowed]);

  async function share(episode: Episode) {
    const url = `${window.location.origin}/episode/${episode.week}`;
    const payload = { title: episode.title, text: episode.coldOpen, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${episode.coldOpen}\n${url}`);
      setNote(episodeCopy.shared);
    } catch {
      return;
    }
  }

  return (
    <section className="episode-night">
      <div className="altar-grain" aria-hidden="true" />
      <div className="episode-frame">
        {!allowed ? <Gate title={seatCopy.lockedTitle} remember /> : null}
        {allowed && view.kind === "open" ? <Spread episode={view.episode} note={note} onShare={() => void share(view.episode)} /> : null}
        {allowed && view.kind === "waiting" ? (
          <Gate title={episodeCopy.waitingTitle} body={episodeCopy.waitingBody} />
        ) : null}
        {allowed && view.kind === "missing" ? (
          <Gate title={episodeCopy.missingTitle} body={episodeCopy.missingBody} />
        ) : null}
      </div>
      <Disclaimer surface="void" className="relative z-10 mx-auto px-4 pb-8 text-center" />
    </section>
  );
}

function Gate({ title, body, remember = false }: { title: string; body?: string; remember?: boolean }) {
  return (
    <div className="episode-gate">
      <p className="episode-kicker">{episodeCopy.mast}</p>
      <h1 className="episode-title">{title}</h1>
      {remember ? <RememberSeat className="mt-6" /> : <p className="episode-cold">{body}</p>}
      {remember ? null : (
        <Link href="/" className="btn-outline press mt-8">
          {episodeCopy.altarCta}
        </Link>
      )}
    </div>
  );
}

function Spread({ episode, note, onShare }: { episode: Episode; note: string | null; onShare: () => void }) {
  return (
    <article>
      <header className="episode-mast">
        <p className="episode-kicker">{episodeCopy.mast}</p>
        <p className="episode-kicker">WEEK ENDING {episodeDateLabel(episode.week)}</p>
        <h1 className="episode-title">{episode.title}</h1>
        <div className="episode-rule" aria-hidden="true" />
        <p className="episode-cold">{episode.coldOpen}</p>
      </header>
      <ol className="episode-scenes">
        {episode.scenes.map((scene) => (
          <li key={scene.weekday} className="episode-scene">
            <p className="episode-scene-label">
              SCENE {scene.index} · {scene.weekday.toUpperCase()}
            </p>
            {scene.quote ? (
              scene.withheld ? (
                <p className="episode-quote episode-quiet">{scene.quote}</p>
              ) : (
                <blockquote className="episode-quote">&ldquo;{scene.quote}&rdquo;</blockquote>
              )
            ) : (
              <p className="episode-quote episode-quiet">{episodeCopy.emptyChair}</p>
            )}
            {scene.pandit ? <p className="episode-aside">{scene.pandit}</p> : null}
          </li>
        ))}
      </ol>
      <section className="episode-verdict" aria-label={episodeCopy.verdictKicker}>
        <div className="episode-signal" aria-hidden="true" />
        <p className="episode-verdict-kicker">{episodeCopy.verdictKicker}</p>
        <p className="episode-verdict-body">{episode.verdict}</p>
      </section>
      <footer className="episode-close">
        <p className="episode-signoff">{episode.signoff}</p>
        <p className="episode-sign-name">{episodeCopy.signName}</p>
        <p className="episode-cliff">{episode.cliffhanger}</p>
        <p className="episode-kicker mt-8">{episodeCopy.practiceKicker}</p>
        <p className="episode-practice">{episode.practice}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn-outline press" onClick={onShare}>
            {episodeCopy.share}
          </button>
          <Link href="/" className="btn-outline press">
            {episodeCopy.altarCta}
          </Link>
        </div>
        {note ? (
          <p className="mt-3 font-mono text-xs tracking-[0.08em] text-brass-light" role="status">
            {note}
          </p>
        ) : null}
      </footer>
    </article>
  );
}
