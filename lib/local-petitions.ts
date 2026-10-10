export type LocalPetition = {
  petitionId: string;
  wish: string;
  category: string;
  status: string;
  sacrifices: string[];
  counsel: string;
  probability: string;
  panditReply: string;
  createdAt: string;
};

export type LocalCertificate = {
  petitionId: string;
  name: string | null;
  lemonOrderId: string;
  issuedAt: string;
};

type Memory = { petitions: Map<string, LocalPetition>; certificates: Map<string, LocalCertificate> };

function memory(): Memory {
  const holder = globalThis as typeof globalThis & { __churchMemory?: Memory };
  if (!holder.__churchMemory) holder.__churchMemory = { petitions: new Map(), certificates: new Map() };
  return holder.__churchMemory;
}

export function saveLocalPetition(row: LocalPetition): void {
  memory().petitions.set(row.petitionId, row);
}

export function readLocalPetition(petitionId: string): LocalPetition | null {
  return memory().petitions.get(petitionId) ?? null;
}

export function listLocalPetitions(limit: number): LocalPetition[] {
  return [...memory().petitions.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
}

export function saveLocalCertificate(row: LocalCertificate): void {
  memory().certificates.set(row.petitionId, row);
}

export function readLocalCertificate(petitionId: string): LocalCertificate | null {
  return memory().certificates.get(petitionId) ?? null;
}
