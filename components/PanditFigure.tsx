"use client";

import { useId } from "react";

// A tired man in a shawl. No mark, no halo, no sacred object.

export function PanditFigure() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 240 420" className="h-auto max-h-[46vh] w-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#E2C48A" stopOpacity="0.45" />
          <stop offset="0.42" stopColor="#E2C48A" stopOpacity="0" />
          <stop offset="1" stopColor="#050714" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="392" rx="78" ry="12" fill="#050714" opacity="0.65" />
      <path d="M86 176 C62 250 58 330 96 386 H150 C186 328 176 246 156 176 Z" fill="#14122E" stroke="#B8894A" strokeWidth="1.4" />
      <path d="M104 168 L96 300 H146 L138 168 Z" fill="#241F45" />
      <path d="M98 196 C74 236 78 286 96 312" fill="none" stroke="#C4A484" strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="120" cy="124" rx="32" ry="38" fill="#C4A484" />
      <path d="M90 112 Q120 74 150 112 Q142 96 120 92 Q98 96 90 112" fill="#1A1420" />
      <path d="M106 128 H116" stroke="#1A1420" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M128 128 H138" stroke="#1A1420" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M114 148 Q120 152 128 148" fill="none" stroke="#8A6230" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="0" y="0" width="240" height="420" fill={`url(#${id}-light)`} />
    </svg>
  );
}
