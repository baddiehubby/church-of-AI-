// Assumptions: server-only store for $10 visa wishes (table visa_wishes, migration 004). A row is written as
// 'pending' before checkout and becomes 'paid' only through applyPaidOrder, which the webhook calls after HMAC
// verification. Views for anything not paid never include the wish, the reading, or certificate fields.
// reference_id is the private, unguessable link token (160 bits); certificate_no is the public number printed on
// the certificate and used for share links. With Supabase unset, a per-process memory store is used outside
// production (local dev and tests); in production the store is unavailable and checkout reports a config error.

import "server-only";

import { randomBytes } from "node:crypto";

import { categoryById, isCategoryId, type CategoryId } from "@/content/categories";
import { generateVerdict } from "@/lib/algorithm";
import { isRecord } from "@/lib/guards";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export const REFERENCE_PATTERN = /^vw_[a-z2-7]{32}$/;
export const CERTIFICATE_NO_PATTERN = /^SP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";
const PUBLIC_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type VisaStatus = "pending" | "paid" | "refunded";

export type VisaReading = {
  status: string;
  sacrifices: string[];
  counsel: string;
  probability: string;
  panditReply: string;
};

export type VisaCertificate = {
  certificateNo: string;
  categoryLabel: string;
  country: string;
  wish: string;
  firstName: string | null;
  issuedAt: string;
};

export type VisaView =
  | { state: "missing" }
  | { state: "pending" }
  | { state: "refunded" }
  | { state: "paid"; certificate: VisaCertificate; reading: VisaReading | null };

export type SharedVisa = Omit<VisaCertificate, "wish"> & { reading: VisaReading | null };

type Row = {
  reference_id: string;
  certificate_no: string;
  category: string;
  country: string;
  wish: string;
  first_name: string | null;
  status: VisaStatus;
  lemon_order_id: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  reading: VisaReading | null;
  created_at: string;
};

export class VisaStoreUnavailable extends Error {
  constructor() {
    super("visa store unavailable");
    this.name = "VisaStoreUnavailable";
  }
}

export class VisaStoreError extends Error {
  constructor(code: string) {
    super(`visa store error: ${code}`);
    this.name = "VisaStoreError";
  }
}

export function isVisaReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}

export function isCertificateNo(value: string): boolean {
  return CERTIFICATE_NO_PATTERN.test(value);
}

export function generateReferenceId(): string {
  const bytes = randomBytes(32);
  let out = "vw_";
  for (const byte of bytes) out += BASE32[byte & 31];
  return out;
}

