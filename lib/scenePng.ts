// The saved frame is a 1200×630 end card, the same proportion as the other posters.
// It draws the verdict beat, not a screenshot of the viewport.

import type { AltarSceneFrame } from "@/lib/sceneFrame";

const WIDTH = 1200;
const HEIGHT = 630;

function family(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.length) {
    const used = lines.join(" ").split(/\s+/).length;
    if (used < words.length) {
      const last = lines[maxLines - 1] ?? "";
      lines[maxLines - 1] = last.replace(/[.,;:]?$/, "…");
    }
  }
  return lines;
}

export async function downloadScenePng(frame: AltarSceneFrame): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const anton = family("--font-display-face", "Impact");
  const mono = family("--font-mono-face", "ui-monospace");
  await Promise.all([
    document.fonts.load(`400 28px ${anton}`),
    document.fonts.load(`400 68px ${anton}`),
    document.fonts.load(`400 18px ${mono}`),
  ]);

  ctx.fillStyle = "#0A0E27";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 500; i += 1) {
    const shade = i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)";
    ctx.fillStyle = shade;
    ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 1.5, 1.5);
  }

  ctx.fillStyle = "#E2C48A";
  ctx.font = `400 28px ${anton}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("THE ALGORITHM HAS SPOKEN", WIDTH / 2, 72);

  const cardX = 90;
  const cardY = 130;
  const cardW = 1020;
  const cardH = 250;
  ctx.fillStyle = "#F4E7D4";
  ctx.fillRect(cardX, cardY, cardW, cardH);

  ctx.fillStyle = "#9B2335";
  ctx.font = `400 68px ${anton}`;
  const statusLines = wrap(ctx, frame.reading.algo_status, cardW - 80, 2);
  const statusTop = cardY + cardH / 2 - ((statusLines.length - 1) * 74) / 2;
  statusLines.forEach((line, index) => ctx.fillText(line, WIDTH / 2, statusTop + index * 74));

  ctx.fillStyle = "#D2D0DC";
  ctx.font = `400 18px ${mono}`;
  const counsel = wrap(ctx, frame.reading.algo_counsel, 900, 4);
  counsel.forEach((line, index) => ctx.fillText(line, WIDTH / 2, 430 + index * 28));

  ctx.fillStyle = "#E2C48A";
  ctx.font = `400 16px ${mono}`;
  ctx.fillText(`${frame.soulId} · DAY ${frame.day}`, WIDTH / 2, 586);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${frame.soulId}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
