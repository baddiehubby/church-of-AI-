export type WishClean =
  | { ok: true; value: string }
  | { ok: false; code: "empty" | "long" | "url" | "mention" | "repeat" | "emoji" };

const URL_PATTERN = /\b(?:https?:\/\/|www\.)|\b[\w-]+\.(?:com|net|org|io|co|xyz|app|church|dev|ai)\b/i;

export function stripWish(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The repeat rule applies to letters and digits only.
 * An ellipsis ("...") is punctuation, so it does not get a wish rejected.
 */
const REPEAT_LETTERS_OR_DIGITS = /(\p{L}|\p{N})\1{2,}/u;

export function sanitizeWish(input: unknown): WishClean {
  if (typeof input !== "string") return { ok: false, code: "empty" };
  const wish = stripWish(input);
  if (!wish) return { ok: false, code: "empty" };
  if (wish.length > 280) return { ok: false, code: "long" };
  if (URL_PATTERN.test(wish)) return { ok: false, code: "url" };
  if (/@/.test(wish)) return { ok: false, code: "mention" };
  if (REPEAT_LETTERS_OR_DIGITS.test(wish)) return { ok: false, code: "repeat" };
  const emoji = wish.match(/\p{Extended_Pictographic}/gu) ?? [];
  if (emoji.length > 3) return { ok: false, code: "emoji" };
  return { ok: true, value: wish };
}
