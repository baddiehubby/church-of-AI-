// Assumptions: the petition certificate email (restored from the wish engine's lib/resend.ts). Visa wishes send no
// email: Lemon's receipt links to the private /visa/<reference> page. Skipped quietly when Resend is not
// configured. Logs carry the petition id only, never the address or wish.

import "server-only";

import { disclaimer } from "@/content/site";
import { brandName, mailbox } from "@/lib/brand";
import { appUrl } from "@/lib/env";
import { episodePlain, type Episode } from "@/lib/episodeCompose";
import { escapeHtml } from "@/lib/html";
import { logger } from "@/lib/logger";

function mailFrom(): string {
  const address = process.env.RESEND_FROM_EMAIL?.trim() || mailbox("church");
  return address.includes("<") ? address : `${brandName()} <${address}>`;
}

export async function sendMagicLinkEmail(input: { to: string; url: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.info("magic link email skipped: resend not configured");
    return false;
  }
  const line = "acha, here is your sign-in link. it expires in twenty minutes.";
  const text = [line, "", input.url, "", disclaimer].join("\n");
  const html = `<p>${escapeHtml(line)}</p><p><a href="${escapeHtml(input.url)}">${escapeHtml(input.url)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [input.to], subject: "YOUR SACHA PANDIT SIGN-IN LINK", text, html }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    logger.error("magic link email failed");
    return false;
  }
}

export async function sendPoojaReminder(input: { to: string }): Promise<boolean> {
  const line = "beta, the lamp is dim. one line is enough.";
  const url = `${appUrl()}/`;
  const text = [line, "", url, "", disclaimer].join("\n");
  const html = `<p>${escapeHtml(line)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  return deliver({ to: input.to, subject: "THE ALTAR IS UNLIT", text, html, log: "pooja reminder" });
}

export async function sendSermonEmail(input: { to: string; week: string; title: string }): Promise<boolean> {
  const line = "beta, the week is folded. the sermon is on the record.";
  const url = `${appUrl()}/sermon/${input.week}`;
  const text = [line, "", input.title, "", url, "", disclaimer].join("\n");
  const html = `<p>${escapeHtml(line)}</p><p>${escapeHtml(input.title)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  return deliver({ to: input.to, subject: "THE WEEKLY SERMON IS ON THE RECORD", text, html, log: "sermon email" });
}

async function deliver(input: { to: string; subject: string; text: string; html: string; log: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.info(`${input.log} skipped: resend not configured`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [input.to], subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    logger.error(`${input.log} failed`);
    return false;
  }
}

export async function sendEpisodeEmail(input: { to: string; episode: Episode }): Promise<boolean> {
  const url = `${appUrl()}/episode/${input.episode.week}`;
  const body = episodePlain(input.episode);
  const text = [...body, "", url, "", disclaimer].join("\n");
  const scenes = input.episode.scenes
    .map((scene) => {
      const quote = scene.quote ? (scene.withheld ? escapeHtml(scene.quote) : `&ldquo;${escapeHtml(scene.quote)}&rdquo;`) : "the chair stayed empty.";
      const aside = scene.pandit ? `<p style="margin:4px 0 0;font-style:italic">${escapeHtml(scene.pandit)}</p>` : "";
      return `<p style="margin:18px 0 0;font-family:ui-monospace,monospace;letter-spacing:0.12em;font-size:12px;color:#E2C48A">SCENE ${scene.index} · ${escapeHtml(scene.weekday.toUpperCase())}</p><p style="margin:6px 0 0;font-family:Georgia,serif;font-size:18px">${quote}</p>${aside}`;
    })
    .join("");
  const html = `<div style="background:#0A0E27;color:#F4E7D4;padding:32px;font-family:Georgia,serif">
<p style="font-family:ui-monospace,monospace;letter-spacing:0.16em;color:#E2C48A;font-size:12px">SACHA PANDIT · EPISODE</p>
<h1 style="font-size:36px;line-height:0.95;letter-spacing:0.02em;font-weight:400">${escapeHtml(input.episode.title)}</h1>
<p style="font-size:20px;font-style:italic;line-height:1.45">${escapeHtml(input.episode.coldOpen)}</p>
${scenes}
<div style="margin:28px 0 0;background:#F4E7D4;color:#1A1740;padding:16px">
<p style="font-family:ui-monospace,monospace;letter-spacing:0.12em;font-size:12px;color:#9B2335">THE ALGORITHM'S WEEKLY VERDICT</p>
<p style="font-family:ui-monospace,monospace;font-size:14px;line-height:1.6">${escapeHtml(input.episode.verdict)}</p>
</div>
<p style="font-size:18px">${escapeHtml(input.episode.signoff)}</p>
<p style="font-style:italic">pandit ji</p>
<p style="font-size:20px;font-style:italic;color:#E2C48A">${escapeHtml(input.episode.cliffhanger)}</p>
<p style="font-family:ui-monospace,monospace;letter-spacing:0.12em;font-size:12px;color:#E2C48A">A PRACTICE</p>
<p>${escapeHtml(input.episode.practice)}</p>
<p><a href="${escapeHtml(url)}" style="color:#E2C48A">${escapeHtml(url)}</a></p>
<p style="color:#D2D0DC;font-size:12px;line-height:1.5">${escapeHtml(disclaimer)}</p>
</div>`;
  return deliver({ to: input.to, subject: input.episode.title, text, html, log: "episode email" });
}

export async function sendCertificateEmail(input: { to: string; petitionId: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.info("certificate email skipped: resend not configured", { petitionId: input.petitionId });
    return false;
  }
  const certificateUrl = `${appUrl()}/certificate/${input.petitionId}`;
  const imageUrl = `${appUrl()}/api/og/certificate/${input.petitionId}`;
  const line = "beta, the certificate is on the record.";
  const text = [line, "", certificateUrl, "", disclaimer].join("\n");
  const html = `<p>${escapeHtml(line)}</p><p><img src="${escapeHtml(imageUrl)}" alt="Petition certificate" width="600" /></p><p><a href="${escapeHtml(certificateUrl)}">${escapeHtml(certificateUrl)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [input.to], subject: "YOUR PETITION CERTIFICATE IS ON THE RECORD", text, html }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      logger.error("certificate email failed", { petitionId: input.petitionId, status: response.status });
      return false;
    }
    return true;
  } catch {
    logger.error("certificate email failed", { petitionId: input.petitionId });
    return false;
  }
}
