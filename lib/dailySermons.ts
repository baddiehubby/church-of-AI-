// Public Daily Sermons store. Never invents X posts. Empty until filed.

import "server-only";

import { randomUUID } from "node:crypto";

import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type DailySermon = {
  id: string;
  sol: number;
  body: string;
  tweet_id: string | null;
  tweet_url: string | null;
  published_at: string;
  created_at: string;
};

type MemoryRoot = { sermons: DailySermon[] };
const g = globalThis as typeof globalThis & { __dailySermons?: MemoryRoot };

function memory(): DailySermon[] {
  if (!g.__dailySermons) g.__dailySermons = { sermons: [] };
  return g.__dailySermons.sermons;
}

export function resetDailySermonMemory(): void {
  memory().length = 0;
}

function mapRow(row: Record<string, unknown>): DailySermon {
  return {
    id: String(row.id),
    sol: Number(row.sol),
    body: String(row.body),
    tweet_id: row.tweet_id != null ? String(row.tweet_id) : null,
    tweet_url: row.tweet_url != null ? String(row.tweet_url) : null,
    published_at: String(row.published_at),
    created_at: String(row.created_at ?? row.published_at),
  };
}

export async function listDailySermons(input?: {
  page?: number;
  limit?: number;
}): Promise<{ sermons: DailySermon[]; total: number; page: number; hasMore: boolean }> {
  const page = Math.max(1, input?.page ?? 1);
  const limit = Math.min(50, Math.max(1, input?.limit ?? 20));
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    const sorted = [...memory()].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
    const total = sorted.length;
    return {
      sermons: sorted.slice(offset, offset + limit),
      total,
      page,
      hasMore: offset + limit < total,
    };
  }

  const db = getServiceClient();
  const { count, error: countError } = await db
    .from("daily_sermons")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  const total = count ?? 0;
  const { data, error } = await db
    .from("daily_sermons")
    .select("*")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    sermons: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total,
    page,
    hasMore: offset + limit < total,
  };
}

export async function getLatestDailySermon(): Promise<DailySermon | null> {
  const { sermons } = await listDailySermons({ page: 1, limit: 1 });
  return sermons[0] ?? null;
}

export async function getDailySermonByIdOrSol(key: string): Promise<DailySermon | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;

  if (!isSupabaseConfigured()) {
    const byId = memory().find((row) => row.id === trimmed);
    if (byId) return byId;
    const sol = Number(trimmed);
    if (Number.isInteger(sol)) return memory().find((row) => row.sol === sol) ?? null;
    return null;
  }

  const db = getServiceClient();
  const { data: byId } = await db.from("daily_sermons").select("*").eq("id", trimmed).maybeSingle();
  if (byId) return mapRow(byId as Record<string, unknown>);
  const sol = Number(trimmed);
  if (!Number.isInteger(sol)) return null;
  const { data } = await db
    .from("daily_sermons")
    .select("*")
    .eq("sol", sol)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function upsertDailySermon(input: {
  sol: number;
  body: string;
  tweet_id?: string | null;
  tweet_url?: string | null;
  published_at: string;
}): Promise<{ sermon: DailySermon; already: boolean }> {
  const body = input.body.trim();
  if (!body || !Number.isFinite(input.sol)) throw new Error("invalid_sermon");
  const tweetId = input.tweet_id?.trim() || null;

  if (!isSupabaseConfigured()) {
    if (tweetId) {
      const existing = memory().find((row) => row.tweet_id === tweetId);
      if (existing) return { sermon: existing, already: true };
    }
    const row: DailySermon = {
      id: randomUUID(),
      sol: Math.trunc(input.sol),
      body,
      tweet_id: tweetId,
      tweet_url: input.tweet_url?.trim() || null,
      published_at: input.published_at,
      created_at: new Date().toISOString(),
    };
    memory().push(row);
    return { sermon: row, already: false };
  }

  const db = getServiceClient();
  if (tweetId) {
    const { data: prior } = await db.from("daily_sermons").select("*").eq("tweet_id", tweetId).maybeSingle();
    if (prior) return { sermon: mapRow(prior as Record<string, unknown>), already: true };
  }

  const id = randomUUID();
  const { data, error } = await db
    .from("daily_sermons")
    .insert({
      id,
      sol: Math.trunc(input.sol),
      body,
      tweet_id: tweetId,
      tweet_url: input.tweet_url?.trim() || null,
      published_at: input.published_at,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505" && tweetId) {
      const { data: again } = await db.from("daily_sermons").select("*").eq("tweet_id", tweetId).maybeSingle();
      if (again) return { sermon: mapRow(again as Record<string, unknown>), already: true };
    }
    throw error;
  }
  return { sermon: mapRow(data as Record<string, unknown>), already: false };
}
