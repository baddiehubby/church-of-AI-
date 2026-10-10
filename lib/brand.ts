// Assumptions: one brand for every surface. NEXT_PUBLIC_URL is the public origin (no trailing slash) and every
// absolute URL (Lemon redirects, receipt links, OG images, emails) is built from it. Empty env strings fall back.

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Sacha Pandit",
  founder: "Sacha Pandit",
  domain: "sachapandit.com",
  url: process.env.NEXT_PUBLIC_URL ?? "https://sachapandit.com",
} as const;

export function brandName(): string {
  return BRAND.name.trim() || "Sacha Pandit";
}

export function appUrl(): string {
  return (BRAND.url.trim() || "https://sachapandit.com").replace(/\/+$/, "");
}

export function brandHostname(): string {
  try {
    return new URL(appUrl()).hostname;
  } catch {
    return BRAND.domain;
  }
}

export function mailbox(local: "report" | "church" | "hello"): string {
  return `${local}@${BRAND.domain}`;
}
