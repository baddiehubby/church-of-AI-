import { createHash } from "node:crypto";

import { verdictPool } from "@/content/verdict";
import { occupiedVerdict } from "@/lib/fewShots";
import { verdictSchema, type Verdict } from "@/lib/verdictSchema";

function seedOf(value: string): number {
  return createHash("sha256").update(value).digest().readUInt32BE(0);
}

export function occupiedFallback(): Verdict {
  return verdictSchema.parse(occupiedVerdict);
}

export function fallbackVerdict(wish: string, category: string): Verdict {
  const seed = seedOf(`${category}\n${wish}`);
  const picked = verdictPool[seed % verdictPool.length] ?? verdictPool[0];
  return verdictSchema.parse(picked);
}
