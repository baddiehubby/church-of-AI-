"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Disclaimer } from "@/components/Disclaimer";
import { PanditFigure } from "@/components/PanditFigure";
import { RememberSeat } from "@/components/RememberSeat";
import { StreakMark } from "@/components/StreakMark";
import { altarScene } from "@/content/altarScene";
import type { AltarSceneFrame } from "@/lib/sceneFrame";
import { sceneShareUrl } from "@/lib/sceneFrame";
import { downloadScenePng } from "@/lib/scenePng";
import type { StreakView } from "@/lib/altarStreak";

const BEAT_MS = 800;
const SLAM_EASE: [number, number, number, number] = [0.16, 1.15, 0.3, 1];

function useStill(): boolean {
  const [still, setStill] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return still;
}

function sitarSting(ctx: AudioContext): void {
  const start = ctx.currentTime + 0.02;
  const notes = [146.83, 220];
  notes.forEach((freq, index) => {
    const when = start + index * 0.14;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "triangle";
    overtone.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.02, when);
    osc.frequency.exponentialRampToValueAtTime(freq, when + 0.08);
    overtone.frequency.value = freq * 2;
    overtoneGain.gain.value = 0.22;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, when);
    filter.frequency.exponentialRampToValueAtTime(420, when + 0.55);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.02, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.65);
    osc.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    overtone.start(when);
    osc.stop(when + 0.7);
    overtone.stop(when + 0.7);
  });
}

