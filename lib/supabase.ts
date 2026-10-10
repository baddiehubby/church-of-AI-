// Assumptions: only server code talks to Supabase, always with the service role (RLS is bypassed).
// There is no anon client; the browser never receives a Supabase key.

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseNotConfigured extends Error {
  constructor() {
    super("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    this.name = "SupabaseNotConfigured";
  }
}

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new SupabaseNotConfigured();
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
