"use client";

// Assumptions: CSS hologram over the existing still. No audio, no lip-sync, no Three.js.
// First paint is the server-rendered image; overlays hydrate after. Reduced-motion drops motion.
// Alive motion is CSS transform/opacity only. Blink is skipped: a lid overlay would cover the real eyes poorly.

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

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

function readCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function HologramPandit({ children, mood, compact = false, petitionId }: Props) {
  const [liveMood, setLiveMood] = useState<HologramMood>(mood ?? "idle");
  const [motion, setMotion] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pulseTimer = useRef<number | undefined>(undefined);
  const followFrame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    function onVis() {
      setHidden(document.hidden);
    }
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(pulseTimer.current);
      if (followFrame.current) cancelAnimationFrame(followFrame.current);
    },
    [],
  );

  const pulse = useCallback(() => {
    if (readReducedMotion() || !motion) return;
    setPulsing(true);
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulsing(false), 780);
  }, [motion]);

  const welcome = useCallback(() => {
    if (liveMood === "processing" || liveMood === "offering-received") return;
    setLiveMood("welcome");
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(HOLOGRAM_WELCOMED_KEY, "1");
  }, [liveMood]);

  const onActivate = useCallback(() => {
    pulse();
    welcome();
  }, [pulse, welcome]);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!motion || hidden || event.pointerType !== "mouse" || readCoarsePointer()) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      if (followFrame.current) cancelAnimationFrame(followFrame.current);
      followFrame.current = requestAnimationFrame(() => {
        stage.style.setProperty("--hx", `${x.toFixed(1)}%`);
        stage.style.setProperty("--hy", `${y.toFixed(1)}%`);
      });
    },
    [hidden, motion],
  );

  const onPointerLeave = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.removeProperty("--hx");
    stage.style.removeProperty("--hy");
  }, []);

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

  const liveClass = `${hologramFallbackClass(!motion)}${hidden ? " hologram-paused" : ""}${pulsing ? " hologram-pulsing" : ""}`;

  return (
    <figure className={`hologram ${liveClass} ${compact ? "hologram-compact" : ""}`} data-mood={liveMood}>
      <div ref={stageRef} className="hologram-stage relative aspect-[4/3] w-full overflow-hidden border border-brass/70 bg-night">
        <button
          type="button"
          className="hologram-activate"
          onClick={onActivate}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          aria-label={hologram.activateLabel}
        >
          <span className="hologram-frame">{children}</span>
          <span className="hologram-wash" aria-hidden="true" />
          <span className="hologram-rim" aria-hidden="true" />
          <span className="hologram-shimmer" aria-hidden="true" />
          <span className="hologram-scan" aria-hidden="true" />
          <span className="hologram-particles" aria-hidden="true" />
          <span className="hologram-floor" aria-hidden="true" />
          <span className="hologram-follow" aria-hidden="true" />
          <span className="hologram-pulse" aria-hidden="true" />
          {liveMood === "tip-reminder" ? (
            <span className="hologram-anger" aria-hidden="true">
              <span>✕</span>
            </span>
          ) : null}
          {!compact && liveMood === "idle" ? (
            <span className="hologram-hint" aria-hidden="true">
              {hologram.idleHint}
            </span>
          ) : null}
        </button>
      </div>
      {caption ? (
        <figcaption className="hologram-caption mt-3 font-mono text-xs tracking-[0.08em] text-signal" aria-live="polite">
          {caption}
        </figcaption>
      ) : null}
      {liveMood === "tip-reminder" ? <p className="mt-2 text-sm leading-relaxed text-mist">{hologram.tipJoke}</p> : null}
      {compact ? null : (
        <p className="mt-2">
          <button
            type="button"
            className="btn-outline press min-h-11 text-xs"
            onClick={() => {
              pulse();
              setLiveMood("welcome");
            }}
          >
            {hologram.replay}
          </button>
        </p>
      )}
      <p className="sr-only">{hologram.noLipSync}</p>
    </figure>
  );
}
