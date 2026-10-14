// Transmission body only. Trim, cap, strip tags, reject empty noise.

const MAX = 280;

export function sanitizeBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const stripped = raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return null;
  return stripped.slice(0, MAX);
}
