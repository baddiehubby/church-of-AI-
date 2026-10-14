// Transmission journal types.
// settler_id is a public pick-seed label. owner_id is the unguessable ownership key.

import {
  WANDERER_MEMORY_MS,
  type SettlerTier,
} from "@/lib/settlerTiers";

export type { SettlerTier } from "@/lib/settlerTiers";

export type TransmissionRecord = {
  id: string;
  owner_id: string;
  settler_id: string;
  sol: number;
  body: string;
  baba_opening: string;
  algo_status: string;
  algo_counsel: string;
  algo_probability: string;
  baba_translation: string;
  baba_forecast: string;
  is_pause: boolean;
  preserved: boolean;
  created_at: string;
};

export type PublicTransmission = Omit<TransmissionRecord, "owner_id">;

export type ArchiveTransmission = PublicTransmission & {
  number: number;
  faded: boolean;
};

export type ColonyStatus = {
  settlers_active_today: number;
  transmissions_since_sunrise: number;
  streaks_broken_yesterday: number;
  founders_inducted: number;
  founders_remaining: number;
};

export type ArchivePayload = {
  settler_id: string;
  tier: SettlerTier;
  total: number;
  earth_km: string;
  transmissions: ArchiveTransmission[];
  next_cursor: string | null;
  colony?: ColonyStatus;
  /** ISO timestamp when the seat was opened — used for the 30-day practice pitch. */
  settler_since?: string | null;
};

/** @deprecated Prefer WANDERER_MEMORY_MS — same seven-day window. */
export const PILGRIM_MEMORY_MS = WANDERER_MEMORY_MS;
export { WANDERER_MEMORY_MS };

export const ARCHIVE_PAGE_SIZE = 20;
