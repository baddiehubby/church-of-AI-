"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AltarFilm } from "@/components/AltarFilm";
import { Disclaimer } from "@/components/Disclaimer";
import { RememberSeat } from "@/components/RememberSeat";
import { StreakMark } from "@/components/StreakMark";
import { altarErrors, altarScene, ALTAR_STATUSES, welcomeBackLine, type AltarReading } from "@/content/altarScene";
import { poojaErrors } from "@/content/congregation";
import { episodeCopy } from "@/content/episode";
import { seatCopy } from "@/content/seat";
import { keepSitting, loadMail, loadPoojaCount, loadSittings, notePooja, saveMail } from "@/lib/altarSittings";
import { dayOfYear, sceneSoulId, type AltarSceneFrame } from "@/lib/sceneFrame";
import { completePooja, loadStreak, localISODate, saveStreak, streakView, welcomeDay, yesterdayFrame, type StreakRecord } from "@/lib/altarStreak";
import { altarEpisodeLink, isEpisodeMail } from "@/lib/episodeCompose";
import { syncEpisode } from "@/lib/episodeSync";
import { atLeast, type Tier } from "@/lib/tiers";

type Phase = "idle" | "listening" | "spoken";

function isReading(value: unknown): value is AltarReading {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.algo_status === "string" &&
    (ALTAR_STATUSES as readonly string[]).includes(record.algo_status) &&
    typeof record.algo_counsel === "string" &&
    typeof record.pandit_reply === "string" &&
    typeof record.verdict_card === "string"
  );
}

function errorText(value: unknown): string {
  if (!value || typeof value !== "object") return altarErrors.upstream;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : altarErrors.upstream;
}

function chime(): void {
  const audio = new AudioContext();
  const tone = audio.createOscillator();
  const level = audio.createGain();
  tone.type = "sine";
  tone.frequency.value = 523.25;
  level.gain.setValueAtTime(0.0001, audio.currentTime);
  level.gain.exponentialRampToValueAtTime(0.07, audio.currentTime + 0.02);
  level.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.3);
  tone.connect(level);
  level.connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.3);
  window.setTimeout(() => void audio.close(), 500);
}

