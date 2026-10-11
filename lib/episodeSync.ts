"use client";

export async function syncEpisode(): Promise<void> {
  try {
    const { deskId, loadMail, loadSittings } = await import("@/lib/altarSittings");
    const id = deskId();
    if (!id) return;
    await fetch("/api/episode/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        email: loadMail(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        sittings: loadSittings(),
      }),
    });
  } catch {
    return;
  }
}
