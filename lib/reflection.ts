import { sanitizeWish, type WishClean } from "@/lib/sanitizeWish";

const REFLECTION_MAX = 140;

export function sanitizeReflection(input: unknown): WishClean {
  if (typeof input !== "string") return { ok: false, code: "empty" };
  const cleaned = sanitizeWish(input.replace(/[\r\n]+/g, " "));
  if (!cleaned.ok) return cleaned;
  if (Array.from(cleaned.value).length > REFLECTION_MAX) return { ok: false, code: "long" };
  return cleaned;
}
