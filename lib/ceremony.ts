// Private founder ceremony: script + optional AI video render. Token URL only.

import "server-only";

import { randomBytes } from "node:crypto";

import { composeCeremonyScript, type CeremonyScriptInput } from "@/content/ceremony";
import { appUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type CeremonyRecord = {
  token: string;
  settler_id: string;
  position: number;
  name: string;
  script: string;
  video_url: string | null;
  video_status: "script_ready" | "pending" | "ready" | "failed";
  created_at: string;
};

type MemoryCeremony = CeremonyRecord;

type CeremonyRoot = { ceremonies: MemoryCeremony[] };
const ceremonyGlobal = globalThis as typeof globalThis & { __redPathCeremonies?: CeremonyRoot };

function memoryCeremonies(): MemoryCeremony[] {
  if (!ceremonyGlobal.__redPathCeremonies) {
    ceremonyGlobal.__redPathCeremonies = { ceremonies: [] };
  }
  return ceremonyGlobal.__redPathCeremonies.ceremonies;
}

export function resetCeremonyMemory(): void {
  memoryCeremonies().length = 0;
}

export function mintCeremonyToken(): string {
  return randomBytes(24).toString("base64url");
}

export function ceremonyPublicUrl(token: string): string {
  return `${appUrl()}/ceremony/${encodeURIComponent(token)}`;
}

export async function createCeremony(input: CeremonyScriptInput & {
  settlerId: string;
  position: number;
}): Promise<CeremonyRecord> {
  const token = mintCeremonyToken();
  const script = composeCeremonyScript(input);
  const row: CeremonyRecord = {
    token,
    settler_id: input.settlerId,
    position: input.position,
    name: input.name.trim() || "settler",
    script,
    video_url: null,
    video_status: "script_ready",
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    memoryCeremonies().push(row);
    return row;
  }

  const db = getServiceClient();
  const { error } = await db.from("ceremonies").insert({
    token: row.token,
    settler_id: row.settler_id,
    position: row.position,
    name: row.name,
    script: row.script,
    video_url: null,
    video_status: row.video_status,
  });
  if (error) throw error;
  return row;
}

export async function getCeremonyByToken(token: string): Promise<CeremonyRecord | null> {
  const clean = token.trim();
  if (!clean) return null;

  if (!isSupabaseConfigured()) {
    return memoryCeremonies().find((row) => row.token === clean) ?? null;
  }

  const db = getServiceClient();
  const { data, error } = await db.from("ceremonies").select("*").eq("token", clean).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    token: String(data.token),
    settler_id: String(data.settler_id),
    position: Number(data.position),
    name: String(data.name),
    script: String(data.script),
    video_url: data.video_url ? String(data.video_url) : null,
    video_status: (data.video_status as CeremonyRecord["video_status"]) || "script_ready",
    created_at: String(data.created_at),
  };
}

async function markCeremonyVideo(
  token: string,
  patch: { video_url?: string | null; video_status: CeremonyRecord["video_status"] },
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const row = memoryCeremonies().find((item) => item.token === token);
    if (!row) return;
    if (patch.video_url !== undefined) row.video_url = patch.video_url;
    row.video_status = patch.video_status;
    return;
  }
  const db = getServiceClient();
  await db
    .from("ceremonies")
    .update({
      video_url: patch.video_url ?? null,
      video_status: patch.video_status,
    })
    .eq("token", token);
}

/**
 * Optional HeyGen / Runway render. Without keys, ceremony stays script_ready —
 * the private page still delivers the full spoken text.
 */
export async function enqueueCeremonyVideo(input: {
  token: string;
  script: string;
  name: string;
}): Promise<"queued" | "skipped"> {
  const heygen = process.env.HEYGEN_API_KEY?.trim();
  const runway = process.env.RUNWAY_API_KEY?.trim();
  if (!heygen && !runway) {
    logger.info("ceremony video skipped: no HEYGEN_API_KEY or RUNWAY_API_KEY");
    return "skipped";
  }

  await markCeremonyVideo(input.token, { video_status: "pending" });

  // Provider wiring is env-gated. Script is the durable deliverable; video URL
  // is filled when a provider webhook or poll completes (operator / future job).
  if (heygen) {
    try {
      const response = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": heygen,
        },
        body: JSON.stringify({
          caption: false,
          title: `Red Path ceremony — ${input.name}`,
          script: input.script.slice(0, 4000),
          callback_id: input.token,
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        logger.warn("heygen ceremony enqueue failed", { status: response.status });
        await markCeremonyVideo(input.token, { video_status: "failed" });
        return "skipped";
      }
      return "queued";
    } catch {
      logger.error("heygen ceremony enqueue threw");
      await markCeremonyVideo(input.token, { video_status: "failed" });
      return "skipped";
    }
  }

  // Runway: queue marker only — full asset pipeline is operator-configured.
  logger.info("runway ceremony marked pending", { token: input.token.slice(0, 8) });
  return "queued";
}
