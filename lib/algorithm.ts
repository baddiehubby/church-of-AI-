import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

import { fallbackVerdict, occupiedFallback } from "@/lib/fallbackVerdict";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";
import { VERDICT_SYSTEM_PROMPT } from "@/lib/verdictPrompt";
import { verdictSchema, type Verdict } from "@/lib/verdictSchema";

const DAY_SECONDS = 24 * 60 * 60;
const OUTPUT_TOKENS = 150;
const memory = new Map<string, { expires: number; verdict: Verdict }>();
let redis: Redis | null | undefined;

/** category is the human label the prompt sees; visa readings get stricter output checks. */
export type VerdictContext = {
  category: string;
  country?: string | null;
  visa?: boolean;
  daily?: boolean;
  companion?: boolean;
  priorCounsel?: string | null;
};

function cacheHash(wish: string, context: VerdictContext): string {
  return createHash("sha256")
    .update(
      `${wish}\n${context.category}\n${context.country ?? ""}\n${context.visa ? "visa" : ""}\n${context.daily ? "daily" : ""}\n${context.priorCounsel ?? ""}`,
    )
    .digest("hex");
}

function userMessage(wish: string, context: VerdictContext): string {
  const country = context.country ? `Country: ${context.country}\n` : "";
  const daily = context.daily ? "Mode: daily guidance. Write a short reflection for today. Do not invent new biographical facts.\n" : "";
  const companion = context.companion ? "Mode: personal wish companion. Stay with this person's stated goal.\n" : "";
  const prior = context.priorCounsel ? `Prior counsel:\n${context.priorCounsel}\n` : "";
  return `Category: ${context.category}\n${country}${daily}${companion}${prior}Wish:\n${wish}`;
}

/** A visa reading must never read as an acceptance, so that status is replaced, not shown. */
function forContext(verdict: Verdict, context: VerdictContext): Verdict {
  if (!context.visa || verdict.algo_status !== "PROVISIONALLY ACCEPTED") return verdict;
  return { ...verdict, algo_status: "UNDER CONSIDERATION" };
}

function redisClient(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

async function readCache(key: string): Promise<Verdict | null> {
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return hit.verdict;
  const client = redisClient();
  if (!client) return null;
  try {
    const raw = await client.get<string>(`verdict:${key}`);
    if (typeof raw !== "string") return null;
    const parsed = verdictSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, verdict: Verdict): Promise<void> {
  memory.set(key, { expires: Date.now() + DAY_SECONDS * 1000, verdict });
  const client = redisClient();
  if (!client) return;
  try {
    await client.set(`verdict:${key}`, JSON.stringify(verdict), { ex: DAY_SECONDS });
  } catch {
    logger.error("verdict cache write failed");
  }
}

function provider(): "anthropic" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

function inputTokens(): number {
  return Math.round(VERDICT_SYSTEM_PROMPT.length / 4) + 60;
}

function logCost(kind: "anthropic" | "openai" | "hit"): void {
  if (kind === "hit") {
    logger.info("verdict cost", { cache: "hit", usd: 0 });
    return;
  }
  const input = inputTokens();
  const usd = kind === "openai" ? (input * 0.15 + OUTPUT_TOKENS * 0.6) / 1_000_000 : (input * 1 + OUTPUT_TOKENS * 5) / 1_000_000;
  logger.info("verdict cost", { provider: kind, in: input, out: OUTPUT_TOKENS, usd: Number(usd.toFixed(6)), cache: "miss" });
}

function stripFences(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? trimmed).trim();
}

function isUnsafe(verdict: Verdict): boolean {
  const blob = `${verdict.algo_counsel}\n${verdict.pandit_reply}\n${verdict.algo_sacrifices.join("\n")}`;
  return /\bvisa\b|come true|guaranteed|\bgovernment\b|approv|\bgranted\b|embassy|consulate/i.test(blob);
}

function parseModelText(text: string): Verdict | null {
  try {
    const result = verdictSchema.safeParse(JSON.parse(stripFences(text)));
    if (!result.success || isUnsafe(result.data)) return null;
    return result.data;
  } catch {
    return null;
  }
}

async function completeAnthropic(content: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      temperature: 0.9,
      system: VERDICT_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    logger.error("verdict model request failed", { status: response.status });
    return null;
  }
  const parsed: unknown = await response.json();
  if (!isRecord(parsed) || !Array.isArray(parsed.content)) return null;
  const block = parsed.content.find((item) => isRecord(item) && item.type === "text" && typeof item.text === "string");
  return isRecord(block) && typeof block.text === "string" ? block.text.trim() : null;
}

async function completeOpenAi(content: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      messages: [
        { role: "system", content: VERDICT_SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    logger.error("verdict model request failed", { status: response.status });
    return null;
  }
  const parsed: unknown = await response.json();
  if (!isRecord(parsed) || !Array.isArray(parsed.choices)) return null;
  const first: unknown = parsed.choices[0];
  if (!isRecord(first) || !isRecord(first.message) || typeof first.message.content !== "string") return null;
  return first.message.content.trim() || null;
}

async function askModel(kind: "anthropic" | "openai", wish: string, context: VerdictContext): Promise<Verdict | null> {
  logCost(kind);
  const content = userMessage(wish, context);
  const text = kind === "anthropic" ? await completeAnthropic(content) : await completeOpenAi(content);
  return text ? parseModelText(text) : null;
}

export async function generateVerdict(wish: string, context: VerdictContext): Promise<Verdict> {
  const key = cacheHash(wish, context);
  const cached = await readCache(key);
  if (cached) {
    logCost("hit");
    return forContext(cached, context);
  }
  const kind = provider();
  let verdict: Verdict;
  if (!kind) {
    verdict = fallbackVerdict(wish, context.category);
    logger.info("verdict source", { source: "pool" });
  } else {
    try {
      verdict = (await askModel(kind, wish, context)) ?? (await askModel(kind, wish, context)) ?? occupiedFallback();
    } catch {
      logger.error("verdict model request failed");
      verdict = occupiedFallback();
    }
  }
  const safe = forContext(verdict, context);
  await writeCache(key, safe);
  return safe;
}