// Assumptions: Premium checkout must send an explicit consent flag. Unchecked is the default.
// The UI disables the button; the server still rejects a body without consent.

export function premiumConsentGiven(value: unknown): boolean {
  return value === true || value === "1" || value === "on" || value === "yes";
}
