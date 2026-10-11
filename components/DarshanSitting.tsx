"use client";

import { useState } from "react";

import { darshanCopy, sermonCopy } from "@/content/congregation";

type Beat = { speaker: "algo" | "pandit"; text: string };

export function DarshanSitting({ beats, practice, cardUrl }: { beats: Beat[]; practice: string; cardUrl: string }) {
  const [step, setStep] = useState(0);
  const beat = beats[step];
  return (
    <div className="petition-scroll mx-auto max-w-xl px-6 py-10 text-ink">
      {beat ? (
        beat.speaker === "algo" ? (
          <p className="font-mono text-sm tracking-[0.08em]">{beat.text}</p>
        ) : (
          <p className="serif-warm text-2xl leading-relaxed">{beat.text}</p>
        )
      ) : (
        <div>
          <img src={cardUrl} alt={darshanCopy.card} width={1200} height={630} className="h-auto w-full border border-brass" />
          <p className="mt-6 font-mono text-xs tracking-[0.16em] text-brass-deep">{sermonCopy.practice}</p>
          <p className="serif-warm mt-2 text-xl">{practice}</p>
          <svg viewBox="0 0 240 72" className="mt-6 h-16 w-40" role="img" aria-label={darshanCopy.autograph}>
            <path d="M8 48 C 36 8, 70 70, 104 36 S 168 12, 228 44" fill="none" stroke="#8A6230" strokeWidth="2" />
            <text x="8" y="68" fill="#1A1740" fontSize="16" fontFamily="Georgia, serif">
              pandit ji
            </text>
          </svg>
          <p className="mt-4 text-sm text-[#5C5868]">{darshanCopy.card}</p>
        </div>
      )}
      {beat ? (
        <button type="button" className="btn-brass press mt-8" onClick={() => setStep((value) => value + 1)}>
          {darshanCopy.next}
        </button>
      ) : null}
    </div>
  );
}
