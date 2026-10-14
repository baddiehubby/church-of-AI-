// Mars surface env checks. Call from server routes / health — never ship secrets to the browser.

import "server-only";

export type MarsEnvReport = {
  ok: boolean;
  production: boolean;
  sessionSecret: boolean;
  supabase: boolean;
  upstash: boolean;
  warnings: string[];
};

export function reportMarsEnv(): MarsEnvReport {
  const production = process.env.NODE_ENV === "production";
  const sessionSecret = Boolean(process.env.SESSION_SECRET?.trim());
  const supabase = Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const upstash = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );

  const warnings: string[] = [];
  const onVercel = process.env.VERCEL === "1";
  if (!sessionSecret) {
    warnings.push(
      onVercel
        ? "SESSION_SECRET is required on Vercel"
        : "SESSION_SECRET missing; using local mars_owner fallback",
    );
  }
  if (!supabase) {
    warnings.push("Supabase unset; transmissions use in-memory store (lost on restart)");
  }
  if ((production || onVercel) && !upstash) {
    warnings.push("Upstash unset; rate limits are per-instance only");
  }

  const ok = !onVercel || (sessionSecret && supabase);
  return { ok, production, sessionSecret, supabase, upstash, warnings };
}
