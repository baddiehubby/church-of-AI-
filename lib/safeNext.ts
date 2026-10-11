export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return "/";
  if (value.length > 200 || /[\s@]/.test(value)) return "/";
  return value;
}
