"use client";

import { useEffect, useState } from "react";

import { nextPredictionIndex, pickPredictionIndex, PREDICTIONS, predictionAside } from "@/content/predictions";

const HOLD_MS = 5000;
const FADE_MS = 420;

export function PredictionPop({ seed = null }: { seed?: string | null }) {
  const [index, setIndex] = useState(() => (seed ? pickPredictionIndex(seed) : 0));
  const [visible, setVisible] = useState(true);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    if (seed) {
      setIndex(pickPredictionIndex(seed));
      return;
    }
    setIndex(Math.floor(Math.random() * PREDICTIONS.length));
  }, [seed]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!motion) return;
    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => nextPredictionIndex(current));
        setVisible(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [motion]);

  const item = PREDICTIONS[index] ?? PREDICTIONS[0];

  return (
    <aside
      className={`prediction-pop ${visible ? "prediction-pop-in" : "prediction-pop-out"}`}
      aria-live="polite"
      aria-label={predictionAside.kicker}
    >
      <p className="font-mono text-[0.65rem] tracking-[0.16em] text-brass-light">{predictionAside.kicker}</p>
      <p className="mt-2 font-mono text-xs leading-relaxed tracking-[0.04em] text-signal">{item.algorithm}</p>
      <p className="serif-warm mt-2 text-sm italic text-bone/90">{item.pandit}</p>
      <p className="mt-2 text-[0.7rem] text-mist">{predictionAside.note}</p>
    </aside>
  );
}
