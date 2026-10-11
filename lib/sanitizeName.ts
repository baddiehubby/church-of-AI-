// Assumptions: names (certificate name, optional visa first name) are printed on pages and images, always as text
// (never HTML). Strip tags and control characters, collapse whitespace, count length in code points. Abuse guard:
// no URLs or domain-like tokens, no @mentions, and no run of 3+ identical letters/digits ("aaa" rejected;
// punctuation like "..." is exempt). Cap stays 40. No imports so tests can load it directly.

export const NAME_MAX = 40;
export const NAME_ERROR = "THE NAME CANNOT BE FILED.";

export type NameResult = { ok: true; value: string } | { ok: false; error: string };

const URL_LIKE = /https?:\/\/|www\.|\b[\p{L}\p{N}-]+\.[a-z]{2,}\b/iu;
const MENTION = /(^|[^\p{L}\p{N}])@[\p{L}\p{N}_]/u;
const REPEAT_3 = /([\p{L}\p{N}])\1{2,}/iu;

export function sanitizeName(input: unknown): NameResult {
  if (typeof input !== "string") return { ok: false, error: NAME_ERROR };
  const cleaned = input
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F\u200B\u200C\u2060\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const length = Array.from(cleaned).length;
  if (length < 1 || length > NAME_MAX) return { ok: false, error: NAME_ERROR };
  if (URL_LIKE.test(cleaned) || MENTION.test(cleaned) || REPEAT_3.test(cleaned)) {
    return { ok: false, error: NAME_ERROR };
  }
  return { ok: true, value: cleaned };
}
