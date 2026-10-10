// Assumptions: hologram captions. Exact user strings where specified. Never lip-sync.
// The tip reminder is a joke overlay; it must not block navigation or imply a debt.

export const hologram = {
  welcome: "Welcome, seeker. Place your wish before me.",
  processing: "The desk has your wish. The Algorithm is writing.",
  tipReminder: "YOU MUST LEAVE A TIP... OR PANDIT WILL BE ANGRY!",
  tipJoke: "This is a joke. Your reading is already yours. An offering is optional entertainment, not a fee you owe.",
  offeringReceived: "The Pandit acknowledges your offering. May your journey be enlightening.",
  replay: "REPLAY GREETING",
  offeringCta: "MAKE AN OFFERING",
  premiumCta: "EXPLORE PREMIUM",
  noLipSync: "Still image with light. Not a conversation.",
} as const;
