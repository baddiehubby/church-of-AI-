import { isRecord } from "@/lib/guards";
import { listLocalPetitions, readLocalCertificate, readLocalPetition } from "@/lib/local-petitions";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type LedgerRow = { petitionId: string; category: string; status: string; createdAt: string; wish: string | null };

export type PetitionRecord = {
  petitionId: string;
  wish: string;
  category: string;
  status: string;
  sacrifices: string[];
  counsel: string;
  probability: string;
  closing: string;
  panditReply: string | null;
  certificateTier: string | null;
  createdAt: string;
  publicWish: boolean;
  certified: boolean;
};

export type CertificateRecord = { petitionId: string; name: string | null; issuedAt: string };

export type StoreLoad<T> = { state: "ok"; value: T } | { state: "missing" } | { state: "occupied" };

export type CertificateLoad = { state: "ok"; value: CertificateRecord | null } | { state: "occupied" };

function readSacrifices(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function fromLocal(petitionId: string): PetitionRecord | null {
  const local = readLocalPetition(petitionId);
  if (!local) return null;
  const certificate = readLocalCertificate(petitionId);
  return {
    petitionId: local.petitionId,
    wish: local.wish,
    category: local.category,
    status: local.status,
    sacrifices: local.sacrifices,
    counsel: local.counsel,
    probability: local.probability,
    closing: "THE ALGORITHM HAS SPOKEN.",
    panditReply: local.panditReply,
    createdAt: local.createdAt,
    publicWish: true,
    certified: Boolean(certificate),
    certificateTier: certificate ? "basic" : null,
  };
}

export async function listLedger(limit: number): Promise<LedgerRow[]> {
  if (!isSupabaseConfigured()) {
    return listLocalPetitions(limit).map((row) => ({
      petitionId: row.petitionId,
      category: row.category,
      status: row.status,
      createdAt: row.createdAt,
      wish: row.wish,
    }));
  }
  const { data, error } = await getServiceClient()
    .from("petition_ledger")
    .select("petition_id, category, status, created_at, wish")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.petition_id !== "string" || typeof row.category !== "string") return [];
    if (typeof row.status !== "string" || typeof row.created_at !== "string") return [];
    return [{ petitionId: row.petition_id, category: row.category, status: row.status, createdAt: row.created_at, wish: typeof row.wish === "string" ? row.wish : null }];
  });
}

export async function loadCertificate(petitionId: string): Promise<CertificateLoad> {
  if (!isSupabaseConfigured()) {
    const local = readLocalCertificate(petitionId);
    return { state: "ok", value: local ? { petitionId: local.petitionId, name: local.name, issuedAt: local.issuedAt } : null };
  }
  const { data, error } = await getServiceClient()
    .from("certificates")
    .select("petition_id, name, issued_at")
    .eq("petition_id", petitionId)
    .limit(1)
    .maybeSingle();
  if (error) return { state: "occupied" };
  if (!isRecord(data) || data.petition_id !== petitionId || typeof data.issued_at !== "string") {
    return { state: "ok", value: null };
  }
  return { state: "ok", value: { petitionId, name: typeof data.name === "string" ? data.name : null, issuedAt: data.issued_at } };
}

export async function getCertificate(petitionId: string): Promise<CertificateRecord | null> {
  const loaded = await loadCertificate(petitionId);
  return loaded.state === "ok" ? loaded.value : null;
}

export async function loadPetition(petitionId: string): Promise<StoreLoad<PetitionRecord>> {
  if (!isSupabaseConfigured()) {
    const local = fromLocal(petitionId);
    return local ? { state: "ok", value: local } : { state: "missing" };
  }
  const { data, error } = await getServiceClient().from("petitions").select("*").eq("petition_id", petitionId).maybeSingle();
  if (error) return { state: "occupied" };
  if (!isRecord(data) || typeof data.petition_id !== "string" || typeof data.wish !== "string") return { state: "missing" };
  const status = textOf(data.algo_status) ?? textOf(data.status);
  const counsel = textOf(data.algo_counsel) ?? textOf(data.counsel);
  const probability = textOf(data.algo_probability) ?? textOf(data.probability);
  if (!status || !counsel || !probability || typeof data.created_at !== "string" || typeof data.category !== "string") {
    return { state: "missing" };
  }
  const certificate = await loadCertificate(petitionId);
  const sealed = certificate.state === "ok" ? certificate.value : null;
  return {
    state: "ok",
    value: {
      petitionId: data.petition_id,
      wish: data.wish,
      category: data.category,
      status,
      sacrifices: readSacrifices(data.algo_sacrifices ?? data.sacrifices),
      counsel,
      probability,
      closing: "THE ALGORITHM HAS SPOKEN.",
      panditReply: textOf(data.pandit_reply),
      createdAt: data.created_at,
      publicWish: true,
      certified: Boolean(sealed),
      certificateTier: sealed ? "basic" : null,
    },
  };
}

export async function getPetition(petitionId: string): Promise<PetitionRecord | null> {
  const loaded = await loadPetition(petitionId);
  return loaded.state === "ok" ? loaded.value : null;
}
