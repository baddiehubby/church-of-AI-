// Browser session for the altar. Settler id, Mars sol, clock label, Earth distance.
// The displayed clock is simulated interface metadata — not a true Mars local conversion.

/** Documented Mars epoch for sol numbering (UTC). */
export const MARS_EPOCH = new Date("2024-01-01T00:00:00Z");

/** Mean Martian sol length in milliseconds (~24h 39m 35.244s). */
export const MS_PER_SOL = 88775.244 * 1000;

/** Illustrative display value. Not a live astronomical calculation. */
export const EARTH_DISTANCE_KM = 225_000_000;

export const SETTLER_KEY = "settler_id";

const SETTLER_PATTERN = /^SOUL-[0-9A-F]{4}-[0-9A-F]{2}$/;

export function isSettlerId(value: string): boolean {
  return SETTLER_PATTERN.test(value.trim().toUpperCase());
}

/**
 * Sol index since MARS_EPOCH.
 * Boundaries: epoch → 0; epoch + one sol − 1ms → 0; epoch + one sol → 1.
 */
export function currentSol(now = Date.now()): number {
  const elapsed = now - MARS_EPOCH.getTime();
  if (elapsed < 0) return 0;
  return Math.floor(elapsed / MS_PER_SOL);
}

/** Simulated interface clock from UTC hours/minutes. Not a Mars-time conversion. */
export function marsLocalTimeLabel(now = new Date()): string {
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Habitat chrome. Clock is UTC hours labeled MARS LOCAL — real conversion is out of scope. */
export function habitatBar(sol: number, time: string): string {
  return `HABITAT 47 · SOL ${sol} · ${time} MARS LOCAL`;
}

export function earthDistanceLine(km = EARTH_DISTANCE_KM): string {
  return `EARTH IS ${km.toLocaleString("en-US")} KM AWAY.`;
}

function syncSettlerCookie(id: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${SETTLER_KEY}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookie blocked; localStorage still holds the id for client routes.
  }
}

/** Anonymous local label only. Not authentication. */
export function makeSettlerId(): string {
  const raw =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").toUpperCase()
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.toUpperCase();
  return `SOUL-${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
}

/**
 * Stable anonymous settler id for picks. Client-only.
 * Call after mount — never during SSR — to avoid hydration mismatches.
 */
export function getSettlerId(): string {
  if (typeof window === "undefined") {
    throw new Error("getSettlerId is browser-only");
  }
  try {
    const existing = window.localStorage.getItem(SETTLER_KEY)?.trim().toUpperCase() ?? "";
    if (isSettlerId(existing)) {
      syncSettlerCookie(existing);
      return existing;
    }
    const next = makeSettlerId();
    window.localStorage.setItem(SETTLER_KEY, next);
    syncSettlerCookie(next);
    return next;
  } catch {
    return makeSettlerId();
  }
}
