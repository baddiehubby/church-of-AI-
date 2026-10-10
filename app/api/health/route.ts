// Assumptions: public, unauthenticated uptime probe. Checks Supabase (select petition_id from petitions limit 1) and
// Lemon Squeezy (authenticated GET of the configured store) in parallel, 5s timeout each. Reports only
// "ok" | "down" | "unconfigured"; never secrets, upstream bodies, or stack traces. Not rate-limited. No caching.

import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = "ok" | "down" | "unconfigured";

const TIMEOUT_MS = 5_000;

async function checkSupabase(): Promise<Check> {
  if (!isSupabaseConfigured()) return "unconfigured";
  try {
    const { error } = await getServiceClient().from("petitions").select("petition_id").limit(1).abortSignal(AbortSignal.timeout(TIMEOUT_MS));
    return error ? "down" : "ok";
  } catch {
    return "down";
  }
}

async function checkLemon(): Promise<Check> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  if (!apiKey || !storeId) return "unconfigured";
  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/stores/${encodeURIComponent(storeId)}`, {
      headers: { Accept: "application/vnd.api+json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    return response.ok ? "ok" : "down";
  } catch {
    return "down";
  }
}

export async function GET(): Promise<Response> {
  const [supabase, lemon] = await Promise.all([checkSupabase(), checkLemon()]);
  const ok = supabase === "ok" && lemon === "ok";
  if (!ok) logger.warn("health degraded", { supabase, lemon });
  return NextResponse.json({ ok, supabase, lemon }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
