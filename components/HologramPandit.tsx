"use client";

// Assumptions: CSS hologram over the existing still. No audio, no lip-sync, no Three.js.
// First paint is the server-rendered image; overlays hydrate after. Reduced-motion drops motion.

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { hologram } from "@/content/hologram";
import {
  awaitingOffering,
  clearAwaitingOffering,
  hologramFallbackClass,
  HOLOGRAM_EVENT,
  HOLOGRAM_WELCOMED_KEY,
  lastPetitionId,
  type HologramMood,
} from "@/lib/hologram";

type Props = {
  children: ReactNode;
  mood?: HologramMood;
  compact?: boolean;
  petitionId?: string;
};

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HologramPandit({ children, mood, compact = false, petitionId }: Props) {
  const [liveMood, setLiveMood] = useState<HologramMood>(mood ?? "idle");
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    const reduced = readReducedMotion();
    setMotion(!reduced);
    if (mood === "offering-received") {
      clearAwaitingOffering();
      setLiveMood("offering-received");
      return;
    }
    const ownReading = Boolean(petitionId) && lastPetitionId() === petitionId && awaitingOffering();
    if (mood === "tip-reminder" || ownReading) {
      setLiveMood("tip-reminder");
      return;
    }
    if (mood) setLiveMood(mood);
  }, [mood, petitionId]);

  useEffect(() => {
    function onMood(event: Event) {
      const detail = (event as CustomEvent<{ mood?: HologramMood }>).detail;
      if (detail?.mood) setLiveMood(detail.mood);
    }
    window.addEventListener(HOLOGRAM_EVENT, onMood);
    return () => window.removeEventListener(HOLOGRAM_EVENT, onMood);
  }, []);

  const welcome = useCallback(() => {
    if (liveMood === "processing" || liveMood === "offering-received") return;
    setLiveMood("welcome");
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(HOLOGRAM_WELCOMED_KEY, "1");
  }, [liveMood]);

  useEffect(() => {
    function onFirst() {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(HOLOGRAM_WELCOMED_KEY) === "1") return;
      welcome();
    }
    window.addEventListener("pointerdown", onFirst, { once: true });
    window.addEventListener("keydown", onFirst, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, [welcome]);

  const caption =
    liveMood === "welcome"
      ? hologram.welcome
      : liveMood === "processing"
        ? hologram.processing
        : liveMood === "tip-reminder"
          ? hologram.tipReminder
          : liveMood === "offering-received"
            ? hologram.offeringReceived
            : "";

  return (
    <figure className={`hologram ${hologramFallbackClass(!motion)} ${compact ? "hologram-compact" : ""}`} data-mood={liveMood}>
      <div className="hologram-stage relative aspect-[4/3] w-full overflow-hidden border border-brass/70 bg-night">
        {children}
        <div className="hologram-wash" aria-hidden="true" />
        <div className="hologram-scan" aria-hidden="true" />
        <div className="hologram-particles" aria-hidden="true" />
        {liveMood === "tip-reminder" ? (
          <div className="hologram-anger" aria-hidden="true">
            <span>✕</span>
          </div>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="hologram-caption mt-3 font-mono text-xs tracking-[0.08em] text-signal" aria-live="polite">
          {caption}
        </figcaption>
      ) : null}
      {liveMood === "tip-reminder" ? <p className="mt-2 text-sm leading-relaxed text-mist">{hologram.tipJoke}</p> : null}
      {compact ? null : (
        <p className="mt-2">
          <button type="button" className="btn-outline press min-h-11 text-xs" onClick={() => setLiveMood("welcome")}>
            {hologram.replay}
          </button>
        </p>
      )}
      <p className="sr-only">{hologram.noLipSync}</p>
    </figure>
  );
}
