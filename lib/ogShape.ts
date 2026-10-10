// Assumptions: Satori does not shape complex scripts, so Devanagari names come out with misplaced matras and broken
// conjuncts. For names made only of Devanagari, basic Latin, spaces, and simple punctuation, we shape with
// HarfBuzz (WASM) and emit the glyph outlines as an SVG data URI that the OG image embeds as <img>. Anything else
// (emoji, other scripts) returns null and falls back to Satori text, which handles those fine. HarfBuzz cannot read
// WOFF, so the bundled WOFF fonts are unpacked to plain sfnt in memory.

import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

const DEVANAGARI = /[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]/u;
const SHAPEABLE = /^[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF\u200C\u200D\u0020-\u007E\u00C0-\u00FF]+$/u;

type HB = typeof import("harfbuzzjs");
type Loaded = { hb: HB; deva: InstanceType<HB["Font"]>; latin: InstanceType<HB["Font"]>; upem: number };

let loading: Promise<Loaded> | null = null;

function woffToSfnt(woff: Buffer): Uint8Array {
  if (woff.toString("ascii", 0, 4) !== "wOFF") return new Uint8Array(woff);
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables: { tag: Buffer; checksum: number; data: Buffer }[] = [];
  for (let i = 0; i < numTables; i += 1) {
    const at = 44 + i * 20;
    const offset = woff.readUInt32BE(at + 4);
    const compLength = woff.readUInt32BE(at + 8);
    const origLength = woff.readUInt32BE(at + 12);
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({
      tag: woff.subarray(at, at + 4),
      checksum: woff.readUInt32BE(at + 16),
      data: compLength < origLength ? inflateSync(raw) : Buffer.from(raw),
    });
  }
  const pow = 2 ** Math.floor(Math.log2(numTables));
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(pow * 16, 6);
  header.writeUInt16BE(Math.log2(pow), 8);
  header.writeUInt16BE(numTables * 16 - pow * 16, 10);
  const chunks: Buffer[] = [header];
  let offset = header.length;
  tables.forEach((table, i) => {
    const at = 12 + i * 16;
    table.tag.copy(header, at);
    header.writeUInt32BE(table.checksum, at + 4);
    header.writeUInt32BE(offset, at + 8);
    header.writeUInt32BE(table.data.length, at + 12);
    const padded = Buffer.alloc(Math.ceil(table.data.length / 4) * 4);
    table.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return new Uint8Array(Buffer.concat(chunks));
}

async function load(): Promise<Loaded> {
  const hb = await import("harfbuzzjs");
  const dir = join(process.cwd(), "assets", "fonts");
  const font = async (file: string) => {
    const face = new hb.Face(new hb.Blob(woffToSfnt(await readFile(join(dir, file)))), 0);
    return { font: new hb.Font(face), upem: face.upem };
  };
  const deva = await font("noto-sans-devanagari-devanagari-700-normal.woff");
  const latin = await font("noto-sans-latin-700-normal.woff");
  return { hb, deva: deva.font, latin: latin.font, upem: deva.upem };
}

function runs(text: string): { text: string; deva: boolean }[] {
  const out: { text: string; deva: boolean }[] = [];
  for (const char of Array.from(text)) {
    const isDeva = DEVANAGARI.test(char) || char === "\u200C" || char === "\u200D";
    const last = out[out.length - 1];
    if (last && (char === " " || last.deva === isDeva)) last.text += char;
    else out.push({ text: char, deva: isDeva });
  }
  return out;
}

export type ShapedName = { src: string; width: number; height: number };

/** Returns an SVG data URI for the name at the given font size, or null if Satori should render it as text. */
export async function shapeDevanagariName(name: string, fontSize: number, fill: string): Promise<ShapedName | null> {
  if (!DEVANAGARI.test(name) || !SHAPEABLE.test(name)) return null;
  try {
    loading ??= load();
    const { hb, deva, latin, upem } = await loading;
    const ascent = upem * 0.98;
    const descent = upem * 0.3;
    let x = 0;
    const paths: string[] = [];
    for (const run of runs(name)) {
      const font = run.deva ? deva : latin;
      const buffer = new hb.Buffer();
      buffer.addText(run.text);
      buffer.guessSegmentProperties();
      hb.shape(font, buffer);
      const infos = buffer.getGlyphInfos();
      const positions = buffer.getGlyphPositions();
      infos.forEach((info, i) => {
        const pos = positions[i];
        if (!pos) return;
        const d = font.glyphToPath(info.codepoint);
        if (d) paths.push(`<path transform="translate(${x + pos.xOffset} ${ascent - pos.yOffset}) scale(1 -1)" d="${d}"/>`);
        x += pos.xAdvance;
      });
    }
    if (!paths.length || x <= 0) return null;
    const scale = fontSize / upem;
    const width = Math.ceil(x * scale);
    const height = Math.ceil((ascent + descent) * scale);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${x} ${ascent + descent}"><g fill="${fill}">${paths.join("")}</g></svg>`;
    return { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height };
  } catch {
    loading = null;
    return null;
  }
}
