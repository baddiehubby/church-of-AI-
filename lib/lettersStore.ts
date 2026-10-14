// Stored monthly letters. Service role only.

import "server-only";

import { randomUUID } from "node:crypto";

import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type LetterRecord = {
  id: string;
  settler_id: string;
  month: string;
  body: string;
  created_at: string;
};

const memoryLetters: LetterRecord[] = [];

export function resetLetterMemory(): void {
  memoryLetters.length = 0;
}

export async function upsertLetter(input: {
  settler_id: string;
  month: string;
  body: string;
}): Promise<LetterRecord> {
  if (!isSupabaseConfigured()) {
    const existing = memoryLetters.find(
      (row) => row.settler_id === input.settler_id && row.month === input.month,
    );
    if (existing) {
      existing.body = input.body;
      return existing;
    }
    const row: LetterRecord = {
      id: randomUUID(),
      settler_id: input.settler_id,
      month: input.month,
      body: input.body,
      created_at: new Date().toISOString(),
    };
    memoryLetters.push(row);
    return row;
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("letters")
    .upsert(
      {
        settler_id: input.settler_id,
        month: input.month,
        body: input.body,
      },
      { onConflict: "settler_id,month" },
    )
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("letter upsert failed");
  return {
    id: String(data.id),
    settler_id: String(data.settler_id),
    month: String(data.month),
    body: String(data.body),
    created_at: String(data.created_at),
  };
}

export async function getLetter(settlerId: string, month: string): Promise<LetterRecord | null> {
  if (!isSupabaseConfigured()) {
    return memoryLetters.find((row) => row.settler_id === settlerId && row.month === month) ?? null;
  }
  const db = getServiceClient();
  const { data } = await db
    .from("letters")
    .select("*")
    .eq("settler_id", settlerId)
    .eq("month", month)
    .maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    settler_id: String(data.settler_id),
    month: String(data.month),
    body: String(data.body),
    created_at: String(data.created_at),
  };
}
