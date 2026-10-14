"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// Twenty motes. Forty-second loop. Quiet drift — never the focus.
// Render only after mount so prefers-reduced-motion cannot hydrate-mismatch.

const MOTES = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  left: `${(index * 13 + 7) % 92}%`,
  top: `${18 + (index * 11 + 5) % 64}%`,
  size: 1 + (index % 3) * 0.4,
  delay: (index % 10) * -2.1,
  driftX: index % 2 === 0 ? 18 : -20,
  driftY: index % 3 === 0 ? -28 : 16,
}));

export function AltarDust() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="altar-dust" aria-hidden="true" />;
  }

  const still = Boolean(reduce);

  return (
    <div className="altar-dust" aria-hidden="true">
      {MOTES.map((mote) => (
        <motion.span
          key={mote.id}
          className="altar-dust-mote"
          style={{
            left: mote.left,
            top: mote.top,
            width: mote.size,
            height: mote.size,
          }}
          initial={false}
          animate={
            still
              ? { opacity: 0.18 }
              : {
                  x: [0, mote.driftX, 0],
                  y: [0, mote.driftY, 0],
                  opacity: [0.06, 0.32, 0.06],
                }
          }
          transition={
            still
              ? { duration: 0 }
              : {
                  duration: 40,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: mote.delay,
                }
          }
        />
      ))}
    </div>
  );
}
