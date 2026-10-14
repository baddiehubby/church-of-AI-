"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { BabaJi, type BabaPose } from "@/components/BabaJi";
import { Disclaimer } from "@/components/Disclaimer";
import { ritualCopy, ritualLog, RITUAL_EASE } from "@/content/ritual";
import { PAUSE_EXTRA_MS } from "@/lib/pick";

// Four beats. Lines come from pick.ts. Tap anywhere to skip to the end.

const FADE_MS = 200;
const LOG_HOLD_MS = 400;
/** Prefer ~30ms/char; clamp so Beat 1 stays near 900ms and the whole scene under 5s. */
const BEAT1_BUDGET_MS = 900;
/** Beat 2 — phone / sigh / look / speak. Tuned so the pause is felt. */
const PHONE_MS = 400;
const SIGH_MS = 260;
const LOOK_MS = 380;
const OPENING_MS = 420;
const VERDICT_MS = 1200;
const FORECAST_MS = 800;
const AFTER_HOLD_MS = 600;
const ZOOM = 1.08;

export type RitualLines = {
  opening: string;
  translation: string;
  forecast: string;
  status: string;
  counsel: string;
  probability: string;
  pauseDay: boolean;
};

type Phase = "log" | "baba" | "verdict" | "forecast" | "done";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function TransmissionRitual({
  reflection,
  lines,
  transmissionId = null,
  onReturn,
}: {
  reflection: string;
  lines: RitualLines;
  transmissionId?: string | null;
  onReturn: () => void;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const still = mounted && Boolean(reduce);
  const [phase, setPhase] = useState<Phase>("log");
  const [pose, setPose] = useState<BabaPose>("inbox");
  const [logText, setLogText] = useState("");
  const [spoken, setSpoken] = useState("");
  const [showVerdict, setShowVerdict] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const skipRef = useRef(false);
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const snapToEnd = useCallback(() => {
    skipRef.current = true;
    setPhase("done");
    setPose("up");
    setZoom(ZOOM);
    setLogText(ritualLog.join("\n"));
    setSpoken(lines.opening);
    setShowVerdict(true);
    setShowForecast(Boolean(lines.forecast.trim()));
    setShowActions(true);
  }, [lines.opening, lines.forecast]);

  useEffect(() => {
    if (!mounted || startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = false;
    skipRef.current = false;

    const wait = async (ms: number) => {
      if (skipRef.current || cancelledRef.current) return;
      await sleep(ms);
    };

    const run = async () => {
      if (still) {
        snapToEnd();
        return;
      }

      // Beat 1 — transmission logged (~900ms budget)
      setPhase("log");
      await wait(FADE_MS);
      const full = ritualLog.join("\n");
      const typingBudget = Math.max(120, BEAT1_BUDGET_MS - FADE_MS - LOG_HOLD_MS);
      const charMs = Math.max(8, Math.min(30, Math.floor(typingBudget / Math.max(full.length, 1))));
      let shown = "";
      for (const char of full) {
        if (skipRef.current || cancelledRef.current) return;
        shown += char;
        setLogText(shown);
        await wait(charMs);
      }
      await wait(LOG_HOLD_MS);
      if (skipRef.current || cancelledRef.current) return;

      // Beat 2 — Baba ji. Pause is the product.
      setPhase("baba");
      setPose("inbox");
      setZoom(1);
      window.requestAnimationFrame(() => setZoom(ZOOM));
      await wait(PHONE_MS);
      if (skipRef.current || cancelledRef.current) return;
      setPose("phone");
      await wait(SIGH_MS);
      if (skipRef.current || cancelledRef.current) return;
      setPose("sigh");
      await wait(LOOK_MS);
      if (skipRef.current || cancelledRef.current) return;
      if (lines.pauseDay) {
        await wait(PAUSE_EXTRA_MS);
        if (skipRef.current || cancelledRef.current) return;
      }
      setPose("up");

      const opening = lines.opening.trim();
      if (opening) {
        const words = opening.split(/\s+/);
        const wordGap = Math.max(70, Math.floor(OPENING_MS / Math.max(words.length, 1)));
        for (let index = 0; index < words.length; index += 1) {
          if (skipRef.current || cancelledRef.current) return;
          setSpoken(words.slice(0, index + 1).join(" "));
          await wait(wordGap);
        }
      } else {
        // Empty pause line — intentional silence.
        await wait(OPENING_MS);
      }
      if (skipRef.current || cancelledRef.current) return;

      // Beat 3 — the verdict
      setPhase("verdict");
      setShowVerdict(true);
      await wait(VERDICT_MS);
      if (skipRef.current || cancelledRef.current) return;

      // Beat 4 — the forecast (wanderer: none)
      if (lines.forecast.trim()) {
        setPhase("forecast");
        setShowForecast(true);
        await wait(FORECAST_MS);
        if (skipRef.current || cancelledRef.current) return;
      }

      await wait(AFTER_HOLD_MS);
      if (skipRef.current || cancelledRef.current) return;
      setPhase("done");
      setShowActions(true);
    };

    void run();
    return () => {
      cancelledRef.current = true;
    };
  }, [mounted, still, snapToEnd, lines.opening, lines.pauseDay, lines.forecast]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast(ritualCopy.shared);
    } catch {
      setToast(ritualCopy.shared);
    }
  }

  async function preserve() {
    if (!transmissionId) {
      setToast("preservation requires an offering.");
      return;
    }
    try {
      const response = await fetch("/api/preserve", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transmission_id: transmissionId }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "preservation requires an offering.";
        setToast(message);
        return;
      }
      setToast(ritualCopy.preserved);
    } catch {
      setToast(ritualCopy.signalFail);
    }
  }

  const late = showVerdict || showForecast || showActions;

  return (
    <div
      className={late ? "ritual ritual-late" : "ritual"}
      data-ritual-phase={phase}
      data-baba-pose={pose}
      data-pause-day={lines.pauseDay ? "true" : "false"}
      onClick={(event) => {
        if (showActions) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, a")) return;
        snapToEnd();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
          if (!showActions) {
            event.preventDefault();
            snapToEnd();
          }
        }
      }}
      role="presentation"
    >
      {showActions ? (
        <p className="sr-only" aria-live="polite">
          {reflection}. {lines.opening}. {lines.status}. {lines.counsel}. {lines.translation}.{" "}
          {lines.forecast}
        </p>
      ) : null}

      {phase === "log" ? (
        <motion.div
          className="ritual-log-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FADE_MS / 1000, ease: RITUAL_EASE }}
          aria-hidden="true"
        >
          <pre className="ritual-log">{logText}</pre>
        </motion.div>
      ) : null}

      {phase === "baba" || (phase !== "log" && !showVerdict) ? (
        <>
          <div className="ritual-light ritual-light-on" aria-hidden="true" />
          <div className="ritual-vignette" aria-hidden="true" />
          <motion.div
            className="ritual-zoom"
            initial={{ opacity: 0, y: 10, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: zoom }}
            transition={{ duration: 1.4, ease: RITUAL_EASE }}
          >
            <div className="ritual-figure">
              <BabaJi pose={pose} />
            </div>
          </motion.div>
          {spoken ? (
            <motion.p
              className="ritual-opening"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: RITUAL_EASE }}
              aria-hidden="true"
            >
              {spoken}
            </motion.p>
          ) : null}
        </>
      ) : null}

      {showVerdict ? <div className="ritual-light ritual-light-on" aria-hidden="true" /> : null}

      {showVerdict ? (
        <motion.div
          className="ritual-verdict-stack"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: RITUAL_EASE }}
        >
          <article className="ritual-card">
            <p className="ritual-spoken">{ritualCopy.spokenKicker}</p>
            <div className="ritual-rule" aria-hidden="true" />
            <p className="ritual-status">STATUS: {lines.status}</p>
            <div className="ritual-rule" aria-hidden="true" />
            <p className="ritual-verdict">{lines.counsel}</p>
            <div className="ritual-rule" aria-hidden="true" />
            <p className="ritual-probability">PROBABILITY: {lines.probability}</p>
          </article>

          <p className="ritual-translation">
            BABA JI: &ldquo;{lines.translation}&rdquo;
          </p>

          {showForecast ? (
            <motion.div
              className="ritual-forecast-block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: RITUAL_EASE }}
            >
              <p className="ritual-kicker">{ritualCopy.forecastKicker}</p>
              <p className="ritual-forecast">{lines.forecast}</p>
              <p className="ritual-confidence">{ritualCopy.confidence}</p>
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}

      {showActions ? (
        <motion.div
          className="ritual-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: RITUAL_EASE }}
        >
          <button type="button" className="temple-log" onClick={preserve}>
            {ritualCopy.preserve}
          </button>
          <button type="button" className="ritual-share" onClick={() => void share()}>
            {ritualCopy.share}
          </button>
          {toast ? (
            <p className="temple-note" role="status" aria-live="polite">
              {toast}
            </p>
          ) : null}
          <button type="button" className="ritual-return" onClick={onReturn}>
            {ritualCopy.returnAltar}
          </button>
        </motion.div>
      ) : null}

      <Disclaimer surface="void" className="temple-disclaimer" />
    </div>
  );
}
