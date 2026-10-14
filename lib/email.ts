// Assumptions: the petition certificate email (restored from the wish engine's lib/resend.ts). Visa wishes send no
// email: Lemon's receipt links to the private /visa/<reference> page. Skipped quietly when Resend is not
// configured. Logs carry the petition id only, never the address or wish.

import "server-only";

import { disclaimer } from "@/content/site";
import { brandHostname, brandName, mailbox } from "@/lib/brand";
import { appUrl } from "@/lib/env";
import { episodePlain, type Episode } from "@/lib/episodeCompose";
import { escapeHtml } from "@/lib/html";
import { logger } from "@/lib/logger";

function mailFrom(): string {
  const address = process.env.RESEND_FROM_EMAIL?.trim() || mailbox("church");
  return address.includes("<") ? address : `${brandName()} <${address}>`;
}

function babaMailFrom(): string {
  const domain = brandHostname();
  const address = `baba-ji@${domain}`;
  return `Baba ji <${address}>`;
}

export async function sendPracticePaymentFailedEmail(input: {
  to: string;
  settlerId: string;
}): Promise<boolean> {
  const url = `${appUrl()}/archive`;
  const line =
    "beta, the Daily Practice offering did not clear. update the card in the Lemon portal when you can. the archive still holds your words.";
  const text = [line, "", `settler ${input.settlerId}`, "", url, "", disclaimer].join("\n");
  const html = `<p>${escapeHtml(line)}</p><p>${escapeHtml(input.settlerId)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  return deliver({
    to: input.to,
    subject: "THE DAILY PRACTICE — PAYMENT DID NOT CLEAR",
    text,
    html,
    log: "practice payment failed email",
  });
}

export async function sendFounderInductionEmail(input: {
  to: string;
  name: string;
  position: number;
  note: string;
  subject: string;
  ceremonyUrl: string;
}): Promise<boolean> {
  const archive = `${appUrl()}/archive?upgraded=founder_1000`;
  const text = [input.note, "", archive, "", disclaimer].join("\n");
  const html = `<pre style="font-family:Georgia,serif;white-space:pre-wrap">${escapeHtml(input.note)}</pre><p><a href="${escapeHtml(input.ceremonyUrl)}">${escapeHtml(input.ceremonyUrl)}</a></p><p><a href="${escapeHtml(archive)}">${escapeHtml(archive)}</a></p><p>${escapeHtml(disclaimer)}</p>`;
  return deliver({
    to: input.to,
    subject: input.subject,
    text,
    html,
    from: babaMailFrom(),
    log: "founder induction email",
  });
}

export async function sendFounderFulfillmentEmail(input: {
  subject: string;
  body: string;
}): Promise<boolean> {
  const to =
    process.env.FULFILLMENT_EMAIL?.trim() ||
    process.env.OPERATOR_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    mailbox("church");
  return deliver({
    to,
    subject: input.subject,
    text: input.body,
    html: `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(input.body)}</pre>`,
    log: "founder fulfillment email",
  });
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

async function deliver(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  log: string;
  from?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.info(`${input.log} skipped: resend not configured`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: input.from ?? mailFrom(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
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

export async function sendBlessingEmail(input: {
  to: string;
  blessingId: string;
  name: string;
  habitatId: string;
  sol: number;
  blessingText: string;
  tierLabel: string;
}): Promise<boolean> {
  const url = `${appUrl()}/blessing/${input.blessingId}`;
  const line = "acha. you're in, beta. the card is on the record.";
  const text = [
    line,
    "",
    input.tierLabel,
    `for ${input.name}`,
    `Habitat ${input.habitatId} · Sol ${input.sol}`,
    "",
    `"${input.blessingText}"`,
    "",
    "— Baba ji",
    "",
    url,
    "",
    disclaimer,
  ].join("\n");
  const html = `<div style="background:#0A0E27;color:#F4EDE0;padding:28px;font-family:Georgia,serif">
<p style="font-style:italic">${escapeHtml(line)}</p>
<div style="margin:20px 0;background:#F4EDE0;color:#1A1420;padding:20px">
<p style="font-family:ui-monospace,monospace;letter-spacing:0.14em;font-size:12px;color:#C8102E">${escapeHtml(input.tierLabel)}</p>
<p style="margin:12px 0 0">for ${escapeHtml(input.name)}</p>
<p style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em">Habitat ${escapeHtml(input.habitatId)} · Sol ${input.sol}</p>
<p style="margin:16px 0;font-style:italic;line-height:1.45">“${escapeHtml(input.blessingText)}”</p>
<p>— Baba ji</p>
</div>
<p><a href="${escapeHtml(url)}" style="color:#00C8FF">${escapeHtml(url)}</a></p>
<p style="color:#D2D0DC;font-size:12px;line-height:1.5">${escapeHtml(disclaimer)}</p>
</div>`;
  return deliver({ to: input.to, subject: "YOUR BLESSING IS ON THE RECORD", text, html, log: "blessing email" });
}

export async function sendBabaLetterEmail(input: {
  to: string;
  monthLabel: string;
  body: string;
  letterUrl: string;
}): Promise<boolean> {
  const subject = `a letter from baba ji — ${input.monthLabel}`;
  const text = [input.body, "", input.letterUrl, "", disclaimer].join("\n");
  const html = `<div style="background:#F4EDE0;color:#1A1420;padding:28px;font-family:Georgia,serif;line-height:1.55">
<pre style="white-space:pre-wrap;font-family:Georgia,serif;font-size:16px;margin:0">${escapeHtml(input.body)}</pre>
<p style="margin:24px 0 0"><a href="${escapeHtml(input.letterUrl)}" style="color:#C8102E">${escapeHtml(input.letterUrl)}</a></p>
<p style="color:#7A6A5A;font-size:12px;line-height:1.5;margin-top:24px">${escapeHtml(disclaimer)}</p>
</div>`;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.info("baba letter email skipped: resend not configured");
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: babaMailFrom(),
        to: [input.to],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    logger.error("baba letter email failed");
    return false;
  }
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
