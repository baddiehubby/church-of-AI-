// Assumptions: pre-launch safety copy only. Rate-limit 429s are Pandit ji (lowercase, warm, one line).
// Occupied is the exact line shown when the register cannot be read. Report mail uses petition_id only.

export const rateLimitCopy = {
  wish: "slow down, beta. the desk already heard you.",
  checkout: "slow down, beta. the desk already heard you.",
} as const;

export const occupiedCopy = {
  message: "the Algorithm is occupied. try again in a moment, beta.",
  retry: "try again",
} as const;

export const reportPetition = {
  label: "report this petition",
  subject: (petitionId: string) => `report this petition ${petitionId}`,
  body: (petitionId: string) => `please review this petition.\n\npetition_id: ${petitionId}\n`,
};

export function reportPetitionMailto(mailbox: string, petitionId: string): string {
  return `mailto:${mailbox}?subject=${encodeURIComponent(reportPetition.subject(petitionId))}&body=${encodeURIComponent(reportPetition.body(petitionId))}`;
}
