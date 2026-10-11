"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { altarScene } from "@/content/altarScene";
import type { StreakView } from "@/lib/altarStreak";

const ROLL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

function RollDay({ day, roll }: { day: number; roll: boolean }) {
  const still = useStill();
  return (
    <span className="inline-block h-[1.15em] overflow-hidden align-bottom">
      <motion.span
        key={day}
        className="inline-block"
        initial={roll && !still ? { y: "110%" } : false}
        animate={{ y: "0%" }}
        transition={roll && !still ? { duration: 0.45, ease: ROLL_EASE } : { duration: 0 }}
      >
        {day}
      </motion.span>
    </span>
  );
}

export function StreakMark({ view, roll = false }: { view: StreakView; roll?: boolean }) {
  if (view.kind === "broken") {
    return (
      <div className="text-right" role="status">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-[#A39FB0]">{altarScene.broken}</p>
        <p className="mt-1 font-playfair text-sm italic text-bone">{altarScene.startAgain}</p>
      </div>
    );
  }
  const color = view.kind === "intact" ? "#E2C48A" : "#E85D68";
  const label = view.kind === "intact" ? altarScene.intact : altarScene.risk;
  return (
    <p className="whitespace-nowrap text-right font-mono text-[0.65rem] tracking-[0.14em]" style={{ color }} role="status">
      DAY <RollDay day={view.day} roll={roll} /> · {label}
    </p>
  );
}