export function generateCertificateNo(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (byte) => PUBLIC_ALPHABET[byte & 31]).join("");
  return `SP-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

function readReading(value: unknown): VisaReading | null {
  if (!isRecord(value)) return null;
  const { status, sacrifices, counsel, probability, panditReply } = value;
  if (typeof status !== "string" || typeof counsel !== "string" || typeof probability !== "string" || typeof panditReply !== "string") return null;
  if (!Array.isArray(sacrifices) || !sacrifices.every((item) => typeof item === "string")) return null;
  return { status, sacrifices, counsel, probability, panditReply };
}

function readRow(value: unknown): Row | null {
  if (!isRecord(value)) return null;
  const status = value.status;
  if (status !== "pending" && status !== "paid" && status !== "refunded") return null;
  const str = (key: string) => (typeof value[key] === "string" ? (value[key] as string) : null);
  const reference = str("reference_id");
  const certificate = str("certificate_no");
  const category = str("category");
  const country = str("country");
  const wish = str("wish");
  const created = str("created_at");
  if (!reference || !certificate || !category || !country || !wish || !created) return null;
  return {
    reference_id: reference,
    certificate_no: certificate,
    category,
    country,
    wish,
    first_name: str("first_name"),
    status,
    lemon_order_id: str("lemon_order_id"),
    paid_at: str("paid_at"),
    refunded_at: str("refunded_at"),
    reading: readReading(value.reading),
    created_at: created,
  };
}

type Store = {
  insert(row: Row): Promise<"ok" | "conflict">;
  find(column: "reference_id" | "certificate_no" | "lemon_order_id", value: string): Promise<Row | null>;
  markPaid(reference: string, orderId: string, at: string): Promise<"updated" | "unchanged" | "order_conflict">;
  markRefunded(orderId: string, at: string): Promise<boolean>;
  saveReading(reference: string, reading: VisaReading, at: string): Promise<boolean>;
};

type Memory = Map<string, Row>;

function memoryRows(): Memory {
  const holder = globalThis as typeof globalThis & { __visaMemory?: Memory };
  if (!holder.__visaMemory) holder.__visaMemory = new Map();
  return holder.__visaMemory;
}

const memoryStore: Store = {
  async insert(row) {
    const rows = memoryRows();
    for (const existing of rows.values()) {
      if (existing.reference_id === row.reference_id || existing.certificate_no === row.certificate_no) return "conflict";
    }
    rows.set(row.reference_id, { ...row });
    return "ok";
  },
  async find(column, value) {
    for (const row of memoryRows().values()) if (row[column] === value) return { ...row };
    return null;
  },
  async markPaid(reference, orderId, at) {
    const rows = memoryRows();
    for (const row of rows.values()) if (row.lemon_order_id === orderId && row.reference_id !== reference) return "order_conflict";
    const row = rows.get(reference);
    if (!row || row.status !== "pending") return "unchanged";
    rows.set(reference, { ...row, status: "paid", lemon_order_id: orderId, paid_at: at });
    return "updated";
  },
  async markRefunded(orderId, at) {
    const rows = memoryRows();
    for (const [key, row] of rows) {
      if (row.lemon_order_id === orderId && row.status === "paid") {
        rows.set(key, { ...row, status: "refunded", refunded_at: at });
        return true;
      }
    }
    return false;
  },
  async saveReading(reference, reading) {
    const rows = memoryRows();
    const row = rows.get(reference);
    if (!row || row.reading) return false;
    rows.set(reference, { ...row, reading });
    return true;
  },
};

const COLUMNS = "reference_id, certificate_no, category, country, wish, first_name, status, lemon_order_id, paid_at, refunded_at, reading, created_at";

const supabaseStore: Store = {
  async insert(row) {
    const { error } = await getServiceClient().from("visa_wishes").insert(row);
    if (!error) return "ok";
    if (error.code === "23505") return "conflict";
    throw new VisaStoreError(error.code ?? "insert");
  },
  async find(column, value) {
    const { data, error } = await getServiceClient().from("visa_wishes").select(COLUMNS).eq(column, value).maybeSingle();
    if (error) throw new VisaStoreError(error.code ?? "select");
    return readRow(data);
  },
  async markPaid(reference, orderId, at) {
    const { data, error } = await getServiceClient()
      .from("visa_wishes")
      .update({ status: "paid", lemon_order_id: orderId, paid_at: at })
      .eq("reference_id", reference)
      .eq("status", "pending")
      .select("reference_id");
    if (error?.code === "23505") return "order_conflict";
    if (error) throw new VisaStoreError(error.code ?? "update");
    return Array.isArray(data) && data.length > 0 ? "updated" : "unchanged";
  },
  async markRefunded(orderId, at) {
    const { data, error } = await getServiceClient()
      .from("visa_wishes")
      .update({ status: "refunded", refunded_at: at })
      .eq("lemon_order_id", orderId)
      .eq("status", "paid")
      .select("reference_id");
    if (error) throw new VisaStoreError(error.code ?? "update");
    return Array.isArray(data) && data.length > 0;
  },
  async saveReading(reference, reading, at) {
    const { data, error } = await getServiceClient()
      .from("visa_wishes")
      .update({ reading, reading_generated_at: at })
      .eq("reference_id", reference)
      .is("reading", null)
      .select("reference_id");
    if (error) throw new VisaStoreError(error.code ?? "update");
    return Array.isArray(data) && data.length > 0;
  },
};

function store(): Store | null {
  if (isSupabaseConfigured()) return supabaseStore;
  if (process.env.NODE_ENV === "production") return null;
  return memoryStore;
}

function requireStore(): Store {
  const selected = store();
  if (!selected) throw new VisaStoreUnavailable();
  return selected;
}

export function visaStoreAvailable(): boolean {
  return store() !== null;
}

function labelOf(categoryId: string): string {
  return isCategoryId(categoryId) ? categoryById(categoryId).label : categoryId;
}

function certificateOf(row: Row): VisaCertificate {
  return {
    certificateNo: row.certificate_no,
    categoryLabel: labelOf(row.category),
    country: row.country,
    wish: row.wish,
    firstName: row.first_name,
    issuedAt: row.paid_at ?? row.created_at,
  };
}

export async function createPendingVisaWish(input: {
  categoryId: CategoryId;
  country: string;
  wish: string;
  firstName: string | null;
}): Promise<{ referenceId: string; certificateNo: string }> {
  const target = requireStore();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row: Row = {
      reference_id: generateReferenceId(),
      certificate_no: generateCertificateNo(),
      category: input.categoryId,
      country: input.country,
      wish: input.wish,
      first_name: input.firstName,
      status: "pending",
      lemon_order_id: null,
      paid_at: null,
      refunded_at: null,
      reading: null,
      created_at: new Date().toISOString(),
    };
    if ((await target.insert(row)) === "ok") return { referenceId: row.reference_id, certificateNo: row.certificate_no };
  }
  throw new VisaStoreError("id_collision");
}

/** What the private page may show. Anything not paid carries no wish, reading, or certificate data. */
export async function getVisaView(referenceId: string): Promise<VisaView> {
  if (!isVisaReference(referenceId)) return { state: "missing" };
  const selected = store();
  if (!selected) return { state: "missing" };
  const row = await selected.find("reference_id", referenceId);
  if (!row) return { state: "missing" };
  if (row.status === "pending") return { state: "pending" };
  if (row.status === "refunded") return { state: "refunded" };
  return { state: "paid", certificate: certificateOf(row), reading: row.reading };
}

/** Public share view: paid only, never the wish text. */
export async function getSharedVisa(certificateNo: string): Promise<SharedVisa | null> {
  if (!isCertificateNo(certificateNo)) return null;
  const selected = store();
  if (!selected) return null;
  const row = await selected.find("certificate_no", certificateNo);
  if (!row || row.status !== "paid") return null;
  const certificate = certificateOf(row);
  return {
    certificateNo: certificate.certificateNo,
    categoryLabel: certificate.categoryLabel,
    country: certificate.country,
    firstName: certificate.firstName,
    issuedAt: certificate.issuedAt,
    reading: row.reading,
  };
}

/** Generates the reading once after payment and stores it; later views reuse the stored reading. */
export async function ensureVisaReading(referenceId: string): Promise<VisaReading | null> {
  const target = requireStore();
  const row = await target.find("reference_id", referenceId);
  if (!row || row.status !== "paid") return null;
  if (row.reading) return row.reading;
  const verdict = await generateVerdict(row.wish, { category: labelOf(row.category), country: row.country, visa: true });
  const reading: VisaReading = {
    status: verdict.algo_status,
    sacrifices: [...verdict.algo_sacrifices],
    counsel: verdict.algo_counsel,
    probability: verdict.algo_probability,
    panditReply: verdict.pandit_reply,
  };
  if (await target.saveReading(referenceId, reading, new Date().toISOString())) return reading;
  return (await target.find("reference_id", referenceId))?.reading ?? reading;
}

export type PaidOrderResult = { result: "issued" | "duplicate" | "unknown_reference"; certificateNo: string | null; detail: string };

/** Idempotent: the first verified paid order for a pending reference marks it paid; repeats are duplicates. */
export async function applyPaidOrder(input: { referenceId: string; orderId: string }): Promise<PaidOrderResult> {
  const target = requireStore();
  const seen = await target.find("lemon_order_id", input.orderId);
  if (seen) return { result: "duplicate", certificateNo: seen.certificate_no, detail: "order_seen" };
  const row = await target.find("reference_id", input.referenceId);
  if (!row) return { result: "unknown_reference", certificateNo: null, detail: "unknown_reference" };
  if (row.status !== "pending") return { result: "duplicate", certificateNo: row.certificate_no, detail: `already_${row.status}` };
  const outcome = await target.markPaid(input.referenceId, input.orderId, new Date().toISOString());
  if (outcome === "updated") return { result: "issued", certificateNo: row.certificate_no, detail: "marked_paid" };
  return { result: "duplicate", certificateNo: row.certificate_no, detail: outcome === "order_conflict" ? "order_constraint" : "race" };
}

export type RefundResult = { result: "revoked" | "already" | "not_found"; certificateNo: string | null };

export async function applyRefund(orderId: string): Promise<RefundResult> {
  const target = requireStore();
  const row = await target.find("lemon_order_id", orderId);
  if (!row) return { result: "not_found", certificateNo: null };
  if (row.status === "refunded") return { result: "already", certificateNo: row.certificate_no };
  const revoked = await target.markRefunded(orderId, new Date().toISOString());
  return { result: revoked ? "revoked" : "already", certificateNo: row.certificate_no };
}
