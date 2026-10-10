// Assumptions: hologram mood is CSS on the existing still. No lip-sync, no conversation, no audio.
// Reduced-motion and first-paint: the photoreal still is server-rendered; overlays hydrate later.

export type HologramMood = "idle" | "welcome" | "processing" | "tip-reminder" | "offering-received";

export const HOLOGRAM_EVENT = "sp-hologram";
export const HOLOGRAM_AWAIT_KEY = "sp_await_offering";
export const HOLOGRAM_PETITION_KEY = "sp_last_petition";
export const HOLOGRAM_WELCOMED_KEY = "sp_welcomed";

export function hologramMotionEnabled(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion;
}

export function hologramFallbackClass(prefersReducedMotion: boolean): "hologram-static" | "hologram-live" {
  return hologramMotionEnabled(prefersReducedMotion) ? "hologram-live" : "hologram-static";
}

export function rememberFreeReading(petitionId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(HOLOGRAM_AWAIT_KEY, "1");
  sessionStorage.setItem(HOLOGRAM_PETITION_KEY, petitionId);
}

export function clearAwaitingOffering(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(HOLOGRAM_AWAIT_KEY);
}

export function lastPetitionId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const id = sessionStorage.getItem(HOLOGRAM_PETITION_KEY);
  return id && id.length > 0 ? id : null;
}

export function awaitingOffering(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(HOLOGRAM_AWAIT_KEY) === "1";
}

export function announceHologram(mood: HologramMood): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOLOGRAM_EVENT, { detail: { mood } }));
}
