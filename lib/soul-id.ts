import { randomBytes } from "node:crypto";

const PETITION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const PETITION_ID_PATTERN = /^SOUL-[A-Z2-9]{4}-[A-Z2-9]{2}$/;
export const SOUL_ID_PATTERN = /^SOUL-[0-9A-F]{4}-[A-Z0-9]{2}$/;

export function isPetitionId(value: string): boolean {
  return PETITION_ID_PATTERN.test(value);
}

export function isSoulId(value: string): boolean {
  return SOUL_ID_PATTERN.test(value);
}

function pullAlphabet(count: number): string {
  let out = "";
  while (out.length < count) {
    const bytes = randomBytes(count);
    for (const byte of bytes) {
      const char = PETITION_ALPHABET[byte % PETITION_ALPHABET.length];
      if (char) out += char;
      if (out.length === count) break;
    }
  }
  return out;
}

export function generatePetitionId(): string {
  return `SOUL-${pullAlphabet(4)}-${pullAlphabet(2)}`;
}

export function generateSoulId(): string {
  return generatePetitionId();
}