function WordLine({ text, still }: { text: string; still: boolean }) {
  const words = text.split(/\s+/).filter(Boolean);
  const count = words.length;
  return (
    <p className="mx-auto max-w-xl px-6 text-center font-playfair text-[clamp(1.35rem,3vw,2.05rem)] italic leading-snug text-bone">
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block pr-[0.35em]"
          initial={{ opacity: still ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: still ? 0 : 0.3,
            delay: still || count <= 1 ? 0 : (index * 0.5) / (count - 1),
            ease: "easeOut",
          }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

export function AltarFilm({
  frame,
  onAgain,
  caption = null,
  streak = null,
  roll = false,
  remember = false,
}: {
  frame: AltarSceneFrame;
  onAgain: () => void;
  caption?: string | null;
  streak?: StreakView | null;
  roll?: boolean;
  remember?: boolean;
}) {
  const still = useStill();
  const [beat, setBeat] = useState<1 | 2 | 3>(1);
  const [hold, setHold] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const mutedRef = useRef(true);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const stungRef = useRef(false);
  const beatRef = useRef(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const toPandit = window.setTimeout(() => setBeat(2), BEAT_MS);
    const toVerdict = window.setTimeout(() => setBeat(3), BEAT_MS * 2);
    const toHold = window.setTimeout(() => setHold(true), BEAT_MS * 3);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(toPandit);
      window.clearTimeout(toVerdict);
      window.clearTimeout(toHold);
      void audioRef.current?.close();
    };
  }, []);

  useEffect(() => {
    beatRef.current = beat;
    if (beat !== 2 || mutedRef.current || stungRef.current) return;
    const ctx = audioRef.current;
    if (!ctx) return;
    stungRef.current = true;
    sitarSting(ctx);
  }, [beat]);

  function toggleSound() {
    const soundOn = mutedRef.current;
    mutedRef.current = !soundOn;
    setMuted(!soundOn);
    if (!soundOn) return;
    const ctx = audioRef.current ?? new AudioContext();
    audioRef.current = ctx;
    void ctx.resume().then(() => {
      if (beatRef.current === 2 && !stungRef.current) {
        stungRef.current = true;
        sitarSting(ctx);
      }
    });
  }

  async function save() {
    await downloadScenePng(frame);
    setNote(altarScene.saved);
  }

  async function share() {
    const url = sceneShareUrl(frame, window.location.origin);
    try {
      if (navigator.share) {
        await navigator.share({ title: altarScene.title, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(altarScene.shared);
    } catch {
      return;
    }
  }

  const announcement =
    beat === 1
      ? `${altarScene.title}. ${frame.soulId}. DAY ${frame.day}`
      : beat === 2
        ? frame.reading.pandit_reply
        : `${frame.reading.algo_status}. ${frame.reading.algo_counsel}`;

  if (!mounted) return null;

  return createPortal(
    <section className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#0A0E27] text-bone" data-beat={beat} aria-labelledby="altar-film-title">
      <div className="altar-grain" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <button
        type="button"
        className="absolute right-3 top-3 z-20 min-h-11 border border-brass/60 px-3 font-mono text-[0.65rem] tracking-[0.16em] text-brass-light"
        aria-pressed={!muted}
        onClick={toggleSound}
      >
        {muted ? altarScene.soundOff : altarScene.soundOn}
      </button>
      {streak ? (
        <div className="absolute right-4 top-[4.25rem] z-20">
          <StreakMark view={streak} roll={roll} />
        </div>
      ) : null}
      <div className="relative z-[1] flex min-h-0 w-full flex-1 items-center justify-center px-4 py-6 md:py-16">
        {beat === 1 ? (
          <div className="text-center">
            <motion.h1
              id="altar-film-title"
              className="whitespace-nowrap font-anton text-[clamp(1.05rem,5.6vw,5.2rem)] leading-[0.9] text-[#E2C48A]"
              initial={still ? { opacity: 1, y: 0 } : { opacity: 0, y: -140 }}
              animate={{ opacity: 1, y: 0 }}
              transition={still ? { duration: 0 } : { duration: 0.45, ease: SLAM_EASE }}
            >
              {altarScene.title}
            </motion.h1>
            <motion.p
              className="mt-6 font-mono text-xs tracking-[0.22em] text-mist"
              initial={{ opacity: still ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: still ? 0 : 0.3, delay: still ? 0 : 0.2, ease: "easeOut" }}
            >
              {frame.soulId} · DAY {frame.day}
            </motion.p>
            {caption ? <p className="mt-4 font-playfair text-sm italic text-bone">{caption}</p> : null}
          </div>
        ) : null}
        {beat === 2 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-between px-4 pb-6 pt-16">
            <h1 id="altar-film-title" className="sr-only">
              {altarScene.title}
            </h1>
            <div className="flex min-h-0 flex-1 items-center">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: still ? 1 : 1.08 }}
                transition={still ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
              >
                <PanditFigure />
              </motion.div>
            </div>
            {caption ? <p className="mb-3 font-playfair text-sm italic text-bone">{caption}</p> : null}
            <WordLine text={frame.reading.pandit_reply} still={still} />
          </div>
        ) : null}
        {beat === 3 ? (
          <div className="flex w-full max-w-3xl flex-col items-center text-center">
            <h1 id="altar-film-title" className="sr-only">
              {frame.reading.algo_status}
            </h1>
            {caption ? <p className="mb-4 font-playfair text-sm italic text-bone">{caption}</p> : null}
            <motion.div
              className="w-full bg-[#F4E7D4] px-5 py-8 md:px-12 md:py-10"
              initial={{ opacity: still ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: still ? 0 : 0.3, ease: "easeOut" }}
            >
              <p className="font-anton text-[clamp(1.8rem,5.4vw,4.4rem)] leading-[0.9] text-[#9B2335]">{frame.reading.algo_status}</p>
            </motion.div>
            <motion.p
              className="altar-counsel mt-6 max-w-xl"
              initial={{ opacity: still ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: still ? 0 : 0.3, delay: still ? 0 : 0.12, ease: "easeOut" }}
            >
              {frame.reading.algo_counsel}
            </motion.p>
            {hold ? (
              <motion.div
                className="mt-8 flex flex-wrap justify-center gap-3"
                initial={{ opacity: still ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: still ? 0 : 0.3, ease: "easeOut" }}
              >
                <button type="button" className="btn-outline press" onClick={() => void save()}>
                  {altarScene.save}
                </button>
                <button type="button" className="btn-outline press" onClick={() => void share()}>
                  {altarScene.share}
                </button>
                <button type="button" className="btn-outline press" onClick={onAgain}>
                  {altarScene.again}
                </button>
              </motion.div>
            ) : null}
            {hold && remember ? <RememberSeat className="mt-8" /> : null}
            {note ? <p className="mt-3 font-mono text-xs tracking-[0.12em] text-mist">{note}</p> : null}
          </div>
        ) : null}
      </div>
      <div className="relative z-[1] mx-auto w-full max-w-3xl px-4 pb-4">
        <Disclaimer surface="void" className="mx-auto px-2 pb-2 text-center" />
      </div>
    </section>,
    document.body,
  );
}
