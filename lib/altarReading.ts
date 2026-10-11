// Assumptions: one reading per reflection, cached 24h in memory. No database.
// The Algorithm and Pandit ji do not agree. Nothing here says the line comes true.
// A crisis line is not sent to the model.

import { createHash } from "node:crypto";

import { ALTAR_STATUSES, type AltarReading, type AltarStatus } from "@/content/altarScene";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { algoVoiceOk, panditVoiceOk, voicesDisagree } from "@/lib/voice";

export const ALTAR_SYSTEM_PROMPT = `You are two characters responding to a human's daily reflection. THE ALGORITHM
speaks in ALL CAPS, no contractions, formal, patient, ominous. PANDIT JI speaks
in lowercase, warm, tired, deadpan, uses 'beta' sparingly. They never merge.
They never agree. Output strict JSON. No preamble.`;

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.9;
const DAY_MS = 24 * 60 * 60 * 1000;
const UNSAFE = /\b(come true|comes true|guaranteed|visa approved|will happen|it is granted)\b/i;

type CacheEntry = { at: number; reading: AltarReading };

function cache(): Map<string, CacheEntry> {
  const host = globalThis as typeof globalThis & { __altarReadings?: Map<string, CacheEntry> };
  if (!host.__altarReadings) host.__altarReadings = new Map();
  return host.__altarReadings;
}

export class AltarDeskClosed extends Error {
  constructor() {
    super("altar desk closed");
    this.name = "AltarDeskClosed";
  }
}

export function reflectionHash(reflection: string): string {
  return createHash("sha256").update(reflection).digest("hex");
}

export function readCachedReading(reflection: string, now = Date.now()): AltarReading | null {
  const map = cache();
  const key = reflectionHash(reflection);
  const hit = map.get(key);
  if (!hit) return null;
  if (now - hit.at >= DAY_MS) {
    map.delete(key);
    return null;
  }
  return hit.reading;
}

export function writeCachedReading(reflection: string, reading: AltarReading, now = Date.now()): void {
  const map = cache();
  if (map.size > 400) {
    for (const [key, entry] of map) if (now - entry.at >= DAY_MS) map.delete(key);
  }
  if (map.size > 400) {
    const oldest = map.keys().next().value;
    if (oldest) map.delete(oldest);
  }
  map.set(reflectionHash(reflection), { at: now, reading });
}

export function resetAltarReadingCache(): void {
  cache().clear();
}

function sentences(value: string): string[] {
  return value
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isStatus(value: string): value is AltarStatus {
  return (ALTAR_STATUSES as readonly string[]).includes(value);
}

function disagrees(algo: string, pandit: string): boolean {
  if (!voicesDisagree(algo, pandit)) return false;
  const pieces = algo
    .toLowerCase()
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 12);
  return pieces.every((piece) => !pandit.includes(piece));
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  try {
    return JSON.parse((fenced?.[1] ?? trimmed).trim());
  } catch {
    return null;
  }
}

export function parseAltarReading(raw: unknown): AltarReading | null {
  const record = typeof raw === "string" ? parseJson(raw) : raw;
  if (!isRecord(record)) return null;
  if (typeof record.algo_status !== "string" || !isStatus(record.algo_status)) return null;
  if (typeof record.algo_counsel !== "string" || typeof record.pandit_reply !== "string" || typeof record.verdict_card !== "string") {
    return null;
  }
  const counsel = record.algo_counsel.trim();
  const pandit = record.pandit_reply.trim();
  const card = record.verdict_card.trim();
  const counselSentences = sentences(counsel);
  if (!counsel.endsWith(".") || counselSentences.length < 2 || counselSentences.length > 3) return null;
  if (counsel.length > 480 || !algoVoiceOk(counsel)) return null;
  if (!pandit.endsWith(".") || sentences(pandit).length !== 1 || pandit.length > 180) return null;
  if (!panditVoiceOk(pandit)) return null;
  const betas = pandit.match(/\bbeta\b/g) ?? [];
  if (betas.length > 1) return null;
  if (card.length < 8 || card.length > 60 || !algoVoiceOk(card)) return null;
  if (!disagrees(counsel, pandit) || !disagrees(card, pandit)) return null;
  if (UNSAFE.test(`${counsel}\n${pandit}\n${card}`)) return null;
  return { algo_status: record.algo_status, algo_counsel: counsel, pandit_reply: pandit, verdict_card: card };
}

const CRISIS_READING = {
  algo_status: "UNDER CONSIDERATION",
  algo_counsel: "THIS DESK IS NOT A CRISIS SERVICE. A HUMAN PROFESSIONAL IS REQUIRED.",
  pandit_reply: "beta, leave this page and call or text 988.",
  verdict_card: "A HUMAN IS REQUIRED",
} as const;

export function crisisAltarReading(): AltarReading {
  const reading = parseAltarReading(CRISIS_READING);
  if (!reading) throw new Error("crisis reading failed voice check");
  return reading;
}

function userPrompt(reflection: string): string {
  return [
    "Respond to the reflection below.",
    "Output one JSON object and nothing else, with exactly these keys:",
    'algo_status: one of "UNDER CONSIDERATION", "PROVISIONALLY ACCEPTED", "REQUIRES FURTHER PETITION". Match the capitals exactly.',
    "algo_counsel: two or three sentences. ALL CAPS. No contractions. No first person. No question marks. No exclamation marks. Formal, deadpan, patient, ominous. End each sentence with a period.",
    "pandit_reply: exactly one sentence, entirely lowercase, warm, tired, deadpan. Use the word beta at most once. End with a period. Do not repeat the Algorithm.",
    "verdict_card: one short ALL CAPS line of 8 to 60 characters for a title card. No question marks. No exclamation marks.",
    "The two voices must not agree. Do not say the reflection comes true. Do not mention a government, a visa, an employer, or a romantic partner.",
    "Reflection:",
    reflection,
  ].join("\n");
}

async function completeAltar(reflection: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ALTAR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt(reflection) },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    logger.error("altar model request failed", { status: response.status });
    return null;
  }
  const parsed: unknown = await response.json();
  if (!isRecord(parsed) || !Array.isArray(parsed.choices)) return null;
  const first: unknown = parsed.choices[0];
  if (!isRecord(first) || !isRecord(first.message) || typeof first.message.content !== "string") return null;
  return first.message.content.trim() || null;
}

export async function generateAltarReading(reflection: string): Promise<AltarReading | null> {
  const cached = readCachedReading(reflection);
  if (cached) {
    logger.info("altar reading", { cache: "hit" });
    return cached;
  }
  if (!process.env.OPENAI_API_KEY?.trim()) throw new AltarDeskClosed();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const text = await completeAltar(reflection);
      const reading = text ? parseAltarReading(text) : null;
      if (reading) {
        writeCachedReading(reflection, reading);
        logger.info("altar reading", { cache: "miss", attempt, model: MODEL });
        return reading;
      }
    } catch (error) {
      if (error instanceof AltarDeskClosed) throw error;
      logger.error("altar model request failed");
    }
  }
  logger.error("altar reading rejected");
  return null;
}