export function AltarBell({ tier = "pilgrim", notice = null }: { tier?: Tier; notice?: string | null }) {
  const [line, setLine] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [bright, setBright] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [frame, setFrame] = useState<AltarSceneFrame | null>(null);
  const [record, setRecord] = useState<StreakRecord | null>(null);
  const [roll, setRoll] = useState(false);
  const [recall, setRecall] = useState(false);
  const [episodeLink, setEpisodeLink] = useState<{ week: string; kind: "current" | "last" | "waiting" } | null>(null);
  const [mail, setMail] = useState("");
  const [mailNote, setMailNote] = useState<string | null>(null);
  const [poojaCount, setPoojaCount] = useState(0);
  const busy = useRef(false);
  const believer = atLeast(tier, "believer");

  useEffect(() => {
    setRecord(loadStreak());
    setMail(loadMail());
    setPoojaCount(loadPoojaCount());
    setEpisodeLink(altarEpisodeLink(localISODate(), new Date().getHours(), loadSittings().map((sitting) => sitting.date)));
    void syncEpisode();
  }, []);

  const today = localISODate();
  const view = record ? streakView(record, today) : null;
  const greet = record ? welcomeDay(record, today) : null;
  const prior = record ? yesterdayFrame(record, today) : null;

  async function ring() {
    if (busy.current) return;
    const reflection = line.trim();
    if (!reflection) {
      setPhase("idle");
      setFrame(null);
      setNote(altarErrors.empty);
      return;
    }
    if (!believer && loadSittings().some((sitting) => sitting.date === localISODate())) {
      setPhase("idle");
      setFrame(null);
      setNote(poojaErrors.already);
      return;
    }
    busy.current = true;
    chime();
    setBright(true);
    setPhase("listening");
    setFrame(null);
    setNote(null);
    window.setTimeout(() => setBright(false), 800);
    const started = performance.now();
    try {
      const response = await fetch("/api/pooja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const payload: unknown = await response.json();
      const wait = 1500 - (performance.now() - started);
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      if (!response.ok || !isReading(payload)) {
        setPhase("idle");
        setNote(errorText(payload));
        return;
      }
      const sitting = { soulId: sceneSoulId(), day: dayOfYear(), reading: payload };
      const next = completePooja(loadStreak(), localISODate(), sitting);
      saveStreak(next.record);
      const sittings = keepSitting({
        date: localISODate(),
        reflection,
        pandit: payload.pandit_reply,
        status: payload.algo_status,
      });
      setEpisodeLink(altarEpisodeLink(localISODate(), new Date().getHours(), sittings.map((item) => item.date)));
      setPoojaCount(notePooja());
      void syncEpisode();
      setRecord(next.record);
      setRoll(next.rolled);
      setRecall(false);
      setFrame(sitting);
      setPhase("spoken");
    } catch {
      const wait = 1500 - (performance.now() - started);
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      setPhase("idle");
      setNote(altarErrors.upstream);
    } finally {
      busy.current = false;
    }
  }

  function showYesterday() {
    const stored = loadStreak();
    const scene = yesterdayFrame(stored, localISODate());
    if (!scene) return;
    setRecord(stored);
    setRoll(false);
    setRecall(true);
    setFrame(scene);
    setPhase("spoken");
  }

  function leaveRecall() {
    setRecall(false);
    setRoll(false);
    setFrame(null);
    setPhase("idle");
  }

  function keepAddress() {
    const trimmed = mail.trim();
    if (trimmed && !isEpisodeMail(trimmed)) {
      setMailNote(episodeCopy.mailBad);
      return;
    }
    setMailNote(null);
    saveMail(trimmed);
    void syncEpisode();
  }

  const episodeLabel = episodeLink?.kind === "last" ? episodeCopy.lastLink : episodeCopy.link;

  return (
    <section className="altar-night" aria-labelledby="altar-bell-title">
      <div className="altar-grain" aria-hidden="true" />
      <div className={phase === "idle" ? "altar-veil" : "altar-veil altar-veil-dim"} aria-hidden="true" />
      {view && phase !== "spoken" ? (
        <div className="absolute right-4 top-4 z-20">
          <StreakMark view={view} />
        </div>
      ) : null}
      <div className="altar-stage">
        <div className={phase === "idle" ? "altar-mark" : "altar-mark altar-mark-dim"} aria-hidden="true">
          <svg viewBox="0 0 280 220" className="altar-svg">
            <path d="M40 200 H240" fill="none" stroke="#E2C48A" strokeWidth="1.2" />
            <path d="M70 200 V150 H210 V200" fill="none" stroke="#B8894A" strokeWidth="1.4" />
            <path d="M90 150 V118 H190 V150" fill="none" stroke="#E2C48A" strokeWidth="1" />
            <path d="M118 200 V168 H162 V200" fill="none" stroke="#8A6230" strokeWidth="1" />
            <path d="M40 200 Q140 36 240 200" fill="none" stroke="#E2C48A" strokeWidth="1.2" />
          </svg>
          <span className={bright ? "altar-flame altar-flame-bright" : "altar-flame"} />
        </div>
        {phase === "spoken" && frame ? (
          <AltarFilm
            frame={frame}
            caption={recall ? altarScene.wereHere : null}
            streak={view}
            roll={roll && !recall}
            remember={!believer && poojaCount >= 3 && !recall}
            onAgain={recall ? leaveRecall : () => void ring()}
          />
        ) : (
          <form
            className="altar-form"
            onSubmit={(event) => {
              event.preventDefault();
              void ring();
            }}
          >
            <h1 id="altar-bell-title" className="sr-only">
              The altar
            </h1>
            <label className="sr-only" htmlFor="altar-line">
              {altarScene.placeholder}
            </label>
            {greet !== null && phase === "idle" ? (
              <p className="mb-4 font-playfair text-sm italic text-bone">{welcomeBackLine(greet)}</p>
            ) : null}
            <input
              id="altar-line"
              value={line}
              onChange={(event) => setLine(event.target.value)}
              placeholder={altarScene.placeholder}
              className="altar-line"
              maxLength={140}
              disabled={phase !== "idle"}
            />
            {phase === "listening" ? (
              <p className="mt-6 font-mono text-sm tracking-[0.08em] text-brass-light" aria-live="polite">
                {altarScene.listening}
              </p>
            ) : (
              <button type="submit" className="btn-brass press mt-6">
                {altarScene.ring}
              </button>
            )}
            {note && phase === "idle" ? (
              <p className="mt-3 font-mono text-xs tracking-[0.08em] text-brass-light" role="alert">
                {note}
              </p>
            ) : null}
          </form>
        )}
      </div>
      {phase === "idle" ? (
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 pb-2 text-center">
          {prior ? (
            <button type="button" className="font-playfair text-sm italic text-[#E2C48A]" onClick={showYesterday}>
              {altarScene.yesterday}
            </button>
          ) : null}
          {notice === "remembered" ? (
            <p className="font-mono text-xs tracking-[0.12em] text-brass-light">{seatCopy.paid}</p>
          ) : null}
          {!believer && poojaCount >= 3 ? <RememberSeat /> : null}
          {believer && episodeLink ? (
            <Link href={`/episode/${episodeLink.week}`} className="font-playfair text-sm italic text-[#E2C48A]">
              {episodeLabel}
            </Link>
          ) : null}
          {believer && episodeLink ? (
            <form
              className="flex flex-col items-center"
              onSubmit={(event) => {
                event.preventDefault();
                keepAddress();
              }}
            >
              <label htmlFor="episode-mail" className="font-playfair text-sm italic text-bone">
                {episodeCopy.mailLabel}
              </label>
              <input
                id="episode-mail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={mail}
                onChange={(event) => setMail(event.target.value)}
                onBlur={keepAddress}
                placeholder={episodeCopy.mailPlaceholder}
                className="episode-mail"
              />
              {mailNote ? (
                <p className="mt-2 font-playfair text-sm italic text-bone" role="alert">
                  {mailNote}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : null}
      <Disclaimer surface="void" className="relative z-10 mx-auto px-4 pb-6 text-center" />
    </section>
  );
}
