// 1200×630 bone card. The thing settlers screenshot.

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
  return lines;
}

export async function downloadBlessingPng(input: {
  title: string;
  name: string;
  habitatId: string;
  sol: number;
  blessingText: string;
}): Promise<void> {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const mono = family("--font-mono-face", "ui-monospace");
  const serif = family("--font-baba-face", "Georgia");
  await Promise.all([
    document.fonts.load(`400 22px ${mono}`),
    document.fonts.load(`500 34px ${serif}`),
    document.fonts.load(`italic 500 36px ${serif}`),
  ]);

  ctx.fillStyle = "#0A0E27";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#F4EDE0";
  ctx.fillRect(70, 50, 1060, 530);

  ctx.fillStyle = "#C8102E";
  ctx.font = `400 22px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText(input.title, 120, 120);
  ctx.fillStyle = "#1A1420";
  ctx.fillRect(120, 140, 220, 1);

  ctx.font = `500 28px ${serif}`;
  ctx.fillText(`for ${input.name}`, 120, 200);
  ctx.font = `400 18px ${mono}`;
  ctx.fillText(`Habitat ${input.habitatId} · Sol ${input.sol}`, 120, 236);

  ctx.font = `italic 500 34px ${serif}`;
  const lines = wrap(ctx, `"${input.blessingText}"`, 900, 4);
  lines.forEach((line, index) => ctx.fillText(line, 120, 310 + index * 46));

  ctx.font = `500 24px ${serif}`;
  ctx.fillText("— Baba ji", 120, 520);
  ctx.strokeStyle = "#1A1420";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(780, 500);
  ctx.bezierCurveTo(820, 470, 860, 530, 900, 490);
  ctx.bezierCurveTo(930, 460, 980, 520, 1040, 480);
  ctx.stroke();

  const link = document.createElement("a");
  link.download = "baba-ji-blessing.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
