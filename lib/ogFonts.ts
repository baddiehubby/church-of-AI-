// Assumptions: OG fonts are bundled in assets/fonts (copied from @fontsource, OFL) and read from disk in the nodejs
// runtime; next.config.ts traces them into the OG routes. "Display" is Fraunces (900 roman, 600 italic) to match
// the site serif; "Mono" is JetBrains Mono; all Noto subsets share "Noto Sans" so Satori falls back across Latin,
// Cyrillic, Greek, and Devanagari glyphs. Devanagari names are pre-shaped in lib/ogShape.ts (HarfBuzz) before Satori.

import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

type Weight = 400 | 600 | 700 | 900;
export type OgFont = { name: string; data: Buffer; weight: Weight; style: "normal" | "italic" };

const FILES: readonly { name: string; file: string; weight: Weight; style?: "italic" }[] = [
  { name: "Display", file: "fraunces-latin-900-normal.woff", weight: 900 },
  { name: "Display", file: "fraunces-latin-ext-900-normal.woff", weight: 900 },
  { name: "Display", file: "fraunces-latin-600-italic.woff", weight: 600, style: "italic" },
  { name: "Mono", file: "jetbrains-mono-latin-400-normal.woff", weight: 400 },
  { name: "Mono", file: "jetbrains-mono-latin-700-normal.woff", weight: 700 },
  { name: "Noto Sans", file: "noto-sans-latin-400-normal.woff", weight: 400 },
  { name: "Noto Sans", file: "noto-sans-latin-700-normal.woff", weight: 700 },
  { name: "Noto Sans", file: "noto-sans-latin-ext-400-normal.woff", weight: 400 },
  { name: "Noto Sans", file: "noto-sans-latin-ext-700-normal.woff", weight: 700 },
  { name: "Noto Sans", file: "noto-sans-cyrillic-400-normal.woff", weight: 400 },
  { name: "Noto Sans", file: "noto-sans-greek-400-normal.woff", weight: 400 },
  { name: "Noto Sans", file: "noto-sans-devanagari-devanagari-400-normal.woff", weight: 400 },
  { name: "Noto Sans", file: "noto-sans-devanagari-devanagari-700-normal.woff", weight: 700 },
];

let cache: Promise<OgFont[]> | null = null;

export function loadOgFonts(): Promise<OgFont[]> {
  if (!cache) {
    const dir = join(process.cwd(), "assets", "fonts");
    cache = Promise.all(
      FILES.map(async (font) => ({
        name: font.name,
        weight: font.weight,
        style: font.style ?? ("normal" as const),
        data: await readFile(join(dir, font.file)),
      })),
    ).catch((error: unknown) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
